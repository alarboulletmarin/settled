/* ============================================================================
 * Avances — une charge payée en une fois, remboursée à soi-même mois par mois.
 *
 * Le module ne calcule que deux choses, mais que rien d'autre ne sait faire :
 * combien la mensualité vaut, et combien il reste à remettre sur le livret.
 *
 * La mensualité, elle, n'a rien de particulier une fois posée : c'est une
 * `Entry` de nature `saving` produite par une récurrence, comme un virement
 * d'épargne programmé. C'est bien là tout l'intérêt — ce qui revient sur le
 * livret ne pèse pas dans les charges du mois, parce que la charge a déjà eu
 * lieu, une fois.
 * ==========================================================================*/

import { type YearMonth, diffMonths, ymOf } from './date'
import { type Money, ZERO, sub, sum } from './money'
import { largestRemainder } from './split'
import type { Advance, Entry } from './types'

/**
 * Le nombre de mois couverts, bornes comprises.
 *
 * Au moins un : une période dont la fin précède le début n'est pas une période,
 * mais la saisie peut la produire le temps qu'on corrige un champ, et diviser
 * par zéro n'est pas une manière de le dire.
 */
export function monthsCovered(advance: Pick<Advance, 'from' | 'to'>): number {
  return Math.max(1, diffMonths(advance.from, advance.to) + 1)
}

/**
 * Ce qui revient sur le livret chaque mois, mois par mois.
 *
 * Réparti aux plus forts restes, et non arrondi puis répété : 600 € sur sept
 * mois donneraient sept fois 85,71 €, soit un centime de moins que ce qui a été
 * avancé — et une avance qui ne se reconstitue jamais tout à fait est un chiffre
 * faux qui reste à l'écran pour toujours. Le centime en trop est porté par les
 * premières mensualités, comme partout ailleurs dans l'app.
 */
export function instalments(advance: Pick<Advance, 'amount' | 'from' | 'to'>): Money[] {
  const months = monthsCovered(advance)
  return largestRemainder(advance.amount, Array.from({ length: months }, () => 1)).map(
    (cents) => cents as Money,
  )
}

/**
 * La mensualité que porte la récurrence : la première, donc la plus forte.
 *
 * Une récurrence pose un montant, pas une suite. Prendre la plus forte plutôt
 * que la plus faible fait qu'on se rembourse au centime près ou d'un centime
 * d'avance, jamais d'un centime en retard — et un solde restant qui tombe à
 * zéro ferme la ligne, là où un centime orphelin la laisserait ouverte.
 */
export function monthlyInstalment(advance: Pick<Advance, 'amount' | 'from' | 'to'>): Money {
  return instalments(advance)[0] ?? ZERO
}

/** Ce qu'une avance a déjà rendu, et ce qu'elle doit encore. */
export type AdvanceStatus = {
  advance: Advance
  /** La mensualité posée sur le livret. */
  monthly: Money
  /** Ce qui est effectivement revenu — les échéances confirmées, à leur montant. */
  restored: Money
  /** Ce qu'il reste à remettre. Jamais négatif. */
  remaining: Money
  /** Nombre de mois couverts, bornes comprises. */
  months: number
  /** Vrai quand tout est revenu sur le livret. */
  settled: boolean
}

/**
 * Où en est une avance.
 *
 * Ce sont les échéances **confirmées** qui font foi, à leur montant à elles, et
 * non la mensualité multipliée par les mois écoulés : on peut se rembourser plus
 * vite, sauter un mois, ou corriger un montant, et rejouer le passé au montant
 * d'aujourd'hui inventerait un historique. C'est le raisonnement de `debt.ts`,
 * pour la même raison.
 *
 * Les échéances antérieures au paiement ne comptent pas : la récurrence a pu
 * servir à autre chose avant d'être rattachée à cette avance.
 */
export function advanceStatus(
  advance: Advance,
  entries: readonly Entry[],
  on: YearMonth,
): AdvanceStatus {
  const monthly = monthlyInstalment(advance)
  const restored = sum(
    entries
      .filter(
        (entry) =>
          entry.recurrenceId === advance.recurrenceId &&
          advance.recurrenceId !== undefined &&
          entry.status === 'confirmed' &&
          entry.direction === 'out' &&
          entry.date >= advance.paidOn &&
          ymOf(entry.date) <= on,
      )
      .map((entry) => entry.amount),
  )

  // Borné à zéro : se rembourser plus vite que prévu ne crée pas une avance
  // négative, elle est simplement soldée.
  const remaining = restored >= advance.amount ? ZERO : sub(advance.amount, restored)
  return {
    advance,
    monthly,
    restored,
    remaining,
    months: monthsCovered(advance),
    settled: remaining === ZERO,
  }
}

/** Ce qu'il reste à reconstituer, toutes avances confondues. */
export function totalRemaining(statuses: readonly AdvanceStatus[]): Money {
  return sum(statuses.map((status) => status.remaining))
}
