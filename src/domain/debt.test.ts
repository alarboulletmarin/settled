import { describe, expect, it } from 'vitest'
import { debtStatus, remainingPrincipal, totalRemaining } from './debt'
import { eur, makeDebt, makeEntry } from './fixtures'

describe('capital restant dû', () => {
  it('ne bouge pas tant qu’aucune mensualité n’est versée', () => {
    expect(remainingPrincipal(eur(1_000_000), eur(50_000), 0, 0)).toBe(1_000_000)
  })

  it('sans intérêts, décroît exactement du montant versé', () => {
    expect(remainingPrincipal(eur(1_000_000), eur(50_000), 0, 4)).toBe(800_000)
  })

  it('sans intérêts, ne descend jamais sous zéro', () => {
    expect(remainingPrincipal(eur(100_000), eur(50_000), 0, 9)).toBe(0)
  })

  it('sans mensualité connue, laisse le capital intact', () => {
    expect(remainingPrincipal(eur(1_000_000), null, 400, 12)).toBe(1_000_000)
  })

  /**
   * 100 000 € à 4 % sur 20 ans : la mensualité est de 605,98 €. Après un an,
   * il reste ~96 963 € — alors que 12 × 605,98 = 7 272 € ont été versés. Le
   * fossé entre les deux est précisément ce que ce module existe pour dire.
   */
  it('avec intérêts, amortit bien moins que ce qui est versé', () => {
    const remaining = remainingPrincipal(eur(10_000_000), eur(60_598), 400, 12)
    expect(remaining).toBeGreaterThan(9_600_000)
    expect(remaining).toBeLessThan(9_750_000)

    const naive = 10_000_000 - 60_598 * 12
    expect(remaining - naive).toBeGreaterThan(250_000)
  })

  it('avec intérêts, décroît de plus en plus vite', () => {
    const first = 10_000_000 - remainingPrincipal(eur(10_000_000), eur(60_598), 400, 12)
    const tenth = remainingPrincipal(eur(10_000_000), eur(60_598), 400, 108) -
      remainingPrincipal(eur(10_000_000), eur(60_598), 400, 120)
    expect(tenth).toBeGreaterThan(first)
  })

  it('reste un entier de centimes, jamais un flottant', () => {
    const remaining = remainingPrincipal(eur(1_234_567), eur(9_876), 375, 17)
    expect(Number.isInteger(remaining)).toBe(true)
  })

  it('ne remonte jamais au-dessus du capital emprunté', () => {
    // Une mensualité dérisoire face aux intérêts ferait enfler la dette.
    expect(remainingPrincipal(eur(10_000_000), eur(100), 900, 60)).toBe(10_000_000)
  })
})

describe('état d’un crédit', () => {
  const debt = makeDebt({
    id: 'd1',
    recurrenceId: 'r1',
    principal: eur(1_200_000),
    startedOn: '2026-01-05',
    endsOn: '2028-12-05',
  })

  const paid = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      makeEntry({
        id: `p${String(i)}`,
        recurrenceId: 'r1',
        date: `2026-0${String(i + 1)}-05`,
        amount: eur(35_000),
        status: 'confirmed',
      }),
    )

  it('ne compte que les mensualités confirmées', () => {
    const entries = [
      ...paid(3),
      makeEntry({ id: 'x', recurrenceId: 'r1', date: '2026-04-05', status: 'planned' }),
    ]
    expect(debtStatus(debt, entries, eur(35_000), '2026-04-30').payments).toBe(3)
  })

  it('ignore les échéances postérieures à la date de lecture', () => {
    expect(debtStatus(debt, paid(5), eur(35_000), '2026-03-31').payments).toBe(3)
  })

  it('ignore les échéances d’une autre récurrence', () => {
    const entries = [...paid(2), makeEntry({ id: 'autre', recurrenceId: 'r9', date: '2026-01-09' })]
    expect(debtStatus(debt, entries, eur(35_000), '2026-12-31').payments).toBe(2)
  })

  it('sans récurrence liée, ne rembourse rien', () => {
    const orphan = makeDebt({ id: 'd2', principal: eur(500_000) })
    const status = debtStatus(orphan, paid(6), null, '2026-12-31')
    expect(status.payments).toBe(0)
    expect(status.remaining).toBe(500_000)
    expect(status.monthly).toBeNull()
  })

  it('se dit soldé une fois l’échéance finale passée', () => {
    expect(debtStatus(debt, [], eur(35_000), '2029-01-01').settled).toBe(true)
  })

  it('ne rend jamais un nombre de mensualités restantes négatif', () => {
    expect(debtStatus(debt, [], eur(35_000), '2030-06-01').monthsLeft).toBe(0)
  })

  it('additionne ce qui reste à devoir', () => {
    const a = debtStatus(debt, paid(4), eur(35_000), '2026-12-31')
    const b = debtStatus(makeDebt({ id: 'd3', principal: eur(300_000) }), [], null, '2026-12-31')
    expect(totalRemaining([a, b])).toBe(a.remaining + b.remaining)
  })
})
