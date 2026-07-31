import { describe, expect, it } from 'vitest'
import { eur, makeEntry, makeMember, makeRecurrence } from './fixtures'
import { money } from './money'
import {
  allocate,
  isSharedEntry,
  largestRemainder,
  memberIncomes,
  memberShares,
  monthlyIncome,
  sharedTotal,
  totalDue,
} from './split'
import type { CategoryKind } from './types'

/* --- Répartition d'un entier ----------------------------------------------*/

describe('plus forts restes', () => {
  it('répartit au prorata des poids', () => {
    expect(largestRemainder(10_000, [2500, 2000])).toEqual([5556, 4444])
  })

  it('ne perd ni n’invente une unité', () => {
    const parts = largestRemainder(10, [1, 1, 1])
    expect(parts).toEqual([4, 3, 3])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10)
  })

  it('donne l’unité restante au plus fort reste', () => {
    // 100 entre 3 et 1 : 75 et 25 pile, aucun reste à distribuer.
    expect(largestRemainder(100, [3, 1])).toEqual([75, 25])
    // 100 entre 1 et 2 : 33,33 et 66,67 — le reste va au second.
    expect(largestRemainder(100, [1, 2])).toEqual([33, 67])
  })

  it('départage deux restes égaux par le poids le plus à gauche', () => {
    expect(largestRemainder(1, [1, 1])).toEqual([1, 0])
  })

  it('rend des parts nulles quand tous les poids sont nuls', () => {
    expect(largestRemainder(500, [0, 0])).toEqual([0, 0])
  })

  it('refuse un total fractionnaire', () => {
    expect(() => largestRemainder(10.5, [1, 1])).toThrow(TypeError)
  })

  it('reste exact sur un montant négatif', () => {
    const parts = largestRemainder(-10, [1, 1, 1])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(-10)
  })
})

describe('allocate', () => {
  it('répartit un montant sans qu’un centime se perde', () => {
    const parts = allocate(eur(200_000), [250_000, 200_000])
    expect(parts).toEqual([money(111_111), money(88_889)])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(200_000)
  })

  it('répartit zéro en parts nulles', () => {
    expect(allocate(eur(0), [1, 2])).toEqual([money(0), money(0)])
  })
})

/* --- Ce qui se partage ----------------------------------------------------*/

const shared = (over: Parameters<typeof makeEntry>[0], kind: CategoryKind): boolean =>
  isSharedEntry(makeEntry(over), kind)

describe('ce qui entre dans les charges communes', () => {
  it('prend une charge que personne ne s’est attribuée', () => {
    expect(shared({ date: '2026-07-05' }, 'charge')).toBe(true)
  })

  it('prend aussi une mensualité de crédit', () => {
    expect(shared({ date: '2026-07-05' }, 'debt')).toBe(true)
  })

  it('laisse l’épargne à qui la met de côté', () => {
    expect(shared({ date: '2026-07-05' }, 'saving')).toBe(false)
  })

  it('ne partage pas une ressource', () => {
    expect(shared({ date: '2026-07-05', direction: 'in' }, 'resource')).toBe(false)
  })

  it('sort du partage une charge attribuée à un membre', () => {
    expect(shared({ date: '2026-07-05', memberId: 'm-1' }, 'charge')).toBe(false)
  })

  it('la case cochée l’emporte sur la règle', () => {
    expect(shared({ date: '2026-07-05', memberId: 'm-1', shared: true }, 'charge')).toBe(true)
    expect(shared({ date: '2026-07-05', shared: true }, 'saving')).toBe(true)
  })

  it('la case décochée l’emporte aussi', () => {
    expect(shared({ date: '2026-07-05', shared: false }, 'charge')).toBe(false)
  })
})

const KINDS: Record<string, CategoryKind> = {
  logement: 'charge',
  courses: 'charge',
  auto: 'debt',
  livret: 'saving',
  salaire: 'resource',
  prime: 'resource',
}
const kindOf = (categoryId: string): CategoryKind => KINDS[categoryId] ?? 'charge'

describe('total des charges communes', () => {
  const july = [
    makeEntry({ date: '2026-07-05', amount: eur(95_000), categoryId: 'logement' }),
    makeEntry({ date: '2026-07-08', amount: eur(12_000), categoryId: 'courses' }),
    makeEntry({ date: '2026-07-10', amount: eur(30_000), categoryId: 'auto' }),
    makeEntry({ date: '2026-07-12', amount: eur(20_000), categoryId: 'livret' }),
    makeEntry({ date: '2026-07-15', amount: eur(4_000), categoryId: 'courses', memberId: 'm-1' }),
    makeEntry({
      date: '2026-07-01',
      direction: 'in',
      amount: eur(250_000),
      categoryId: 'salaire',
    }),
    makeEntry({ date: '2026-08-03', amount: eur(9_999), categoryId: 'courses' }),
  ]

  it('somme les charges et les crédits sans membre', () => {
    expect(sharedTotal(july, '2026-07', kindOf)).toBe(137_000)
  })

  it('compte les échéances prévues, parce qu’il reste à les payer', () => {
    const withPlanned = [
      ...july,
      makeEntry({
        date: '2026-07-28',
        amount: eur(3_000),
        categoryId: 'courses',
        status: 'planned',
      }),
    ]
    expect(sharedTotal(withPlanned, '2026-07', kindOf)).toBe(140_000)
  })

  it('reprend une dépense attribuée dès qu’elle est cochée « à partager »', () => {
    const withFlag = july.map((e) =>
      e.memberId === 'm-1' ? { ...e, shared: true } : e,
    )
    expect(sharedTotal(withFlag, '2026-07', kindOf)).toBe(141_000)
  })
})

/* --- Parts de chacun ------------------------------------------------------*/

describe('le revenu d’un membre, lu sur ses abonnements', () => {
  const MONTHLY = { unit: 'month' as const, every: 1, anchorDay: 28 }
  const salaire = makeRecurrence({
    id: 'r-1', categoryId: 'salaire', memberId: 'm-1', direction: 'in',
    amount: eur(250_000), startedOn: '2025-01-28', period: MONTHLY,
  })
  const never: Parameters<typeof monthlyIncome>[3] = () => null
  const income = (recurrences: Parameters<typeof monthlyIncome>[0], resolve = never) =>
    monthlyIncome(recurrences, 'm-1', kindOf, resolve, '2026-07-15')

  it('somme les ressources du membre', () => {
    const apl = makeRecurrence({
      id: 'r-2', categoryId: 'salaire', memberId: 'm-1', direction: 'in',
      amount: eur(12_000), startedOn: '2025-01-05', period: MONTHLY,
    })
    expect(income([salaire, apl])).toBe(262_000)
  })

  it('ramène une périodicité non mensuelle au mois', () => {
    const annuel = makeRecurrence({
      id: 'r-3', categoryId: 'salaire', memberId: 'm-1', direction: 'in',
      amount: eur(120_000), startedOn: '2025-06-01',
      period: { unit: 'year', every: 1, anchorDay: 1 },
    })
    expect(income([annuel])).toBe(10_000)
  })

  it('ignore ce qui n’est pas une ressource', () => {
    const loyer = makeRecurrence({
      id: 'r-4', categoryId: 'logement', memberId: 'm-1',
      amount: eur(95_000), startedOn: '2025-01-05', period: MONTHLY,
    })
    expect(income([salaire, loyer])).toBe(250_000)
  })

  it('ignore les ressources d’un autre membre', () => {
    const autre = makeRecurrence({
      id: 'r-5', categoryId: 'salaire', memberId: 'm-2', direction: 'in',
      amount: eur(200_000), startedOn: '2025-01-28', period: MONTHLY,
    })
    expect(income([salaire, autre])).toBe(250_000)
  })

  it('ignore un salaire arrêté avant la date', () => {
    expect(income([{ ...salaire, endedOn: '2026-03-31' }])).toBeNull()
  })

  it('ne sait rien dire sans aucune ressource', () => {
    expect(income([])).toBeNull()
  })

  it('estime un montant variable sur sa dernière échéance confirmée', () => {
    const variable = { ...salaire, amount: null }
    expect(income([variable], () => eur(232_000))).toBe(232_000)
  })

  it('un revenu variable qu’on ne sait pas encore ne vaut pas zéro', () => {
    expect(income([{ ...salaire, amount: null }])).toBeNull()
  })

  it('rend un revenu par membre, dans l’ordre du foyer', () => {
    const autre = makeRecurrence({
      id: 'r-6', categoryId: 'salaire', memberId: 'm-2', direction: 'in',
      amount: eur(200_000), startedOn: '2025-01-28', period: MONTHLY,
    })
    expect(
      memberIncomes(
        [makeMember({ id: 'm-1' }), makeMember({ id: 'm-2' }), makeMember({ id: 'm-3' })],
        [salaire, autre],
        kindOf,
        never,
        '2026-07-15',
      ),
    ).toEqual([
      { memberId: 'm-1', income: 250_000 },
      { memberId: 'm-2', income: 200_000 },
      { memberId: 'm-3', income: null },
    ])
  })
})

describe('parts au prorata des revenus', () => {
  const foyer = [
    { memberId: 'm-1', income: eur(250_000) },
    { memberId: 'm-2', income: eur(200_000) },
  ]

  it('donne le coefficient de chacun en points de base', () => {
    const shares = memberShares(foyer, eur(200_000))
    expect(shares?.map((s) => s.shareBp)).toEqual([5556, 4444])
  })

  it('répartit les charges au centime près', () => {
    const shares = memberShares(foyer, eur(200_000))
    expect(shares?.map((s) => s.due)).toEqual([money(111_111), money(88_889)])
    expect(shares && totalDue(shares)).toBe(200_000)
  })

  it('la somme des parts vaut toujours le total, quel qu’il soit', () => {
    for (const total of [1, 7, 99, 100_001, 333_333]) {
      const shares = memberShares(foyer, money(total))
      expect(shares && totalDue(shares)).toBe(total)
    }
  })

  it('ne dit rien tant qu’un revenu n’est pas connu', () => {
    expect(memberShares([foyer[0]!, { memberId: 'm-2', income: null }], eur(200_000))).toBeNull()
  })

  it('ne dit rien avec un seul membre', () => {
    expect(memberShares([foyer[0]!], eur(200_000))).toBeNull()
  })

  it('ne dit rien quand tous les revenus sont à zéro', () => {
    const shares = memberShares(
      [{ memberId: 'm-1', income: eur(0) }, { memberId: 'm-2', income: eur(0) }],
      eur(200_000),
    )
    expect(shares).toBeNull()
  })

  it('donne tout à celui qui gagne, si l’autre est à zéro', () => {
    const shares = memberShares([foyer[0]!, { memberId: 'm-2', income: eur(0) }], eur(200_000))
    expect(shares?.map((s) => s.due)).toEqual([money(200_000), money(0)])
  })

  it('garde l’ordre du foyer', () => {
    const shares = memberShares([foyer[1]!, foyer[0]!], eur(200_000))
    expect(shares?.map((s) => s.memberId)).toEqual(['m-2', 'm-1'])
  })
})
