import { describe, expect, it } from 'vitest'
import { eur, makeEntry, makeRecurrence, sequentialIds } from './fixtures'
import { coveredMonths, isMonthOpened, lastConfirmedAmount, planMonth } from './month'

const loyer = makeRecurrence({
  id: 'loyer',
  label: 'Loyer',
  amount: eur(95000),
  period: { unit: 'month', every: 1, anchorDay: 5 },
})

const electricite = makeRecurrence({
  id: 'elec',
  label: 'Électricité',
  amount: null, // montant variable
  period: { unit: 'month', every: 1, anchorDay: 12 },
})

describe('ouverture du mois', () => {
  it('génère une échéance planned par occurrence de récurrence', () => {
    const plan = planMonth({ recurrences: [loyer], entries: [] }, '2026-07', sequentialIds())
    expect(plan.created).toHaveLength(1)
    expect(plan.created[0]).toMatchObject({
      recurrenceId: 'loyer',
      label: 'Loyer',
      date: '2026-07-05',
      status: 'planned',
      amount: 95000,
    })
  })

  it('liste à part les récurrences à montant variable', () => {
    const plan = planMonth(
      { recurrences: [loyer, electricite], entries: [] },
      '2026-07',
      sequentialIds(),
    )
    expect(plan.created).toHaveLength(2)
    expect(plan.variable.map((e) => e.recurrenceId)).toEqual(['elec'])
  })

  it('propose le montant du mois précédent pour une échéance variable', () => {
    const entries = [
      makeEntry({ recurrenceId: 'elec', date: '2026-06-12', amount: eur(8450) }),
    ]
    const plan = planMonth({ recurrences: [electricite], entries }, '2026-07', sequentialIds())
    expect(plan.created[0]?.amount).toBe(8450)
  })

  it('retombe à zéro plutôt que d’inventer, faute d’historique', () => {
    const plan = planMonth({ recurrences: [electricite], entries: [] }, '2026-07', sequentialIds())
    expect(plan.created[0]?.amount).toBe(0)
  })

  it('est idempotente : rejouer une ouverture ne duplique rien', () => {
    const first = planMonth({ recurrences: [loyer], entries: [] }, '2026-07', sequentialIds())
    const second = planMonth(
      { recurrences: [loyer], entries: first.created },
      '2026-07',
      sequentialIds(),
    )
    expect(second.created).toEqual([])
  })

  it('ne régénère pas une échéance déjà confirmée', () => {
    const entries = [
      makeEntry({ recurrenceId: 'loyer', date: '2026-07-05', status: 'confirmed' }),
    ]
    const plan = planMonth({ recurrences: [loyer], entries }, '2026-07', sequentialIds())
    expect(plan.created).toEqual([])
  })

  it('génère quand même l’échéance si la précédente était à une autre date', () => {
    const entries = [makeEntry({ recurrenceId: 'loyer', date: '2026-06-05' })]
    const plan = planMonth({ recurrences: [loyer], entries }, '2026-07', sequentialIds())
    expect(plan.created).toHaveLength(1)
  })

  it('ne génère rien pour un mois sans aucune échéance', () => {
    const annuelle = makeRecurrence({
      id: 'assurance',
      period: { unit: 'year', every: 1, anchorDay: 15 },
      startedOn: '2026-03-15',
    })
    const plan = planMonth({ recurrences: [annuelle], entries: [] }, '2026-07', sequentialIds())
    expect(plan.created).toEqual([])
    expect(plan.variable).toEqual([])
  })

  it('ne génère rien du tout sans récurrence', () => {
    const plan = planMonth({ recurrences: [], entries: [] }, '2026-07', sequentialIds())
    expect(plan).toEqual({ ym: '2026-07', created: [], variable: [] })
  })

  it('rend les échéances triées par date', () => {
    const plan = planMonth(
      { recurrences: [electricite, loyer], entries: [] },
      '2026-07',
      sequentialIds(),
    )
    expect(plan.created.map((e) => e.date)).toEqual(['2026-07-05', '2026-07-12'])
  })

  it('borne l’échéance au dernier jour d’un mois court', () => {
    const r = makeRecurrence({ id: 'r31', period: { unit: 'month', every: 1, anchorDay: 31 } })
    const plan = planMonth({ recurrences: [r], entries: [] }, '2026-02', sequentialIds())
    expect(plan.created[0]?.date).toBe('2026-02-28')
  })

  it('ignore une récurrence arrêtée avant le mois', () => {
    const stopped = makeRecurrence({
      id: 'stop',
      period: { unit: 'month', every: 1, anchorDay: 5 },
      endedOn: '2026-05-31',
    })
    const plan = planMonth({ recurrences: [stopped], entries: [] }, '2026-07', sequentialIds())
    expect(plan.created).toEqual([])
  })

  it('reporte le membre de la récurrence sur l’échéance', () => {
    const r = makeRecurrence({
      id: 'r',
      memberId: 'm1',
      period: { unit: 'month', every: 1, anchorDay: 5 },
    })
    const plan = planMonth({ recurrences: [r], entries: [] }, '2026-07', sequentialIds())
    expect(plan.created[0]?.memberId).toBe('m1')
  })

  it('n’invente pas de membre quand la récurrence n’en porte pas', () => {
    const plan = planMonth({ recurrences: [loyer], entries: [] }, '2026-07', sequentialIds())
    expect(plan.created[0]).not.toHaveProperty('memberId')
  })

  it('reporte la règle de partage de la récurrence sur l’échéance', () => {
    const r = makeRecurrence({
      id: 'r',
      shared: false,
      period: { unit: 'month', every: 1, anchorDay: 5 },
    })
    const plan = planMonth({ recurrences: [r], entries: [] }, '2026-07', sequentialIds())
    expect(plan.created[0]?.shared).toBe(false)
  })

  it('laisse la règle trancher quand la récurrence ne dit rien', () => {
    const plan = planMonth({ recurrences: [loyer], entries: [] }, '2026-07', sequentialIds())
    expect(plan.created[0]).not.toHaveProperty('shared')
  })
})

describe('dernier montant confirmé', () => {
  const entries = [
    makeEntry({ recurrenceId: 'elec', date: '2026-04-12', amount: eur(7000) }),
    makeEntry({ recurrenceId: 'elec', date: '2026-06-12', amount: eur(8450) }),
    makeEntry({ recurrenceId: 'elec', date: '2026-05-12', amount: eur(8000) }),
    makeEntry({ recurrenceId: 'elec', date: '2026-07-12', amount: eur(9999), status: 'planned' }),
  ]

  it('prend le plus récent strictement antérieur', () => {
    expect(lastConfirmedAmount(entries, 'elec', '2026-07-12')).toBe(8450)
  })

  it('ignore les échéances seulement prévues', () => {
    expect(lastConfirmedAmount(entries, 'elec', '2026-12-31')).toBe(8450)
  })

  it('renvoie null quand rien ne précède', () => {
    expect(lastConfirmedAmount(entries, 'elec', '2026-01-01')).toBeNull()
    expect(lastConfirmedAmount(entries, 'inconnu', '2026-12-31')).toBeNull()
  })
})

describe('état des mois', () => {
  it('sait si un mois a déjà été ouvert', () => {
    const months = [{ ym: '2026-07', openedAt: '2026-07-01', closed: false }]
    expect(isMonthOpened(months, '2026-07')).toBe(true)
    expect(isMonthOpened(months, '2026-08')).toBe(false)
    expect(isMonthOpened([], '2026-07')).toBe(false)
  })

  it('énumère les mois couverts, triés, sans doublon', () => {
    const data = {
      entries: [makeEntry({ date: '2026-03-04' }), makeEntry({ date: '2026-01-15' })],
      months: [{ ym: '2026-03', openedAt: '2026-03-01', closed: false }],
    }
    expect(coveredMonths(data)).toEqual(['2026-01', '2026-03'])
  })

  it('ne couvre aucun mois sur un document vide', () => {
    expect(coveredMonths({ entries: [], months: [] })).toEqual([])
  })
})
