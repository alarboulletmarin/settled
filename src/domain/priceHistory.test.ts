import { describe, expect, it } from 'vitest'
import { money } from './money'
import { eur, makeEntry, makeRecurrence } from './fixtures'
import {
  amountOn,
  detectPriceChange,
  isCostly,
  knownAmount,
  lastConfirmedAmount,
  priceHistory,
} from './priceHistory'

const at = (date: string, amount: number, status: 'planned' | 'confirmed' = 'confirmed') =>
  makeEntry({ recurrenceId: 'netflix', date, amount: eur(amount), status })

describe('historique de prix', () => {
  it('se déduit des échéances confirmées, du plus ancien au plus récent', () => {
    const entries = [at('2026-03-05', 1099), at('2026-01-05', 999), at('2026-02-05', 999)]
    expect(priceHistory(entries, 'netflix')).toEqual([
      { date: '2026-01-05', amount: 999 },
      { date: '2026-02-05', amount: 999 },
      { date: '2026-03-05', amount: 1099 },
    ])
  })

  it('ignore les échéances seulement prévues', () => {
    const entries = [at('2026-01-05', 999), at('2026-02-05', 1099, 'planned')]
    expect(priceHistory(entries, 'netflix')).toHaveLength(1)
  })

  it('ignore les échéances d’une autre récurrence', () => {
    const entries = [at('2026-01-05', 999), makeEntry({ recurrenceId: 'spotify', date: '2026-01-05' })]
    expect(priceHistory(entries, 'netflix')).toHaveLength(1)
  })
})

describe('détection de changement de prix', () => {
  it('signale une hausse', () => {
    const entries = [at('2026-01-05', 999), at('2026-02-05', 1099)]
    expect(detectPriceChange(entries, 'netflix')).toEqual({
      previous: 999,
      current: 1099,
      delta: 100,
      since: '2026-02-05',
    })
  })

  it('signale une baisse', () => {
    const entries = [at('2026-01-05', 1099), at('2026-02-05', 999)]
    expect(detectPriceChange(entries, 'netflix')?.delta).toBe(-100)
  })

  it('ne signale rien tant que le montant n’a pas bougé', () => {
    const entries = [at('2026-01-05', 999), at('2026-02-05', 999), at('2026-03-05', 999)]
    expect(detectPriceChange(entries, 'netflix')).toBeNull()
  })

  it('continue de signaler la hausse après plusieurs mois au nouveau tarif', () => {
    const entries = [
      at('2026-01-05', 999),
      at('2026-02-05', 1099),
      at('2026-03-05', 1099),
      at('2026-04-05', 1099),
    ]
    expect(detectPriceChange(entries, 'netflix')).toMatchObject({
      previous: 999,
      current: 1099,
      since: '2026-02-05',
    })
  })

  it('ne signale rien sur une seule échéance', () => {
    expect(detectPriceChange([at('2026-01-05', 999)], 'netflix')).toBeNull()
  })

  it('ne signale rien sans aucune échéance', () => {
    expect(detectPriceChange([], 'netflix')).toBeNull()
  })
})

describe('un changement qui coûte', () => {
  const change = (delta: number) => ({
    previous: money(1000),
    current: money(1000 + delta),
    delta: money(delta),
    since: '2026-02-05',
  })

  it('une charge qui monte pèse', () => {
    expect(isCostly(change(100), 'out', 'charge')).toBe(true)
    expect(isCostly(change(100), 'out', 'debt')).toBe(true)
  })

  it('une charge qui baisse ne pèse pas', () => {
    expect(isCostly(change(-100), 'out', 'charge')).toBe(false)
  })

  it('un revenu qui baisse pèse', () => {
    expect(isCostly(change(-100), 'in', 'resource')).toBe(true)
  })

  it('une augmentation de salaire n’est pas une alerte', () => {
    expect(isCostly(change(100), 'in', 'resource')).toBe(false)
  })

  it('l’épargne n’alarme jamais : elle reste au foyer, rien ne coûte', () => {
    // Verser plus sur un livret n'est pas une facture qui flambe, et une
    // reprise récurrente qui baisse n'est pas un revenu qui fond.
    expect(isCostly(change(100), 'out', 'saving')).toBe(false)
    expect(isCostly(change(-100), 'out', 'saving')).toBe(false)
    expect(isCostly(change(-100), 'in', 'saving')).toBe(false)
  })
})

/* --- Le montant en vigueur ------------------------------------------------*/

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

describe('montant chiffré le plus proche', () => {
  it('prend le plus récent, le jour même compris', () => {
    const entries = [at('2026-06-27', 250_000), at('2026-07-27', 232_000)]
    // Un salaire confirmé le 27 vaut le 27, pas seulement le 28.
    expect(knownAmount(entries, 'netflix', '2026-07-27')).toBe(232_000)
    expect(knownAmount(entries, 'netflix', '2026-07-26')).toBe(250_000)
  })

  it('retient une échéance prévue dont le montant a été saisi', () => {
    const entries = [at('2026-07-27', 232_000, 'planned')]
    expect(knownAmount(entries, 'netflix', '2026-07-15')).toBe(232_000)
  })

  it('ignore la case laissée à zéro par l’ouverture du mois', () => {
    const entries = [at('2026-07-27', 0, 'planned')]
    expect(knownAmount(entries, 'netflix', '2026-07-31')).toBeNull()
  })

  it('se rabat sur la prochaine échéance chiffrée, faute de passé', () => {
    const entries = [at('2026-08-27', 232_000, 'planned')]
    expect(knownAmount(entries, 'netflix', '2026-07-15')).toBe(232_000)
  })

  it('préfère le passé à l’avenir', () => {
    const entries = [at('2026-06-27', 250_000), at('2026-08-27', 900_000, 'planned')]
    expect(knownAmount(entries, 'netflix', '2026-07-15')).toBe(250_000)
  })

  it('ne dit rien sans aucune échéance chiffrée', () => {
    expect(knownAmount([], 'netflix', '2026-07-15')).toBeNull()
  })
})

describe('montant en vigueur d’une récurrence', () => {
  const MONTHLY = { unit: 'month' as const, every: 1, anchorDay: 27 }
  const fixe = makeRecurrence({ id: 'netflix', amount: eur(1099), period: MONTHLY })
  const variable = makeRecurrence({ id: 'netflix', amount: null, period: MONTHLY })

  it('rend le montant fixe tel quel', () => {
    expect(amountOn(fixe, [at('2026-06-27', 250_000)], '2026-07-15')).toBe(1099)
  })

  it('lit les échéances d’un variable', () => {
    expect(amountOn(variable, [at('2026-06-27', 250_000)], '2026-07-15')).toBe(250_000)
  })

  it('se rabat sur le montant habituel, faute d’échéance chiffrée', () => {
    const estimé = { ...variable, estimate: eur(240_000) }
    expect(amountOn(estimé, [], '2026-07-15')).toBe(240_000)
  })

  it('laisse une échéance chiffrée l’emporter sur le montant habituel', () => {
    // L'estimation ne recouvre jamais un fait : sinon une augmentation resterait
    // invisible tant qu'on n'a pas pensé à corriger la récurrence.
    const estimé = { ...variable, estimate: eur(240_000) }
    expect(amountOn(estimé, [at('2026-06-27', 250_000)], '2026-07-15')).toBe(250_000)
  })

  it('ne dit rien d’un variable sans échéance ni montant habituel', () => {
    expect(amountOn(variable, [], '2026-07-15')).toBeNull()
  })
})
