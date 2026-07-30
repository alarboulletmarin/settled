/* ============================================================================
 * Historique et comparatifs.
 *
 * Toute série renvoie un point par période, y compris vides — c'est l'appelant
 * qui décide d'afficher un état vide plutôt qu'un graphique à zéro (cahier
 * §4.7), et il lui faut pour cela savoir qu'une période est vide, pas absente.
 * ==========================================================================*/

import { type YearMonth, addMonthsToYm, monthRange, ym, ymOf } from './date'
import { type Money, ZERO, add, sub, sum } from './money'
import { type MemberFilter, entriesOfMonth } from './stats'
import type { Direction, Entry } from './types'

export type MonthPoint = {
  ym: YearMonth
  in: Money
  out: Money
  balance: Money
  /** Faux dès qu'aucune entrée ne tombe dans le mois. */
  hasData: boolean
}

/** Série mensuelle sur [from, to], bornes incluses, sans trou. */
export function monthSeries(
  entries: readonly Entry[],
  from: YearMonth,
  to: YearMonth,
  memberId?: MemberFilter,
): MonthPoint[] {
  return monthRange(from, to).map((month) => {
    const scoped = entriesOfMonth(entries, month, memberId)
    const inflow = sum(scoped.filter((e) => e.direction === 'in').map((e) => e.amount))
    const outflow = sum(scoped.filter((e) => e.direction === 'out').map((e) => e.amount))
    return {
      ym: month,
      in: inflow,
      out: outflow,
      balance: sub(inflow, outflow),
      hasData: scoped.length > 0,
    }
  })
}

/** Les `count` derniers mois, `endYm` inclus. */
export function trailingMonths(
  entries: readonly Entry[],
  endYm: YearMonth,
  count = 12,
  memberId?: MemberFilter,
): MonthPoint[] {
  return monthSeries(entries, addMonthsToYm(endYm, -(count - 1)), endYm, memberId)
}

/* --- Comparaison de deux mois --------------------------------------------*/

export type CategoryDelta = {
  categoryId: string
  left: Money
  right: Money
  /** right − left. */
  delta: Money
  /** Écart relatif. null quand le mois de gauche est à zéro : rien à diviser. */
  deltaRatio: number | null
}

function totalsByCategory(
  entries: readonly Entry[],
  month: YearMonth,
  direction: Direction,
  memberId?: MemberFilter,
): Map<string, Money> {
  const totals = new Map<string, Money>()
  for (const entry of entriesOfMonth(entries, month, memberId)) {
    if (entry.direction !== direction) continue
    totals.set(entry.categoryId, add(totals.get(entry.categoryId) ?? ZERO, entry.amount))
  }
  return totals
}

/** Écart par catégorie entre deux mois, en valeur et en proportion. */
export function compareMonths(
  entries: readonly Entry[],
  left: YearMonth,
  right: YearMonth,
  direction: Direction = 'out',
  memberId?: MemberFilter,
): CategoryDelta[] {
  const a = totalsByCategory(entries, left, direction, memberId)
  const b = totalsByCategory(entries, right, direction, memberId)
  const ids = new Set([...a.keys(), ...b.keys()])

  return [...ids]
    .map((categoryId) => {
      const leftTotal = a.get(categoryId) ?? ZERO
      const rightTotal = b.get(categoryId) ?? ZERO
      return {
        categoryId,
        left: leftTotal,
        right: rightTotal,
        delta: sub(rightTotal, leftTotal),
        deltaRatio: leftTotal === 0 ? null : (rightTotal - leftTotal) / leftTotal,
      }
    })
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
}

/* --- Comparaison d'années ------------------------------------------------*/

export type YearPoint = {
  month: number
  in: Money
  out: Money
  balance: Money
  /** Cumul du solde depuis janvier. */
  cumulative: Money
  hasData: boolean
}

export function yearSeries(
  entries: readonly Entry[],
  year: number,
  memberId?: MemberFilter,
): YearPoint[] {
  const points = monthSeries(entries, ym(year, 1), ym(year, 12), memberId)
  let running = ZERO
  return points.map((point, index) => {
    running = add(running, point.balance)
    return {
      month: index + 1,
      in: point.in,
      out: point.out,
      balance: point.balance,
      cumulative: running,
      hasData: point.hasData,
    }
  })
}

/** Les années couvertes par les données, de la plus ancienne à la plus récente. */
export function coveredYears(entries: readonly Entry[]): number[] {
  const years = new Set<number>()
  for (const entry of entries) years.add(Number(ymOf(entry.date).slice(0, 4)))
  return [...years].sort((a, b) => a - b)
}

export function hasDataInYear(entries: readonly Entry[], year: number): boolean {
  const prefix = String(year)
  return entries.some((e) => e.date.startsWith(prefix))
}
