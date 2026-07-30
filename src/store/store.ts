/* ============================================================================
 * L'état de l'app.
 *
 * Le document est hydraté une fois au démarrage et vit en mémoire ; chaque
 * mutation le remplace et programme une écriture en debounce. Aucun composant
 * ne modifie `data` autrement qu'en appelant une action d'ici.
 * ==========================================================================*/

import { create } from 'zustand'
import { type YearMonth, currentYm } from '@/domain/date'
import type { Data, ThemeSetting } from '@/domain/types'
import { clearDocument, createWriter, loadDocument, saveDocument } from '@/persistence/db'
import { emptyData } from '@/persistence/defaults'
import { readStoredPreference, storePreference } from '@/theme/theme'

export type AppStatus = 'loading' | 'onboarding' | 'ready'

export type StoreState = {
  status: AppStatus
  data: Data
  /** Mois affiché. Toujours un mois valide, jamais dérivé d'un composant. */
  ym: YearMonth
  /** Filtre par membre commun à tous les tableaux de bord. undefined = foyer. */
  memberFilter: string | undefined
  /** Dernière erreur de persistance, à afficher telle quelle. */
  error: string | null
}

export type StoreActions = {
  hydrate: () => Promise<void>
  /** Remplace le document. Le seul point d'écriture de `data`. */
  mutate: (recipe: (data: Data) => Data) => void
  setYm: (ym: YearMonth) => void
  setMemberFilter: (memberId: string | undefined) => void
  setTheme: (theme: ThemeSetting) => void
  finishOnboarding: () => void
  replaceData: (data: Data) => Promise<void>
  resetAll: () => Promise<void>
  setError: (message: string | null) => void
  flush: () => Promise<void>
}

export type Store = StoreState & StoreActions

const writer = createWriter()

/**
 * Document de départ. Le thème reprend le miroir localStorage pour que rien ne
 * clignote entre le premier rendu et la fin de l'hydratation.
 */
function initialData(): Data {
  const data = emptyData()
  return { ...data, settings: { ...data.settings, theme: readStoredPreference() } }
}

export const useStore = create<Store>()((set, get) => ({
  status: 'loading',
  data: initialData(),
  ym: currentYm(),
  memberFilter: undefined,
  error: null,

  async hydrate() {
    try {
      const stored = await loadDocument()
      if (stored === null) {
        set({ status: 'onboarding', data: initialData() })
        return
      }
      storePreference(stored.settings.theme)
      set({ status: 'ready', data: stored })
    } catch {
      set({
        status: 'onboarding',
        error: "Les données n'ont pas pu être lues. Tu peux repartir de zéro ou importer un export.",
      })
    }
  },

  mutate(recipe) {
    const next = recipe(get().data)
    set({ data: next })
    writer.schedule(next)
  },

  setYm(ym) {
    set({ ym })
  },

  setMemberFilter(memberId) {
    set({ memberFilter: memberId })
  },

  setTheme(theme) {
    storePreference(theme)
    get().mutate((data) => ({ ...data, settings: { ...data.settings, theme } }))
  },

  finishOnboarding() {
    set({ status: 'ready' })
    writer.schedule(get().data)
  },

  async replaceData(data) {
    writer.cancel()
    storePreference(data.settings.theme)
    set({ data, status: 'ready', error: null, ym: currentYm(), memberFilter: undefined })
    await saveDocument(data)
  },

  async resetAll() {
    writer.cancel()
    await clearDocument()
    const fresh = emptyData()
    storePreference(fresh.settings.theme)
    set({ data: fresh, status: 'onboarding', error: null, ym: currentYm(), memberFilter: undefined })
  },

  setError(message) {
    set({ error: message })
  },

  async flush() {
    await writer.flush()
  },
}))
