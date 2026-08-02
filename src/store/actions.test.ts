import { beforeEach, describe, expect, it } from 'vitest'
import { makeData, makeEntry } from '@/domain/fixtures'
import { useToasts } from '@/ui/toast'
import { removeEntry, undoable } from './actions'
import { useStore } from './store'

const LOYER = makeEntry({ date: '2026-07-05', label: 'Loyer' })
const COURSES = makeEntry({ date: '2026-07-08', label: 'Courses' })

const labels = (): string[] => useStore.getState().data.entries.map((e) => e.label)
const pending = () => useToasts.getState().toasts.at(-1)

beforeEach(() => {
  useToasts.setState({ toasts: [] })
  /* En `onboarding`, `mutate` ne programme aucune écriture : ce qui se teste
     ici est le retour arrière, pas la persistance, qui a ses propres tests. */
  useStore.setState({ status: 'onboarding', data: makeData({ entries: [LOYER, COURSES] }) })
})

describe('undoable', () => {
  it('fait le geste, l’annonce, et propose de le défaire', () => {
    undoable('Dépense supprimée', () => {
      removeEntry(LOYER.id)
    })

    expect(labels()).toEqual(['Courses'])
    expect(pending()?.message).toBe('Dépense supprimée')
    expect(pending()?.action).toBeDefined()
  })

  it('remet le document exactement dans l’état d’avant', () => {
    const before = useStore.getState().data

    undoable('Dépense supprimée', () => {
      removeEntry(LOYER.id)
    })
    pending()?.action?.onAction()

    /* Toutes les mutations du domaine sont pures : le document d'avant est
       encore là, intact. Le reposer *est* l'annulation exacte du geste — d'où
       l'égalité de référence, et pas seulement de contenu. */
    expect(useStore.getState().data).toBe(before)
  })

  /* L'instantané porte le document d'avant : le reposer par-dessus une
     modification survenue depuis l'emporterait avec lui. L'offre disparaît donc
     à la mutation suivante, et le message reste — ce qu'il annonce a eu lieu. */
  it('retire l’offre dès que le document change, sans retirer le message', () => {
    undoable('Dépense supprimée', () => {
      removeEntry(LOYER.id)
    })

    removeEntry(COURSES.id)

    const stale = useToasts.getState().toasts.find((t) => t.message === 'Dépense supprimée')
    expect(stale).toBeDefined()
    expect(stale?.action).toBeUndefined()
  })

  it('ne se rejoue pas : défaire retire l’offre de défaire', () => {
    undoable('Dépense supprimée', () => {
      removeEntry(LOYER.id)
    })
    pending()?.action?.onAction()

    expect(useToasts.getState().toasts.every((t) => t.action === undefined)).toBe(true)
    expect(labels()).toEqual(['Loyer', 'Courses'])
  })
})
