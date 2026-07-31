import { describe, expect, it } from 'vitest'
import { advanceStatus, instalments, monthlyInstalment, monthsCovered, totalRemaining } from './advance'
import { eur, makeEntry } from './fixtures'
import { money } from './money'
import type { Advance } from './types'

const advance = (over: Partial<Advance> = {}): Advance => ({
  id: 'av-1',
  label: 'Assurance auto',
  categoryId: 'car-insurance',
  memberId: 'm-1',
  amount: eur(60000),
  paidOn: '2026-01-15',
  from: '2026-01',
  to: '2026-12',
  recurrenceId: 'rec-1',
  ...over,
})

describe('période couverte', () => {
  it('compte les deux bornes', () => {
    expect(monthsCovered({ from: '2026-01', to: '2026-12' })).toBe(12)
    expect(monthsCovered({ from: '2026-01', to: '2026-01' })).toBe(1)
  })

  it('ne descend jamais sous un mois, même si la saisie inverse les bornes', () => {
    expect(monthsCovered({ from: '2026-12', to: '2026-01' })).toBe(1)
  })
})

describe('mensualité d’une avance', () => {
  it('divise sans reste quand ça tombe juste', () => {
    expect(monthlyInstalment(advance())).toBe(5000)
  })

  /* Sept fois 85,71 € font 599,97 € : trois centimes manquants, et une avance
     qui ne se reconstituerait jamais tout à fait. */
  it('ne perd aucun centime sur une division qui ne tombe pas juste', () => {
    const seven = { amount: eur(60000), from: '2026-01', to: '2026-07' }
    const parts = instalments(seven)
    expect(parts).toHaveLength(7)
    expect(parts.reduce((a, b) => a + b, 0)).toBe(60000)
  })

  it('porte le centime en trop sur les premières mensualités', () => {
    const parts = instalments({ amount: eur(10), from: '2026-01', to: '2026-03' })
    expect(parts).toEqual([4, 3, 3])
    expect(monthlyInstalment({ amount: eur(10), from: '2026-01', to: '2026-03' })).toBe(4)
  })
})

describe('où en est une avance', () => {
  const paid = (date: string, amount = eur(5000)) =>
    makeEntry({ id: date, recurrenceId: 'rec-1', date, amount, status: 'confirmed' })

  it('ne rend rien tant que rien n’est revenu', () => {
    const status = advanceStatus(advance(), [], '2026-01')
    expect(status.restored).toBe(0)
    expect(status.remaining).toBe(60000)
    expect(status.settled).toBe(false)
  })

  it('déduit les échéances confirmées, à leur montant à elles', () => {
    const status = advanceStatus(
      advance(),
      [paid('2026-01-15'), paid('2026-02-15', eur(8000))],
      '2026-02',
    )
    expect(status.restored).toBe(13000)
    expect(status.remaining).toBe(47000)
  })

  it('ignore les prévues : ce qui n’est pas revenu n’est pas revenu', () => {
    const planned = makeEntry({
      id: 'p',
      recurrenceId: 'rec-1',
      date: '2026-02-15',
      amount: eur(5000),
      status: 'planned',
    })
    expect(advanceStatus(advance(), [paid('2026-01-15'), planned], '2026-02').restored).toBe(5000)
  })

  /* La même règle que pour un crédit : la récurrence a pu servir à autre chose
     avant d'être rattachée. */
  it('ignore ce qui précède le paiement', () => {
    expect(advanceStatus(advance(), [paid('2025-12-15')], '2026-01').restored).toBe(0)
  })

  it('s’arrête au mois affiché : novembre ne sait rien de décembre', () => {
    const status = advanceStatus(advance(), [paid('2026-01-15'), paid('2026-12-15')], '2026-01')
    expect(status.restored).toBe(5000)
  })

  it('ne rend jamais un reste négatif quand on se rembourse plus vite', () => {
    const status = advanceStatus(advance(), [paid('2026-01-15', eur(90000))], '2026-01')
    expect(status.remaining).toBe(0)
    expect(status.settled).toBe(true)
  })

  it('ne compte rien tant qu’aucune récurrence ne la reconstitue', () => {
    const { recurrenceId: _, ...orphan } = advance()
    expect(advanceStatus(orphan, [paid('2026-01-15')], '2026-01').restored).toBe(0)
  })

  it('cumule ce qui reste à reconstituer', () => {
    const one = advanceStatus(advance(), [], '2026-01')
    const two = advanceStatus(advance({ id: 'av-2', amount: money(20000) }), [], '2026-01')
    expect(totalRemaining([one, two])).toBe(80000)
  })
})
