import { describe, expect, it } from 'vitest'
import { eur, makeEntry, makeRecurrence } from './fixtures'
import type { Money } from './money'
import type { CategoryKind, Recurrence } from './types'
import { isSpending } from './types'
import {
  OTHER_CATEGORY,
  breakdownByCategory,
  breakdownByFamily,
  incomeFlow,
  savingCapacity,
  savingLeft,
  savingRate,
  savingsByCategory,
  spendingFlow,
  totalsByKind,
  entriesInRange,
  entriesOfMonth,
  monthProgress,
  monthTotals,
  nextIncomeDate,
  restToLive,
  recurrenceTotals,
  recurrenceTotalsOfKinds,
  type Upcoming,
  upcomingDue,
  upcomingRows,
  withDaysLeft,
} from './stats'

const july = [
  makeEntry({ date: '2026-07-01', direction: 'in', amount: eur(240000), categoryId: 'salaire' }),
  makeEntry({ date: '2026-07-05', direction: 'out', amount: eur(95000), categoryId: 'logement' }),
  makeEntry({ date: '2026-07-08', direction: 'out', amount: eur(12000), categoryId: 'courses' }),
  makeEntry({
    date: '2026-07-20',
    direction: 'out',
    amount: eur(3000),
    categoryId: 'loisirs',
    status: 'planned',
  }),
  makeEntry({
    date: '2026-07-28',
    direction: 'in',
    amount: eur(50000),
    categoryId: 'prime',
    status: 'planned',
  }),
  makeEntry({ date: '2026-08-02', direction: 'out', amount: eur(9999), categoryId: 'courses' }),
]

describe('totaux du mois', () => {
  it('sépare le réalisé du prévisionnel', () => {
    const totals = monthTotals(july, '2026-07')
    expect(totals.confirmedIn).toBe(240000)
    expect(totals.confirmedOut).toBe(107000)
    expect(totals.plannedIn).toBe(50000)
    expect(totals.plannedOut).toBe(3000)
  })

  it('calcule le solde sur les seules entrées confirmées', () => {
    expect(monthTotals(july, '2026-07').balance).toBe(133000)
  })

  it('calcule le solde prévisionnel en incluant les échéances prévues', () => {
    expect(monthTotals(july, '2026-07').forecastBalance).toBe(180000)
  })

  it('ne déborde pas sur le mois suivant', () => {
    expect(entriesOfMonth(july, '2026-07')).toHaveLength(5)
    expect(monthTotals(july, '2026-08').confirmedOut).toBe(9999)
  })

  /* La fenêtre du calendrier fait six semaines et déborde sur deux mois : c'est
     elle qui a fait sortir l'intervalle, dont le mois est devenu un cas. */
  it('lit un intervalle, bornes incluses', () => {
    expect(entriesInRange(july, '2026-07-05', '2026-07-08')).toHaveLength(2)
    expect(entriesInRange(july, '2026-07-06', '2026-07-07')).toHaveLength(0)
    // Un intervalle à l'envers ne rend rien plutôt que de rendre tout.
    expect(entriesInRange(july, '2026-07-08', '2026-07-05')).toHaveLength(0)
  })

  it('rend exactement le mois quand l’intervalle est le mois', () => {
    expect(entriesInRange(july, '2026-07-01', '2026-07-31')).toEqual(entriesOfMonth(july, '2026-07'))
  })

  it('filtre l’intervalle par membre, comme le mois', () => {
    const entries = [
      makeEntry({ date: '2026-07-01', direction: 'in', amount: eur(1000), memberId: 'a' }),
      makeEntry({ date: '2026-08-02', direction: 'in', amount: eur(2000), memberId: 'b' }),
      makeEntry({ date: '2026-08-03', direction: 'in', amount: eur(4000), memberId: 'a' }),
    ]
    expect(entriesInRange(entries, '2026-07-01', '2026-08-31', 'a')).toHaveLength(2)
  })

  it('rend tout à zéro sur un mois sans aucune donnée', () => {
    expect(monthTotals(july, '2026-01')).toEqual({
      confirmedIn: 0,
      confirmedOut: 0,
      plannedIn: 0,
      plannedOut: 0,
      balance: 0,
      forecastBalance: 0,
    })
  })

  it('filtre par membre', () => {
    const entries = [
      makeEntry({ date: '2026-07-01', direction: 'in', amount: eur(1000), memberId: 'a' }),
      makeEntry({ date: '2026-07-02', direction: 'in', amount: eur(2000), memberId: 'b' }),
      makeEntry({ date: '2026-07-03', direction: 'in', amount: eur(4000) }),
    ]
    expect(monthTotals(entries, '2026-07', 'a').confirmedIn).toBe(1000)
    expect(monthTotals(entries, '2026-07').confirmedIn).toBe(7000)
  })
})

describe('reste à vivre', () => {
  it('s’arrête juste avant la prochaine rentrée d’argent', () => {
    // Confirmé au 10 juillet : 2 400 − 1 070 = 1 330 €.
    // Reste à payer avant la prime du 28 : 30 € de loisirs le 20.
    expect(restToLive(july, '2026-07', '2026-07-10')).toBe(130000)
  })

  it('trouve la prochaine rentrée d’argent, strictement après la date', () => {
    expect(nextIncomeDate(july, '2026-07-01')).toBe('2026-07-28')
    // Le 2 août est une sortie : plus aucune rentrée après le 28 juillet.
    expect(nextIncomeDate(july, '2026-07-28')).toBeNull()
    expect(nextIncomeDate([], '2026-07-01')).toBeNull()
  })

  it('va jusqu’à la fin du mois quand plus aucune rentrée n’est en vue', () => {
    const entries = [
      makeEntry({ date: '2026-07-01', direction: 'in', amount: eur(200000) }),
      makeEntry({ date: '2026-07-25', direction: 'out', amount: eur(5000), status: 'planned' }),
    ]
    expect(restToLive(entries, '2026-07', '2026-07-10')).toBe(195000)
  })

  it('vaut zéro sur un mois vide', () => {
    expect(restToLive([], '2026-07', '2026-07-10')).toBe(0)
  })
})

describe('répartition par catégorie', () => {
  it('classe les sorties par poids décroissant', () => {
    const slices = breakdownByCategory(july, '2026-07', 'out')
    expect(slices.map((s) => s.categoryId)).toEqual(['logement', 'courses', 'loisirs'])
    expect(slices[0]?.total).toBe(95000)
  })

  it('donne des parts qui somment à 1', () => {
    const slices = breakdownByCategory(july, '2026-07', 'out')
    const total = slices.reduce((acc, s) => acc + s.share, 0)
    expect(total).toBeCloseTo(1, 10)
  })

  it('regroupe le surplus sous « Autres » au-delà de six catégories', () => {
    const entries = Array.from({ length: 9 }, (_, i) =>
      makeEntry({
        date: '2026-07-01',
        direction: 'out',
        amount: eur((9 - i) * 1000),
        categoryId: `cat-${String(i)}`,
      }),
    )
    const slices = breakdownByCategory(entries, '2026-07', 'out')
    expect(slices).toHaveLength(7)
    expect(slices.at(-1)?.categoryId).toBe(OTHER_CATEGORY)
    // 3 000 + 2 000 + 1 000 pour les trois dernières.
    expect(slices.at(-1)?.total).toBe(6000)
  })

  it('ne renvoie rien sur un mois vide, plutôt qu’une part à zéro', () => {
    expect(breakdownByCategory(july, '2026-01', 'out')).toEqual([])
  })
})

describe('prochaines échéances', () => {
  const OPENED = new Set(['2026-07'])
  const due = (from: string, limit = 5, recurrences: Recurrence[] = []): Upcoming[] =>
    withDaysLeft(upcomingDue(july, recurrences, OPENED, from, limit), from)

  it('renvoie les suivantes avec le nombre de jours restants', () => {
    const upcoming = due('2026-07-10')
    expect(upcoming).toHaveLength(2)
    expect(upcoming[0]?.daysLeft).toBe(10)
    expect(upcoming[1]?.daysLeft).toBe(18)
  })

  it('inclut une échéance tombant le jour même', () => {
    expect(due('2026-07-20')[0]?.daysLeft).toBe(0)
  })

  it('se limite au nombre demandé', () => {
    expect(due('2026-07-01', 1)).toHaveLength(1)
  })

  it('ignore les entrées confirmées : elles ne sont plus à venir', () => {
    expect(due('2026-07-01').every((u) => u.entry.status === 'planned')).toBe(true)
  })

  /* Une échéance passée que personne n'a confirmée est la plus proche de
     toutes : la faire disparaître du seul écran qui la rappelait était le
     meilleur moyen de l'oublier. */
  it('remonte un retard du mois courant, en tête et en jours négatifs', () => {
    const upcoming = due('2026-07-25')
    expect(upcoming[0]?.entry.categoryId).toBe('loisirs')
    expect(upcoming[0]?.daysLeft).toBe(-5)
  })

  /* Le trou que la tuile annonçait « dans 92 jours » : une récurrence ne pose
     d'échéance que dans un mois ouvert, et août ne l'est pas ici. */
  it('projette les échéances des mois non encore ouverts', () => {
    const loyer = makeRecurrence({
      id: 'r-loyer',
      label: 'Loyer',
      startedOn: '2026-01-05',
      period: { unit: 'month', every: 1, anchorDay: 5 },
    })
    const upcoming = due('2026-07-25', 4, [loyer])
    expect(upcoming.map((u) => u.entry.date)).toEqual([
      '2026-07-20',
      '2026-07-28',
      '2026-08-05',
      '2026-09-05',
    ])
    // Août et septembre ne sont pas ouverts : ces deux-là n'existent nulle part
    // dans le document, la règle les a fabriquées pour l'affichage.
    expect(upcoming.slice(2).map((u) => u.entry.label)).toEqual(['Loyer', 'Loyer'])
  })

  it('ne projette rien dans un mois ouvert : l’échéance posée y fait foi', () => {
    const juillet = makeRecurrence({
      id: 'r-juillet',
      startedOn: '2026-01-20',
      period: { unit: 'month', every: 1, anchorDay: 20 },
    })
    const dates = due('2026-07-01', 5, [juillet]).map((u) => u.entry.date)
    // Le 20 juillet n'apparaît qu'une fois, celle du document.
    expect(dates.filter((d) => d === '2026-07-20')).toHaveLength(1)
  })

  /* Le code supposait qu'une `planned` n'existe que dans un mois ouvert. Un
     document importé peut violer la supposition : l'échéance était alors prise
     telle quelle *et* refabriquée par sa règle, et s'affichait deux fois. */
  it('ne compte pas deux fois une prévue posée dans un mois jamais ouvert', () => {
    const loyer = makeRecurrence({
      id: 'r-loyer',
      label: 'Loyer',
      startedOn: '2026-01-05',
      period: { unit: 'month', every: 1, anchorDay: 5 },
    })
    const importé = [
      ...july,
      makeEntry({
        id: 'e-aout',
        recurrenceId: 'r-loyer',
        date: '2026-08-05',
        label: 'Loyer',
        status: 'planned',
      }),
    ]
    const dates = upcomingDue(importé, [loyer], OPENED, '2026-07-25', 5).map((e) => e.date)
    expect(dates.filter((d) => d === '2026-08-05')).toHaveLength(1)
  })

  it('n’exhume pas un retard antérieur au mois courant', () => {
    const vieux = [makeEntry({ date: '2026-05-03', status: 'planned' }), ...july]
    expect(
      upcomingDue(vieux, [], OPENED, '2026-07-10', 5).some((e) => e.date === '2026-05-03'),
    ).toBe(false)
  })
})

describe('prochaines échéances, prêtes à afficher', () => {
  const sameDay = [
    makeEntry({
      date: '2026-09-01',
      label: 'Apple Music',
      amount: eur(1699),
      status: 'planned',
    }),
    makeEntry({
      date: '2026-09-05',
      label: 'Freebox',
      amount: eur(3499),
      status: 'planned',
    }),
    makeEntry({
      date: '2026-09-01',
      label: 'Salaire',
      direction: 'in',
      amount: eur(200000),
      status: 'planned',
    }),
    makeEntry({
      date: '2026-09-01',
      label: 'Free Mobile',
      amount: eur(4198),
      status: 'planned',
    }),
  ]

  const source = withDaysLeft(
    upcomingDue(sameDay, [], new Set(['2026-08', '2026-09']), '2026-08-01', 5),
    '2026-08-01',
  )
  const rows = upcomingRows(source)

  it('ne porte le délai que sur la première échéance de chaque jour', () => {
    expect(rows.map((r) => r.leadsDay)).toEqual([true, false, false, true])
  })

  it('range le plus gros mouvement d’abord, dans un même jour', () => {
    expect(rows.slice(0, 3).map((r) => r.entry.label)).toEqual([
      'Salaire',
      'Free Mobile',
      'Apple Music',
    ])
  })

  it('garde l’ordre chronologique des jours', () => {
    expect(rows.map((r) => r.entry.date)).toEqual([
      '2026-09-01',
      '2026-09-01',
      '2026-09-01',
      '2026-09-05',
    ])
  })

  it('garde exactement les mêmes échéances, avec leur délai', () => {
    expect(rows).toHaveLength(source.length)
    expect(new Set(rows.map((r) => r.entry.id))).toEqual(new Set(source.map((u) => u.entry.id)))
    expect(rows.every((r) => r.daysLeft === (r.entry.date === '2026-09-01' ? 31 : 35))).toBe(true)
  })
})

describe('total des récurrences', () => {
  /* Le résolveur répond pour chaque récurrence, fixe ou variable — c'est le
     même que celui du revenu d'un membre. Ici, un variable reste sans réponse. */
  const unpriced = (r: Recurrence): Money | null => r.amount

  it('additionne les sorties récurrentes, amorties au mois et à l’année', () => {
    const recurrences = [
      makeRecurrence({ id: 'a', amount: eur(999), period: { unit: 'month', every: 1, anchorDay: 1 } }),
      makeRecurrence({
        id: 'b',
        amount: eur(11988),
        period: { unit: 'year', every: 1, anchorDay: 1 },
      }),
    ]
    const totals = recurrenceTotals(recurrences, unpriced, '2026-07-01')
    expect(totals.monthly).toBe(1998)
    expect(totals.annual).toBe(23976)
  })

  it('ignore les entrées d’argent par défaut : ce ne sont pas des récurrences', () => {
    const recurrences = [
      makeRecurrence({
        id: 'salaire',
        direction: 'in',
        amount: eur(240000),
        period: { unit: 'month', every: 1, anchorDay: 28 },
      }),
    ]
    expect(recurrenceTotals(recurrences, unpriced, '2026-07-01').monthly).toBe(0)
  })

  it('sait aussi totaliser les entrées, quand on les lui demande', () => {
    const recurrences = [
      makeRecurrence({
        id: 'salaire',
        direction: 'in',
        amount: eur(240000),
        period: { unit: 'month', every: 1, anchorDay: 28 },
      }),
      makeRecurrence({
        id: 'netflix',
        amount: eur(1399),
        period: { unit: 'month', every: 1, anchorDay: 15 },
      }),
    ]
    expect(recurrenceTotals(recurrences, unpriced, '2026-07-01', 'in').monthly).toBe(240_000)
    expect(recurrenceTotals(recurrences, unpriced, '2026-07-01', 'out').monthly).toBe(1_399)
  })

  it('ignore une récurrence arrêtée', () => {
    const recurrences = [
      makeRecurrence({
        id: 'a',
        amount: eur(999),
        period: { unit: 'month', every: 1, anchorDay: 1 },
        endedOn: '2026-05-31',
      }),
    ]
    expect(recurrenceTotals(recurrences, unpriced, '2026-07-01').monthly).toBe(0)
  })

  /* `endedOn` est la dernière date couverte : arrêtée le jour même, la
     récurrence n'a plus d'échéance à venir et la liste la range déjà sous
     « Arrêtée ». Le total la comptait encore jusqu'au lendemain. */
  it('ignore une récurrence arrêtée le jour même', () => {
    const recurrences = [
      makeRecurrence({
        id: 'a',
        amount: eur(999),
        period: { unit: 'month', every: 1, anchorDay: 1 },
        endedOn: '2026-07-01',
      }),
    ]
    expect(recurrenceTotals(recurrences, unpriced, '2026-07-01').monthly).toBe(0)
    expect(recurrenceTotals(recurrences, unpriced, '2026-06-30').monthly).toBe(999)
  })

  it('compte une variable non estimable plutôt que de la valoriser à zéro', () => {
    const recurrences = [
      makeRecurrence({ id: 'a', amount: null, period: { unit: 'month', every: 1, anchorDay: 1 } }),
    ]
    const totals = recurrenceTotals(recurrences, unpriced, '2026-07-01')
    expect(totals.unknownCount).toBe(1)
    expect(totals.monthly).toBe(0)
  })

  it('estime une variable à sa dernière échéance confirmée', () => {
    const recurrences = [
      makeRecurrence({ id: 'a', amount: null, period: { unit: 'month', every: 1, anchorDay: 1 } }),
    ]
    const totals = recurrenceTotals(recurrences, () => eur(8450), '2026-07-01')
    expect(totals.monthly).toBe(8450)
    expect(totals.unknownCount).toBe(0)
  })

  it('vaut zéro sans aucune récurrence', () => {
    expect(recurrenceTotals([], unpriced, '2026-07-01')).toEqual({
      monthly: 0,
      annual: 0,
      unknownCount: 0,
    })
  })
})

/* Le total qui suit le filtre par nature des listes : « Charges » doit compter
   comme la tuile du même nom — charges et crédits, sans l'épargne — sans quoi
   le chiffre en tête contredit celui du tableau de bord. */
describe('total des récurrences, borné à une nature', () => {
  const KINDS: Record<string, CategoryKind> = {
    logement: 'charge',
    auto: 'debt',
    livret: 'saving',
    salaire: 'resource',
  }
  const kindOf = (id: string): CategoryKind => KINDS[id] ?? 'charge'
  const unpriced = (r: Recurrence): Money | null => r.amount
  const monthly = (over: Partial<Omit<Recurrence, 'period'>> & { id: string }) =>
    makeRecurrence({ period: { unit: 'month', every: 1, anchorDay: 1 }, ...over })

  const recurrences = [
    monthly({ id: 'loyer', categoryId: 'logement', amount: eur(95_000) }),
    monthly({ id: 'pret', categoryId: 'auto', amount: eur(30_000) }),
    monthly({ id: 'livret', categoryId: 'livret', amount: eur(20_000) }),
    monthly({ id: 'salaire', categoryId: 'salaire', direction: 'in', amount: eur(250_000) }),
  ]

  it('« Charges » compte les charges et les crédits, sans l’épargne', () => {
    const totals = recurrenceTotalsOfKinds(recurrences, unpriced, '2026-07-01', kindOf, [
      'charge',
      'debt',
    ])
    expect(totals.monthly).toBe(125_000)
    expect(totals.annual).toBe(1_500_000)
  })

  it('« Revenus » compte les ressources, et rien d’autre', () => {
    expect(
      recurrenceTotalsOfKinds(recurrences, unpriced, '2026-07-01', kindOf, ['resource']).monthly,
    ).toBe(250_000)
  })

  it('« Épargne » se compte en net : une reprise récurrente se retranche', () => {
    const withDrawback = [
      ...recurrences,
      monthly({ id: 'reprise', categoryId: 'livret', direction: 'in', amount: eur(5_000) }),
    ]
    expect(
      recurrenceTotalsOfKinds(withDrawback, unpriced, '2026-07-01', kindOf, ['saving']).monthly,
    ).toBe(15_000)
  })

  it('ignore une récurrence arrêtée, et compte l’inconnue à part', () => {
    const list = [
      monthly({ id: 'stop', categoryId: 'logement', amount: eur(9_999), endedOn: '2026-05-31' }),
      monthly({ id: 'var', categoryId: 'logement', amount: null }),
    ]
    const totals = recurrenceTotalsOfKinds(list, unpriced, '2026-07-01', kindOf, ['charge', 'debt'])
    expect(totals.monthly).toBe(0)
    expect(totals.unknownCount).toBe(1)
  })

  it('ignore une récurrence arrêtée le jour même, comme le total tous sens', () => {
    const list = [monthly({ id: 'stop', categoryId: 'logement', amount: eur(9_999), endedOn: '2026-07-01' })]
    expect(
      recurrenceTotalsOfKinds(list, unpriced, '2026-07-01', kindOf, ['charge', 'debt']).monthly,
    ).toBe(0)
  })
})

describe('progression du mois', () => {
  it('vaut 1/31 au premier jour et 1 au dernier', () => {
    expect(monthProgress('2026-07', '2026-07-01')).toBeCloseTo(1 / 31, 10)
    expect(monthProgress('2026-07', '2026-07-31')).toBe(1)
  })

  it('tient compte de la longueur du mois', () => {
    expect(monthProgress('2026-02', '2026-02-28')).toBe(1)
    expect(monthProgress('2024-02', '2024-02-29')).toBe(1)
    expect(monthProgress('2026-02', '2026-02-14')).toBeCloseTo(14 / 28, 10)
  })

  it('borne à 0 avant le mois et à 1 après', () => {
    expect(monthProgress('2026-07', '2026-06-30')).toBe(0)
    expect(monthProgress('2026-07', '2026-08-01')).toBe(1)
  })
})

describe('lecture par nature', () => {
  const KINDS: Record<string, CategoryKind> = {
    salaire: 'resource',
    loyer: 'charge',
    pret: 'debt',
    livret: 'saving',
  }
  const kindOf = (id: string): CategoryKind => KINDS[id] ?? 'charge'

  const month = [
    makeEntry({ id: 'a', categoryId: 'salaire', direction: 'in', date: '2026-07-01', amount: eur(200000), status: 'confirmed' }),
    makeEntry({ id: 'b', categoryId: 'loyer', date: '2026-07-05', amount: eur(80000), status: 'confirmed' }),
    makeEntry({ id: 'c', categoryId: 'pret', date: '2026-07-10', amount: eur(30000), status: 'confirmed' }),
    makeEntry({ id: 'd', categoryId: 'livret', date: '2026-07-15', amount: eur(20000), status: 'confirmed' }),
  ]

  it('range chaque entrée sous sa nature', () => {
    const totals = totalsByKind(month, '2026-07', kindOf)
    expect(totals).toEqual({ resource: 200000, charge: 80000, debt: 30000, saving: 20000 })
  })

  it('exclut les prévues, sauf en lecture prévisionnelle', () => {
    const withPlanned = [
      ...month,
      makeEntry({ id: 'e', categoryId: 'loyer', date: '2026-07-28', amount: eur(5000), status: 'planned' }),
    ]
    expect(totalsByKind(withPlanned, '2026-07', kindOf).charge).toBe(80000)
    expect(totalsByKind(withPlanned, '2026-07', kindOf, undefined, true).charge).toBe(85000)
  })

  it('laisse l’épargne hors de la capacité — c’est ce qu’elle mesure', () => {
    const totals = totalsByKind(month, '2026-07', kindOf)
    expect(savingCapacity(totals)).toBe(90000)
  })

  it('rapporte l’épargne aux ressources', () => {
    expect(savingRate(totalsByKind(month, '2026-07', kindOf))).toBeCloseTo(0.1, 5)
  })

  it('ne rend pas un taux de zéro faute de ressources', () => {
    const noIncome = month.filter((e) => e.categoryId !== 'salaire')
    expect(savingRate(totalsByKind(noIncome, '2026-07', kindOf))).toBeNull()
  })

  it('répartit par famille en excluant l’épargne', () => {
    const familyOf = (id: string): string => (id === 'livret' ? 'fam-savings' : `fam-${id}`)
    const slices = breakdownByFamily(month, '2026-07', familyOf, (id) => isSpending(kindOf(id)))
    expect(slices.map((s) => s.categoryId)).toEqual(['fam-loyer', 'fam-pret'])
    expect(slices.map((s) => s.total)).toEqual([80000, 30000])
  })

  it('déduit de la capacité ce qui est déjà versé', () => {
    expect(savingLeft(totalsByKind(month, '2026-07', kindOf))).toBe(70000)
  })

  it('rend un reste négatif quand on verse plus qu’on ne dégage', () => {
    const greedy = [
      ...month,
      makeEntry({ id: 'f', categoryId: 'livret', date: '2026-07-20', amount: eur(100000) }),
    ]
    expect(savingLeft(totalsByKind(greedy, '2026-07', kindOf))).toBe(-30000)
  })
})

describe('où va l’épargne', () => {
  const KINDS: Record<string, CategoryKind> = {
    salaire: 'resource',
    loyer: 'charge',
    pea: 'saving',
    livret: 'saving',
  }
  const kindOf = (id: string): CategoryKind => KINDS[id] ?? 'charge'

  const month = [
    makeEntry({ id: 'a', categoryId: 'salaire', direction: 'in', date: '2026-07-01', amount: eur(200000) }),
    makeEntry({ id: 'b', categoryId: 'loyer', date: '2026-07-05', amount: eur(80000) }),
    makeEntry({ id: 'c', categoryId: 'livret', date: '2026-07-10', amount: eur(15000) }),
    makeEntry({ id: 'd', categoryId: 'pea', date: '2026-07-10', amount: eur(30000) }),
    makeEntry({ id: 'e', categoryId: 'livret', date: '2026-07-25', amount: eur(5000) }),
  ]

  /* Le livret est saisi le premier et en deux fois : sans tri, il sortirait en
     tête, et l'ordre d'un écran qui répond « où va l'argent » n'est pas celui
     de la saisie. */
  it('ne garde que les versements, du plus gros support au plus petit', () => {
    const slices = savingsByCategory(month, '2026-07', kindOf)
    expect(slices.map((s) => s.categoryId)).toEqual(['pea', 'livret'])
    expect(slices.map((s) => s.total)).toEqual([30000, 20000])
  })

  it('donne à chaque support sa part du versé, pas du mois', () => {
    const slices = savingsByCategory(month, '2026-07', kindOf)
    expect(slices[0]?.share).toBeCloseTo(0.6, 5)
  })

  it('ne rend rien quand le mois ne place rien', () => {
    const plain = month.filter((e) => kindOf(e.categoryId) !== 'saving')
    expect(savingsByCategory(plain, '2026-07', kindOf)).toEqual([])
  })
})

describe('ce qui rentre et ce qui se paie', () => {
  const KINDS: Record<string, CategoryKind> = {
    salaire: 'resource',
    prime: 'resource',
    loyer: 'charge',
    pret: 'debt',
    livret: 'saving',
  }
  const kindOf = (id: string): CategoryKind => KINDS[id] ?? 'charge'

  const month = [
    makeEntry({ id: 'a', categoryId: 'salaire', direction: 'in', date: '2026-07-01', amount: eur(200000) }),
    makeEntry({ id: 'b', categoryId: 'prime', direction: 'in', date: '2026-07-28', amount: eur(50000), status: 'planned' }),
    makeEntry({ id: 'c', categoryId: 'loyer', date: '2026-07-05', amount: eur(80000) }),
    makeEntry({ id: 'd', categoryId: 'pret', date: '2026-07-10', amount: eur(30000) }),
    makeEntry({ id: 'e', categoryId: 'loyer', date: '2026-07-25', amount: eur(12000), status: 'planned' }),
    makeEntry({ id: 'f', categoryId: 'livret', date: '2026-07-15', amount: eur(20000) }),
  ]

  const confirmed = totalsByKind(month, '2026-07', kindOf)
  const forecast = totalsByKind(month, '2026-07', kindOf, undefined, true)

  it('compte le mois entier, échéances prévues comprises', () => {
    expect(incomeFlow(confirmed, forecast).total).toBe(250000)
    expect(spendingFlow(confirmed, forecast).total).toBe(122000)
  })

  it('dit ce qui est déjà tombé et ce qui reste', () => {
    expect(incomeFlow(confirmed, forecast)).toEqual({ total: 250000, done: 200000, left: 50000 })
    expect(spendingFlow(confirmed, forecast)).toEqual({ total: 122000, done: 110000, left: 12000 })
  })

  it('laisse l’épargne hors de ce qui se paie — elle reste au foyer', () => {
    const withMore = [
      ...month,
      makeEntry({ id: 'g', categoryId: 'livret', date: '2026-07-20', amount: eur(50000) }),
    ]
    const flow = spendingFlow(
      totalsByKind(withMore, '2026-07', kindOf),
      totalsByKind(withMore, '2026-07', kindOf, undefined, true),
    )
    expect(flow).toEqual(spendingFlow(confirmed, forecast))
  })

  it('ne laisse rien à tomber quand tout est confirmé', () => {
    const done = totalsByKind(
      month.filter((e) => e.status === 'confirmed'),
      '2026-07',
      kindOf,
    )
    expect(spendingFlow(done, done).left).toBe(0)
    expect(incomeFlow(done, done).left).toBe(0)
  })

  it('rend tout à zéro sur un mois vide plutôt que de refuser de répondre', () => {
    const empty = totalsByKind([], '2026-07', kindOf)
    expect(incomeFlow(empty, empty)).toEqual({ total: 0, done: 0, left: 0 })
    expect(spendingFlow(empty, empty)).toEqual({ total: 0, done: 0, left: 0 })
  })
})

/* Une reprise d'épargne — payer l'assurance de l'année depuis le livret —
   entre en sens `in` sur une catégorie d'épargne. La compter comme un
   versement dirait que le mois où l'on a vidé 600 € du livret est un mois où
   l'on a mis 600 € de côté. */
describe('une reprise d’épargne se retranche des versements', () => {
  const kindOf = (id: string): CategoryKind =>
    id === 'salaire' ? 'resource' : id === 'livret' ? 'saving' : 'charge'

  const month = [
    makeEntry({ id: 'a', categoryId: 'salaire', direction: 'in', date: '2026-07-01', amount: eur(200000) }),
    makeEntry({ id: 'b', categoryId: 'loyer', date: '2026-07-05', amount: eur(80000) }),
    makeEntry({ id: 'c', categoryId: 'livret', date: '2026-07-10', amount: eur(5000) }),
    makeEntry({ id: 'd', categoryId: 'livret', direction: 'in', date: '2026-07-15', amount: eur(60000) }),
  ]

  it('rend une épargne nette, versements moins reprises', () => {
    expect(totalsByKind(month, '2026-07', kindOf).saving).toBe(-55000)
  })

  it('ne touche ni aux ressources ni aux charges', () => {
    const totals = totalsByKind(month, '2026-07', kindOf)
    expect(totals.resource).toBe(200000)
    expect(totals.charge).toBe(80000)
    expect(savingCapacity(totals)).toBe(120000)
  })

  /* Reprendre 600 € et n'en remettre que 50 laisse 550 € à replacer en plus de
     la capacité du mois : c'est bien ce qu'il faudrait pour être quitte. */
  it('ajoute au reste à placer ce qui a été repris', () => {
    expect(savingLeft(totalsByKind(month, '2026-07', kindOf))).toBe(175000)
  })

  it('rend le support à son solde net, pas à la somme des mouvements', () => {
    const slices = savingsByCategory(month, '2026-07', kindOf)
    expect(slices).toEqual([{ categoryId: 'livret', total: -55000, share: 1 }])
  })

  it('retire un support autant repris que reconstitué : il n’a rien reçu', () => {
    const wash = [
      makeEntry({ id: 'x', categoryId: 'livret', date: '2026-07-10', amount: eur(60000) }),
      makeEntry({ id: 'y', categoryId: 'livret', direction: 'in', date: '2026-07-15', amount: eur(60000) }),
    ]
    expect(savingsByCategory(wash, '2026-07', kindOf)).toEqual([])
  })
})
