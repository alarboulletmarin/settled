import { describe, expect, it } from 'vitest'
import { eur, makeEntry } from './fixtures'
import {
  compareMonths,
  coveredYears,
  hasDataInYear,
  monthSeries,
  splitDeltas,
  trailingMonths,
  yearHorizon,
  yearSeries,
} from './history'

const entries = [
  makeEntry({ date: '2026-05-01', direction: 'in', amount: eur(200000) }),
  makeEntry({ date: '2026-05-10', direction: 'out', amount: eur(50000), categoryId: 'logement' }),
  makeEntry({ date: '2026-07-01', direction: 'in', amount: eur(240000) }),
  makeEntry({ date: '2026-07-05', direction: 'out', amount: eur(95000), categoryId: 'logement' }),
  makeEntry({ date: '2026-07-08', direction: 'out', amount: eur(12000), categoryId: 'courses' }),
]

describe('série mensuelle', () => {
  it('produit un point par mois, sans trou', () => {
    const series = monthSeries(entries, '2026-05', '2026-08')
    expect(series.map((p) => p.ym)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08'])
  })

  it('signale les mois vides plutôt que de les omettre', () => {
    const series = monthSeries(entries, '2026-05', '2026-08')
    expect(series.map((p) => p.hasData)).toEqual([true, false, true, false])
  })

  it('calcule entrées, sorties et solde', () => {
    const july = monthSeries(entries, '2026-07', '2026-07')[0]
    expect(july).toMatchObject({ in: 240000, out: 107000, balance: 133000 })
  })

  it('renvoie une série entièrement vide quand il n’y a aucune donnée', () => {
    const series = monthSeries([], '2026-01', '2026-03')
    expect(series).toHaveLength(3)
    expect(series.every((p) => !p.hasData && p.balance === 0)).toBe(true)
  })

  it('renvoie les douze derniers mois, mois de fin inclus', () => {
    const series = trailingMonths(entries, '2026-07')
    expect(series).toHaveLength(12)
    expect(series[0]?.ym).toBe('2025-08')
    expect(series.at(-1)?.ym).toBe('2026-07')
  })

  it('se comporte correctement avec un seul mois de données', () => {
    const single = [makeEntry({ date: '2026-07-01', direction: 'in', amount: eur(1000) })]
    const series = trailingMonths(single, '2026-07')
    expect(series.filter((p) => p.hasData)).toHaveLength(1)
    expect(series.at(-1)?.in).toBe(1000)
  })
})

describe('comparaison de deux mois', () => {
  it('donne l’écart par catégorie, en valeur et en proportion', () => {
    const deltas = compareMonths(entries, '2026-05', '2026-07')
    const logement = deltas.find((d) => d.categoryId === 'logement')
    expect(logement).toMatchObject({ left: 50000, right: 95000, delta: 45000 })
    expect(logement?.deltaRatio).toBeCloseTo(0.9, 10)
  })

  it('inclut une catégorie absente d’un des deux mois', () => {
    const courses = compareMonths(entries, '2026-05', '2026-07').find(
      (d) => d.categoryId === 'courses',
    )
    expect(courses).toMatchObject({ left: 0, right: 12000, delta: 12000 })
  })

  it('ne divise pas par zéro : la proportion est nulle, pas infinie', () => {
    const courses = compareMonths(entries, '2026-05', '2026-07').find(
      (d) => d.categoryId === 'courses',
    )
    expect(courses?.deltaRatio).toBeNull()
  })

  it('classe par ampleur d’écart', () => {
    const deltas = compareMonths(entries, '2026-05', '2026-07')
    expect(deltas.map((d) => d.categoryId)).toEqual(['logement', 'courses'])
  })

  it('ne renvoie rien quand les deux mois sont vides', () => {
    expect(compareMonths(entries, '2026-01', '2026-02')).toEqual([])
  })
})

describe('partage des écarts', () => {
  /* Une catégorie au même montant des deux côtés n'apprend rien tant qu'elle
     est mêlée aux autres : c'est elle qu'on met de côté, pas l'inverse. */
  const stable = [
    makeEntry({ date: '2026-05-02', direction: 'out', amount: eur(30000), categoryId: 'assurance' }),
    makeEntry({ date: '2026-07-02', direction: 'out', amount: eur(30000), categoryId: 'assurance' }),
  ]

  it('met d’un côté ce qui a bougé, de l’autre ce qui n’a pas bougé', () => {
    const { changed, unchanged } = splitDeltas(compareMonths([...entries, ...stable], '2026-05', '2026-07'))
    expect(changed.map((d) => d.categoryId)).toEqual(['logement', 'courses'])
    expect(unchanged.map((d) => d.categoryId)).toEqual(['assurance'])
  })

  it('garde l’ordre par ampleur d’écart', () => {
    const { changed } = splitDeltas(compareMonths(entries, '2026-05', '2026-07'))
    expect(changed.map((d) => d.delta)).toEqual([45000, 12000])
  })

  it('rend deux listes vides quand il n’y a rien à comparer', () => {
    expect(splitDeltas([])).toEqual({ changed: [], unchanged: [] })
  })

  it('ne range rien dans « changé » quand les deux mois sont identiques', () => {
    const { changed, unchanged } = splitDeltas(compareMonths(stable, '2026-05', '2026-07'))
    expect(changed).toEqual([])
    expect(unchanged).toHaveLength(1)
  })

  /* Toutes à égalité sous le tri par ampleur d'écart : ce qui les distingue
     encore, c'est ce qu'elles pèsent. */
  it('classe les inchangées par montant commun décroissant', () => {
    const both = [
      ...stable,
      makeEntry({ date: '2026-05-03', direction: 'out', amount: eur(90000), categoryId: 'loyer' }),
      makeEntry({ date: '2026-07-03', direction: 'out', amount: eur(90000), categoryId: 'loyer' }),
    ]
    const { unchanged } = splitDeltas(compareMonths(both, '2026-05', '2026-07'))
    expect(unchanged.map((d) => d.categoryId)).toEqual(['loyer', 'assurance'])
  })

  it('ne modifie pas la liste qu’on lui donne', () => {
    const deltas = compareMonths([...entries, ...stable], '2026-05', '2026-07')
    const before = deltas.map((d) => d.categoryId)
    splitDeltas(deltas)
    expect(deltas.map((d) => d.categoryId)).toEqual(before)
  })
})

describe('horizon d’une année', () => {
  /* C'est lui qui rend deux années comparables : sans lui, onze mois de 2026 se
     lisent contre douze mois de 2025. */
  it('désigne le dernier mois chiffré d’une année en cours', () => {
    expect(yearHorizon(yearSeries(entries, 2026))).toBe(6) // juillet
  })

  it('désigne décembre d’une année qui va jusqu’au bout', () => {
    const full = [...entries, makeEntry({ date: '2026-12-31', direction: 'out', amount: eur(1000) })]
    expect(yearHorizon(yearSeries(full, 2026))).toBe(11)
  })

  it('ne désigne aucun mois d’une année vide', () => {
    expect(yearHorizon(yearSeries(entries, 2025))).toBe(-1)
  })

  it('ne s’arrête pas au premier trou', () => {
    // Mai, rien en juin, juillet : l'horizon est juillet, pas mai.
    expect(yearHorizon(yearSeries(entries, 2026))).toBe(6)
  })
})

describe('série annuelle', () => {
  it('produit douze points, même sans donnée', () => {
    const series = yearSeries([], 2026)
    expect(series).toHaveLength(12)
    expect(series.every((p) => !p.hasData)).toBe(true)
  })

  it('cumule le solde depuis janvier', () => {
    const series = yearSeries(entries, 2026)
    expect(series[4]?.balance).toBe(150000) // mai
    expect(series[4]?.cumulative).toBe(150000)
    expect(series[6]?.cumulative).toBe(283000) // + juillet
    expect(series.at(-1)?.cumulative).toBe(283000)
  })

  it('numérote les mois de 1 à 12', () => {
    expect(yearSeries([], 2026).map((p) => p.month)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ])
  })
})

describe('couverture', () => {
  it('énumère les années couvertes, triées', () => {
    const mixed = [...entries, makeEntry({ date: '2024-01-01' })]
    expect(coveredYears(mixed)).toEqual([2024, 2026])
  })

  it('n’en renvoie aucune sans données', () => {
    expect(coveredYears([])).toEqual([])
  })

  it('sait si une année porte des données', () => {
    expect(hasDataInYear(entries, 2026)).toBe(true)
    expect(hasDataInYear(entries, 2025)).toBe(false)
  })
})
