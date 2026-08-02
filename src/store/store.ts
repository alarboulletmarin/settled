/* ============================================================================
 * L'état de l'app.
 *
 * Le document est hydraté une fois au démarrage et vit en mémoire ; chaque
 * mutation le remplace et programme une écriture en debounce. Aucun composant
 * ne modifie `data` autrement qu'en appelant une action d'ici.
 * ==========================================================================*/

import { create } from 'zustand'
import { type YearMonth, currentYm, today } from '@/domain/date'
import { makeId } from '@/domain/ids'
import { openMonth } from '@/domain/updates'
import type { Data, ThemeSetting } from '@/domain/types'
import { clearDocument, createWriter, loadDocument, saveDocument } from '@/persistence/db'
import { emptyData } from '@/persistence/defaults'
import { readStoredPreference, storePreference } from '@/theme/theme'

export type AppStatus = 'loading' | 'onboarding' | 'ready'

/**
 * Ce qu'on regarde du mois. Trois lectures, et non deux.
 *
 * Le foyer se découpe de deux façons, et elles ne se recouvrent pas :
 *
 *     foyer = commun + les lignes perso de chacun     (par propriété)
 *     foyer = la vue de chaque membre, additionnée    (par personne)
 *
 * `member` relève du second — ses lignes plus sa part du commun, si bien que la
 * somme des vues vaut le foyer. `common` relève du premier : le pot seul, à son
 * montant plein, qui n'appartient à personne. Les confondre était l'ambiguïté
 * d'une seule pilule « Tout le foyer » qui voulait dire « tout » ici et « le
 * commun » sur l'écran de saisie.
 *
 * Type discriminé plutôt qu'un `string | undefined` avec une valeur convenue :
 * un membre s'appelle par un identifiant, et rien n'aurait empêché de le
 * confondre avec le mot qui désigne le pot.
 */
export type MonthFilter =
  | { kind: 'all' }
  | { kind: 'common' }
  | { kind: 'member'; memberId: string }

export const ALL_FILTER: MonthFilter = { kind: 'all' }

export type StoreState = {
  status: AppStatus
  data: Data
  /** Mois affiché. Toujours un mois valide, jamais dérivé d'un composant. */
  ym: YearMonth
  /** Portée de lecture commune à tous les tableaux de bord. */
  filter: MonthFilter
  /** Dernière erreur de persistance, à afficher telle quelle. */
  error: string | null
}

export type StoreActions = {
  hydrate: () => Promise<void>
  /** Remplace le document. Le seul point d'écriture de `data`. */
  mutate: (recipe: (data: Data) => Data) => void
  setYm: (ym: YearMonth) => void
  setFilter: (filter: MonthFilter) => void
  setTheme: (theme: ThemeSetting) => void
  finishOnboarding: () => void
  /**
   * Ouvre un mois s'il ne l'a jamais été, à condition qu'il ne soit pas passé.
   * Idempotent.
   */
  ensureMonthOpen: (ym?: YearMonth) => void
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
  filter: ALL_FILTER,
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
      // Cahier §4.3 : l'ouverture est déclenchée au premier lancement du mois.
      get().ensureMonthOpen()
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
    // Consulter un mois à venir suffit à le peupler. Sans quoi il s'affiche
    // vide — pas d'échéance au calendrier, rien dans le prévisionnel — alors
    // que les récurrences qui doivent y tomber sont déjà connus.
    get().ensureMonthOpen(ym)
  },

  setFilter(filter) {
    set({ filter })
  },

  setTheme(theme) {
    storePreference(theme)
    get().mutate((data) => ({ ...data, settings: { ...data.settings, theme } }))
  },

  finishOnboarding() {
    set({ status: 'ready' })
    get().ensureMonthOpen()
    writer.schedule(get().data)
  },

  ensureMonthOpen(ym = currentYm()) {
    // Un mois passé ne s'ouvre pas tout seul : y faire apparaître des
    // échéances qui n'ont jamais été confirmées inventerait un historique.
    if (ym < currentYm()) return
    if (get().status !== 'ready') return
    if (get().data.months.some((m) => m.ym === ym)) return
    get().mutate((data) => openMonth(data, ym, makeId, today()).data)
  },

  async replaceData(data) {
    writer.cancel()
    storePreference(data.settings.theme)
    set({ data, status: 'ready', error: null, ym: currentYm(), filter: ALL_FILTER })
    // Le fichier importé peut dater : le mois courant n'y est pas forcément.
    get().ensureMonthOpen()
    await saveDocument(get().data)
  },

  async resetAll() {
    writer.cancel()
    await clearDocument()
    const fresh = emptyData()
    storePreference(fresh.settings.theme)
    set({ data: fresh, status: 'onboarding', error: null, ym: currentYm(), filter: ALL_FILTER })
  },

  setError(message) {
    set({ error: message })
  },

  async flush() {
    await writer.flush()
  },
}))
