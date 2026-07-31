/* ============================================================================
 * Capital restant dû d'un crédit.
 *
 * La mensualité, elle, n'a rien de particulier : c'est une `Entry` posée par
 * une récurrence, comme un abonnement. Ce module ne calcule qu'une chose, mais
 * que rien d'autre ne sait faire — combien il reste à devoir.
 *
 * Sans intérêts, la réponse est une soustraction. Avec, elle ne l'est plus :
 * une mensualité de 500 € sur un capital de 100 000 € à 4 % n'amortit que
 * ~167 € le premier mois, le reste part en intérêts. Retrancher les
 * mensualités versées surestimerait donc massivement le remboursement, et
 * annoncerait un crédit soldé des années avant qu'il ne le soit.
 * ==========================================================================*/

import { type ISODate, diffMonths, ymOf } from './date'
import { type Money, money, sum } from './money'
import type { Debt, Entry } from './types'

/** 450 points de base = 4,50 % annuels. Mensualisé, sans passer par un %. */
function monthlyRate(rateBp: number): number {
  return rateBp / 10_000 / 12
}

/**
 * Capital restant après `paid` mensualités de `monthly`.
 *
 * Formule d'amortissement classique : `Rₙ = P(1+i)ⁿ − M((1+i)ⁿ − 1) / i`.
 * Le résultat est borné à [0, P] — un arrondi ne doit jamais faire apparaître
 * une dette négative ni un capital qui remonte au-dessus de l'emprunt.
 */
export function remainingPrincipal(
  principal: Money,
  monthly: Money | null,
  rateBp: number,
  payments: number,
): Money {
  if (payments <= 0) return principal
  if (monthly === null || monthly <= 0) return principal

  if (rateBp <= 0) {
    return money(Math.max(0, Math.min(principal, principal - monthly * payments)))
  }

  const i = monthlyRate(rateBp)
  const growth = (1 + i) ** payments
  const remaining = principal * growth - (monthly * (growth - 1)) / i
  return money(Math.max(0, Math.min(principal, Math.round(remaining))))
}

export type DebtStatus = {
  debt: Debt
  /** Mensualité connue, lue sur la récurrence liée. */
  monthly: Money | null
  /** Mensualités effectivement confirmées à ce jour. */
  payments: number
  /** Somme réellement versée — intérêts compris. */
  paid: Money
  /** Ce qu'il reste à devoir. */
  remaining: Money
  /** Part du capital déjà remboursée, de 0 à 1. */
  progress: number
  /** Mensualités restantes jusqu'à `endsOn`, jamais négatif. */
  monthsLeft: number
  /** Vrai quand le capital est à zéro, ou l'échéance finale dépassée. */
  settled: boolean
}

/**
 * L'état d'un crédit à une date donnée.
 *
 * `monthly` vient de la récurrence liée, pas du crédit : c'est elle qui fait
 * foi, et la changer doit se répercuter sans avoir à ressaisir le crédit.
 * Sans récurrence liée, le capital ne peut pas décroître — on le dit plutôt
 * que de deviner.
 */
export function debtStatus(
  debt: Debt,
  entries: readonly Entry[],
  monthly: Money | null,
  on: ISODate,
): DebtStatus {
  const paidEntries =
    debt.recurrenceId === undefined
      ? []
      : entries.filter(
          (entry) =>
            entry.recurrenceId === debt.recurrenceId &&
            entry.status === 'confirmed' &&
            entry.date <= on,
        )

  const payments = paidEntries.length
  const paid = money(paidEntries.reduce((total, entry) => total + entry.amount, 0))
  const remaining = remainingPrincipal(debt.principal, monthly, debt.rateBp ?? 0, payments)
  const monthsLeft = Math.max(0, diffMonths(ymOf(on), ymOf(debt.endsOn)))

  return {
    debt,
    monthly,
    payments,
    paid,
    remaining,
    progress: debt.principal <= 0 ? 1 : 1 - remaining / debt.principal,
    monthsLeft,
    settled: remaining <= 0 || on > debt.endsOn,
  }
}

/** Ce que le foyer doit encore, tous crédits confondus. */
export function totalRemaining(statuses: readonly DebtStatus[]): Money {
  return sum(statuses.map((status) => status.remaining))
}
