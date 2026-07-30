/* ============================================================================
 * Sélecteurs de statistiques du mois.
 *
 * Une `Entry` est la seule source de vérité. Une `planned` compte dans les
 * prévisions, jamais dans le réalisé — c'est la règle qui sépare `balance` de
 * `forecastBalance`, et elle ne souffre aucune exception.
 * ==========================================================================*/

import {
  type ISODate,
  type YearMonth,
  addDays,
  daysInMonth,
  diffDays,
  endOfMonth,
  parseYm,
  startOfMonth,
  ymOf,
} from './date'
import { type Money, ZERO, add, ratio, sub, sum } from './money'
import { monthlyEquivalent, annualCost } from './recurrence'
import type { Direction, Entry, Recurrence } from './types'

/** Filtre par membre. `undefined` = tout le foyer. */
export type MemberFilter = string | undefined

export function entriesOfMonth(
  entries: readonly Entry[],
  month: YearMonth,
  memberId?: MemberFilter,
): Entry[] {
  return entries.filter(
    (e) => ymOf(e.date) === month && (memberId === undefined || e.memberId === memberId),
  )
}

function totalOf(entries: readonly Entry[], direction: Direction, planned: boolean): Money {
  return sum(
    entries
      .filter((e) => e.direction === direction && (e.status === 'planned') === planned)
      .map((e) => e.amount),
  )
}

export type MonthTotals = {
  confirmedIn: Money
  confirmedOut: Money
  plannedIn: Money
  plannedOut: Money
  /** Réalisé : entrées confirmées − sorties confirmées. */
  balance: Money
  /** Prévisionnel : en incluant les `planned` restantes. */
  forecastBalance: Money
}

export function monthTotals(
  entries: readonly Entry[],
  month: YearMonth,
  memberId?: MemberFilter,
): MonthTotals {
  const scoped = entriesOfMonth(entries, month, memberId)
  const confirmedIn = totalOf(scoped, 'in', false)
  const confirmedOut = totalOf(scoped, 'out', false)
  const plannedIn = totalOf(scoped, 'in', true)
  const plannedOut = totalOf(scoped, 'out', true)
  return {
    confirmedIn,
    confirmedOut,
    plannedIn,
    plannedOut,
    balance: sub(confirmedIn, confirmedOut),
    forecastBalance: sub(add(confirmedIn, plannedIn), add(confirmedOut, plannedOut)),
  }
}

/* --- Reste à vivre --------------------------------------------------------*/

/** Date de la prochaine rentrée d'argent strictement après `after`. */
export function nextIncomeDate(entries: readonly Entry[], after: ISODate): ISODate | null {
  let best: ISODate | null = null
  for (const entry of entries) {
    if (entry.direction !== 'in') continue
    if (entry.date <= after) continue
    if (best === null || entry.date < best) best = entry.date
  }
  return best
}

/**
 * Reste à vivre : le solde prévisionnel arrêté juste avant la prochaine rentrée
 * d'argent. Autrement dit ce qu'il reste une fois payé tout ce qui tombe d'ici
 * là. S'il n'y a plus aucune rentrée en vue, l'horizon est la fin du mois.
 */
export function restToLive(
  entries: readonly Entry[],
  month: YearMonth,
  today: ISODate,
  memberId?: MemberFilter,
): Money {
  const scoped = entriesOfMonth(entries, month, memberId)
  const income = nextIncomeDate(scoped, today)
  const horizon = income === null ? endOfMonth(month) : addDays(income, -1)

  const confirmed = scoped.filter((e) => e.status === 'confirmed')
  const upcoming = scoped.filter((e) => e.status === 'planned' && e.date <= horizon)

  const inflow = sum([...confirmed, ...upcoming].filter((e) => e.direction === 'in').map((e) => e.amount))
  const outflow = sum(
    [...confirmed, ...upcoming].filter((e) => e.direction === 'out').map((e) => e.amount),
  )
  return sub(inflow, outflow)
}

/* --- Répartition ----------------------------------------------------------*/

export type CategorySlice = {
  categoryId: string
  total: Money
  /** Part du total, entre 0 et 1. */
  share: number
}

/**
 * Répartition par catégorie. Au-delà de `limit` catégories, le reste est
 * regroupé sous une part unique dont `categoryId` vaut `OTHER_CATEGORY`.
 */
export const OTHER_CATEGORY = '__other__'

export function breakdownByCategory(
  entries: readonly Entry[],
  month: YearMonth,
  direction: Direction,
  memberId?: MemberFilter,
  limit = 6,
): CategorySlice[] {
  const scoped = entriesOfMonth(entries, month, memberId).filter((e) => e.direction === direction)
  const byCategory = new Map<string, Money>()
  for (const entry of scoped) {
    byCategory.set(entry.categoryId, add(byCategory.get(entry.categoryId) ?? ZERO, entry.amount))
  }

  const total = sum([...byCategory.values()])
  const sorted = [...byCategory.entries()]
    .map(([categoryId, amount]) => ({ categoryId, total: amount, share: ratio(amount, total) }))
    .sort((a, b) => b.total - a.total)

  if (sorted.length <= limit) return sorted
  const head = sorted.slice(0, limit)
  const rest = sum(sorted.slice(limit).map((s) => s.total))
  return [...head, { categoryId: OTHER_CATEGORY, total: rest, share: ratio(rest, total) }]
}

/* --- Dépenses par jour ----------------------------------------------------*/

export type DaySlice = { categoryId: string; total: Money }
export type DayTotals = { date: ISODate; total: Money; slices: DaySlice[] }

/** Un point par jour du mois, y compris les jours vides : la barre doit exister. */
export function dailyBreakdown(
  entries: readonly Entry[],
  month: YearMonth,
  direction: Direction = 'out',
  memberId?: MemberFilter,
): DayTotals[] {
  const { y, m } = parseYm(month)
  const scoped = entriesOfMonth(entries, month, memberId).filter((e) => e.direction === direction)
  const days = new Map<ISODate, Map<string, Money>>()

  for (const entry of scoped) {
    const day = days.get(entry.date) ?? new Map<string, Money>()
    day.set(entry.categoryId, add(day.get(entry.categoryId) ?? ZERO, entry.amount))
    days.set(entry.date, day)
  }

  return Array.from({ length: daysInMonth(y, m) }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, '0')}`
    const slices = [...(days.get(date) ?? new Map<string, Money>())].map(
      ([categoryId, total]) => ({ categoryId, total }),
    )
    return { date, total: sum(slices.map((s) => s.total)), slices }
  })
}

/* --- Prochaines échéances -------------------------------------------------*/

export type Upcoming = { entry: Entry; daysLeft: number }

export function upcomingEntries(
  entries: readonly Entry[],
  from: ISODate,
  limit = 5,
  memberId?: MemberFilter,
): Upcoming[] {
  return entries
    .filter(
      (e) =>
        e.status === 'planned' &&
        e.date >= from &&
        (memberId === undefined || e.memberId === memberId),
    )
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, limit)
    .map((entry) => ({ entry, daysLeft: diffDays(from, entry.date) }))
}

/* --- Abonnements ----------------------------------------------------------*/

export type SubscriptionTotals = {
  monthly: Money
  annual: Money
  /** Récurrences variables dont aucun montant confirmé ne permet d'estimer. */
  unknownCount: number
}

/**
 * Coût des récurrences sortantes actives, amorti au mois et à l'année.
 * Une récurrence à montant variable est estimée à sa dernière échéance
 * confirmée ; faute de quoi elle est comptée comme inconnue plutôt qu'à zéro.
 */
export function subscriptionTotals(
  recurrences: readonly Recurrence[],
  resolveVariable: (recurrence: Recurrence) => Money | null,
  on: ISODate,
): SubscriptionTotals {
  let monthly = ZERO
  let annual = ZERO
  let unknownCount = 0

  for (const recurrence of recurrences) {
    if (recurrence.direction !== 'out') continue
    if (recurrence.endedOn !== undefined && recurrence.endedOn < on) continue

    const resolved =
      recurrence.amount ?? resolveVariable(recurrence)
    if (resolved === null) {
      unknownCount += 1
      continue
    }
    const priced: Recurrence = { ...recurrence, amount: resolved }
    monthly = add(monthly, monthlyEquivalent(priced) ?? ZERO)
    annual = add(annual, annualCost(priced) ?? ZERO)
  }

  return { monthly, annual, unknownCount }
}

/* --- Progression du mois --------------------------------------------------*/

/** Part du mois écoulée, entre 0 et 1. Sert à l'anneau signature. */
export function monthProgress(month: YearMonth, today: ISODate): number {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  if (today < start) return 0
  if (today > end) return 1
  const { y, m } = parseYm(month)
  return (diffDays(start, today) + 1) / daysInMonth(y, m)
}
