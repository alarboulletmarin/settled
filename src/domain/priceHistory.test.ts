import { describe, expect, it } from 'vitest'
import { money } from './money'
import { eur, makeEntry } from './fixtures'
import { detectPriceChange, isCostly, priceHistory } from './priceHistory'

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
    expect(isCostly(change(100), 'out')).toBe(true)
  })

  it('une charge qui baisse ne pèse pas', () => {
    expect(isCostly(change(-100), 'out')).toBe(false)
  })

  it('un revenu qui baisse pèse', () => {
    expect(isCostly(change(-100), 'in')).toBe(true)
  })

  it('une augmentation de salaire n’est pas une alerte', () => {
    expect(isCostly(change(100), 'in')).toBe(false)
  })
})
