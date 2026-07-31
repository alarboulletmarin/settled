import { describe, expect, it } from 'vitest'
import { eur, makeEntry } from './fixtures'
import { NO_MEMBER, groupEntries } from './grouping'

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
