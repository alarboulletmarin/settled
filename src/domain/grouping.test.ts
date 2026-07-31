import { describe, expect, it } from 'vitest'
import { eur, makeEntry, makeRecurrence } from './fixtures'
import { NO_MEMBER, groupEntries, groupRecurrences } from './grouping'
import type { Recurrence } from './types'

const july = [
  makeEntry({ id: 'a', date: '2026-07-05', amount: eur(95_000), categoryId: 'logement' }),
  makeEntry({ id: 'b', date: '2026-07-05', amount: eur(4_000), categoryId: 'courses' }),
  makeEntry({ id: 'c', date: '2026-07-12', amount: eur(12_000), categoryId: 'courses', memberId: 'm-1' }),
  makeEntry({
    id: 'd', date: '2026-07-28', direction: 'in', amount: eur(250_000),
    categoryId: 'salaire', memberId: 'm-2',
  }),
]

describe('regroupement par jour', () => {
  it('rassemble les entrées d’un même jour', () => {
    const groups = groupEntries(july, 'day')
    expect(groups.map((g) => g.key)).toEqual(['2026-07-28', '2026-07-12', '2026-07-05'])
    expect(groups[2]?.entries.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('va du plus récent au plus ancien', () => {
    expect(groupEntries(july, 'day')[0]?.key).toBe('2026-07-28')
  })

  it('rend un solde, pas une somme', () => {
    const mixed = [
      makeEntry({ id: 'x', date: '2026-07-05', direction: 'in', amount: eur(250_000) }),
      makeEntry({ id: 'y', date: '2026-07-05', amount: eur(95_000) }),
    ]
    expect(groupEntries(mixed, 'day')[0]?.total).toBe(155_000)
  })
})

describe('regroupement par catégorie', () => {
  it('range le plus gros mouvement en tête', () => {
    const groups = groupEntries(july, 'category')
    expect(groups.map((g) => g.key)).toEqual(['salaire', 'logement', 'courses'])
  })

  it('cumule une catégorie éclatée sur plusieurs jours', () => {
    const courses = groupEntries(july, 'category').find((g) => g.key === 'courses')
    expect(courses?.entries).toHaveLength(2)
    expect(courses?.total).toBe(-16_000)
  })
})

describe('regroupement par membre', () => {
  it('range ce que personne ne s’est attribué sous une clé à part', () => {
    const groups = groupEntries(july, 'member')
    expect(groups.map((g) => g.key).sort()).toEqual([NO_MEMBER, 'm-1', 'm-2'].sort())
    expect(groups.find((g) => g.key === NO_MEMBER)?.entries.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('range le plus gros mouvement en tête, entrée ou sortie', () => {
    expect(groupEntries(july, 'member')[0]?.key).toBe('m-2')
  })
})

describe('regroupement des récurrences', () => {
  const MONTHLY = { unit: 'month' as const, every: 1, anchorDay: 5 }
  const priced = (over: Partial<Recurrence> & { id: string }, monthly: number | null) => ({
    recurrence: makeRecurrence({ period: MONTHLY, ...over }),
    monthly: monthly === null ? null : eur(monthly),
  })

  const rows = [
    priced({ id: 'loyer', categoryId: 'logement' }, 95_000),
    priced({ id: 'netflix', categoryId: 'loisirs', memberId: 'm-1' }, 1_399),
    priced({ id: 'elec', categoryId: 'logement' }, 9_310),
    priced({ id: 'salaire', categoryId: 'salaire', direction: 'in', memberId: 'm-2' }, 250_000),
  ]

  it('met ce qui sort avant ce qui rentre', () => {
    expect(groupRecurrences(rows, 'direction').map((g) => g.key)).toEqual(['out', 'in'])
  })

  it('rend un solde mensuel par groupe', () => {
    const groups = groupRecurrences(rows, 'direction')
    expect(groups[0]?.monthly).toBe(-105_709)
    expect(groups[1]?.monthly).toBe(250_000)
  })

  it('cumule une famille de charges sous sa catégorie', () => {
    const logement = groupRecurrences(rows, 'category').find((g) => g.key === 'logement')
    expect(logement?.rows).toHaveLength(2)
    expect(logement?.monthly).toBe(-104_310)
  })

  it('range le plus gros mouvement en tête, hors regroupement par sens', () => {
    expect(groupRecurrences(rows, 'category')[0]?.key).toBe('salaire')
    expect(groupRecurrences(rows, 'member')[0]?.key).toBe('m-2')
  })

  it('range ce que personne ne porte sous une clé à part', () => {
    const foyer = groupRecurrences(rows, 'member').find((g) => g.key === NO_MEMBER)
    expect(foyer?.rows.map((r) => r.recurrence.id)).toEqual(['loyer', 'elec'])
  })

  it('compte à part ce qu’on ne sait pas chiffrer, plutôt que de le valoriser à zéro', () => {
    const withUnknown = [...rows, priced({ id: 'eau', categoryId: 'logement' }, null)]
    const logement = groupRecurrences(withUnknown, 'category').find((g) => g.key === 'logement')
    expect(logement?.unknownCount).toBe(1)
    expect(logement?.monthly).toBe(-104_310)
  })

  it('garde l’ordre reçu à l’intérieur d’un groupe', () => {
    const logement = groupRecurrences(rows, 'category').find((g) => g.key === 'logement')
    expect(logement?.rows.map((r) => r.recurrence.id)).toEqual(['loyer', 'elec'])
  })
})

describe('cas limites', () => {
  it('ne rend aucun groupe sans entrée', () => {
    expect(groupEntries([], 'day')).toEqual([])
  })

  it('n’oublie aucune entrée, quel que soit l’axe', () => {
    for (const by of ['day', 'category', 'member'] as const) {
      const count = groupEntries(july, by).reduce((n, g) => n + g.entries.length, 0)
      expect(count).toBe(july.length)
    }
  })
})
