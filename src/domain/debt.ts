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
 * Capital restant après les mensualités `payments`, dans l'ordre où elles ont
 * été versées.
 *
 * C'est la formule d'amortissement classique — `Rₙ = P(1+i)ⁿ − M((1+i)ⁿ − 1)/i`
 * — écrite sous forme de récurrence : `Rₖ = Rₖ₋₁(1+i) − Mₖ`. Les deux donnent
 * le même chiffre à mensualité constante, mais seule la récurrence accepte que
 * les versements diffèrent. Or ils diffèrent : une renégociation, un différé,
 * un remboursement anticipé changent le montant en cours de route, et rejouer
 * tout le passé à la mensualité d'aujourd'hui inventerait un historique. C'est
 * chaque échéance confirmée qui fait foi, à son montant à elle.
 *
 * Le résultat est borné à [0, P] — un arrondi ne doit jamais faire apparaître
 * une dette négative ni un capital qui remonte au-dessus de l'emprunt.
 */
export function remainingPrincipal(
  principal: Money,
  payments: readonly Money[],
  rateBp: number,
): Money {
  if (payments.length === 0) return principal

  if (rateBp <= 0) {
    return money(Math.max(0, Math.min(principal, principal - sum(payments))))
  }

  const i = monthlyRate(rateBp)
  let remaining: number = principal
  for (const payment of payments) {
    remaining = remaining * (1 + i) - payment
  }
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
 * foi, et la changer doit se répercuter sans avoir à ressaisir le crédit. Elle
 * ne sert qu'à annoncer la prochaine échéance : le capital, lui, se calcule sur
 * les montants réellement versés. Sans récurrence liée, il ne peut pas
 * décroître — on le dit plutôt que de deviner.
 *
 * Une échéance antérieure au crédit ne le rembourse pas : un abonnement peut
 * avoir servi à autre chose avant d'être rattaché, et les mensualités qu'il a
 * posées alors n'amortissent rien ici.
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
      : entries
          .filter(
            (entry) =>
              entry.recurrenceId === debt.recurrenceId &&
              entry.status === 'confirmed' &&
              entry.date >= debt.startedOn &&
              entry.date <= on,
          )
          .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  const payments = paidEntries.length
  const paid = sum(paidEntries.map((entry) => entry.amount))
  const remaining = remainingPrincipal(
    debt.principal,
    paidEntries.map((entry) => entry.amount),
    debt.rateBp ?? 0,
  )
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
