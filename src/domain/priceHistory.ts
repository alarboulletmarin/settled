/* ============================================================================
 * Historique de prix d'un abonnement.
 *
 * Il n'est jamais stocké : il se déduit des `Entry` confirmées liées à la
 * `recurrenceId` (cahier §3). Deux échéances au même montant ne constituent
 * pas un changement — seule une valeur qui diffère de la précédente en est un.
 * ==========================================================================*/

import type { ISODate } from './date'
import { type Money, sub } from './money'
import type { Direction, Entry } from './types'

export type PricePoint = { date: ISODate; amount: Money }

/** Les montants confirmés d'une récurrence, du plus ancien au plus récent. */
export function priceHistory(entries: readonly Entry[], recurrenceId: string): PricePoint[] {
  return entries
    .filter((e) => e.recurrenceId === recurrenceId && e.status === 'confirmed')
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((e) => ({ date: e.date, amount: e.amount }))
}

export type PriceChange = {
  previous: Money
  current: Money
  /** current − previous. Positif = augmentation. */
  delta: Money
  /** Date de l'échéance qui porte le nouveau montant. */
  since: ISODate
}

/**
 * Vrai quand le changement pèse : une sortie qui monte, une entrée qui baisse.
 *
 * Le sens en décide, sinon l'app signalerait une augmentation de salaire comme
 * une mauvaise nouvelle — et le DS §2.3 réserve le rouge aux dépassements et
 * aux erreurs. Un changement qui ne coûte rien se lit quand même, sans alarme.
 */
export function isCostly(change: PriceChange, direction: Direction): boolean {
  return direction === 'out' ? change.delta > 0 : change.delta < 0
}

/**
 * Dernier changement de prix constaté, ou null si le montant n'a jamais bougé.
 * On compare le dernier montant confirmé au dernier montant *différent* qui le
 * précède, pour que la fiche continue de signaler la hausse même après
 * plusieurs mois au nouveau tarif.
 */
export function detectPriceChange(
  entries: readonly Entry[],
  recurrenceId: string,
): PriceChange | null {
  const history = priceHistory(entries, recurrenceId)
  if (history.length < 2) return null

  const current = history[history.length - 1]
  if (current === undefined) return null

  for (let i = history.length - 2; i >= 0; i--) {
    const point = history[i]
    if (point === undefined) continue
    if (point.amount === current.amount) continue
    // La première échéance au nouveau tarif est celle qui suit ce point.
    const since = history[i + 1]?.date ?? current.date
    return {
      previous: point.amount,
      current: current.amount,
      delta: sub(current.amount, point.amount),
      since,
    }
  }
  return null
}
