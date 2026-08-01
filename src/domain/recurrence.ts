/* ============================================================================
 * Expansion d'une récurrence en échéances.
 *
 * Toute la difficulté tient en une règle : le jour d'échéance est *borné*, pas
 * *reporté*. Une récurrence au 31 tombe le 31 janvier, le 28 février, puis de
 * nouveau le 31 mars. La borne ne se propage jamais à l'échéance suivante,
 * sinon une récurrence au 31 dériverait vers le 28 au premier février venu.
 * ==========================================================================*/

import {
  type ISODate,
  type YearMonth,
  addDays,
  addMonthsToYm,
  daysInMonth,
  dayOfWeek,
  diffDays,
  diffMonths,
  endOfMonth,
  parseISO,
  parseYm,
  startOfMonth,
  toISO,
  ym,
  ymOf,
} from './date'
import { type Money, divInt, scale } from './money'
import type { Recurrence } from './types'

/** Une échéance : une date, et la récurrence qui l'a produite. */
export type Occurrence = {
  recurrenceId: string
  date: ISODate
}

/** Borne haute de sécurité : une expansion ne renvoie jamais plus que ça. */
const MAX_OCCURRENCES = 2000

function normalizeEvery(every: number): number {
  return Number.isInteger(every) && every > 0 ? every : 1
}

/* --- Expansion ------------------------------------------------------------*/

/**
 * Toutes les échéances de `recurrence` dans [from, to], bornes incluses.
 * Le résultat est trié et ne contient que des dates où la récurrence est active.
 */
export function expandRecurrence(
  recurrence: Recurrence,
  from: ISODate,
  to: ISODate,
): Occurrence[] {
  if (to < from) return []
  const lower = from > recurrence.startedOn ? from : recurrence.startedOn
  const upper = recurrence.endedOn !== undefined && recurrence.endedOn < to ? recurrence.endedOn : to
  if (upper < lower) return []

  const dates =
    recurrence.period.unit === 'week'
      ? weeklyDates(recurrence, lower, upper)
      : monthlyOrYearlyDates(recurrence, lower, upper)

  return dates.map((date) => ({ recurrenceId: recurrence.id, date }))
}

function weeklyDates(recurrence: Recurrence, lower: ISODate, upper: ISODate): ISODate[] {
  const every = normalizeEvery(recurrence.period.every)
  const step = 7 * every
  const anchor = firstWeekdayOnOrAfter(recurrence.startedOn, recurrence.period.anchorDay)

  // On saute directement dans la fenêtre plutôt que d'itérer depuis le départ :
  // une hebdomadaire commencée en 2015 sinon coûte des centaines de tours.
  const skipped = Math.max(0, Math.ceil(diffDays(anchor, lower) / step))
  const dates: ISODate[] = []
  for (let i = skipped; dates.length < MAX_OCCURRENCES; i++) {
    const date = addDays(anchor, i * step)
    if (date > upper) break
    if (date >= lower) dates.push(date)
  }
  return dates
}

function monthlyOrYearlyDates(recurrence: Recurrence, lower: ISODate, upper: ISODate): ISODate[] {
  const every = normalizeEvery(recurrence.period.every)
  const yearly = recurrence.period.unit === 'year'
  const stepInMonths = yearly ? 12 * every : every
  const start = parseISO(recurrence.startedOn)
  // Une annuelle garde le mois de son départ ; une mensuelle balaie tous les mois.
  const anchorMonth = yearly ? ym(start.y, start.m) : ymOf(recurrence.startedOn)

  const offset = diffMonths(anchorMonth, ymOf(lower))
  const firstStep = Math.max(0, Math.ceil(offset / stepInMonths))

  const dates: ISODate[] = []
  for (let i = firstStep; dates.length < MAX_OCCURRENCES; i++) {
    const month = addMonthsToYm(anchorMonth, i * stepInMonths)
    if (startOfMonth(month) > upper) break
    const date = clampToMonth(month, recurrence.period.anchorDay)
    if (date > upper) break
    if (date >= lower) dates.push(date)
  }
  return dates
}

/** Le jour d'échéance, borné au dernier jour du mois s'il le dépasse. */
export function clampToMonth(month: YearMonth, anchorDay: number): ISODate {
  const { y, m } = parseYm(month)
  const last = daysInMonth(y, m)
  const day = anchorDay < 1 ? 1 : anchorDay > last ? last : anchorDay
  return toISO(y, m, day)
}

function firstWeekdayOnOrAfter(date: ISODate, anchorDay: number): ISODate {
  const target = anchorDay < 1 || anchorDay > 7 ? dayOfWeek(date) : anchorDay
  const shift = (target - dayOfWeek(date) + 7) % 7
  return addDays(date, shift)
}

/* --- Lectures dérivées ----------------------------------------------------*/

export function occurrencesInMonth(recurrence: Recurrence, month: YearMonth): Occurrence[] {
  return expandRecurrence(recurrence, startOfMonth(month), endOfMonth(month))
}

/** Prochaine échéance à partir de `from`, borne incluse. null si terminée. */
export function nextOccurrence(recurrence: Recurrence, from: ISODate): Occurrence | null {
  // Deux ans suffisent à couvrir la plus longue périodicité raisonnable.
  const horizon = addDays(from, 366 * 2)
  return expandRecurrence(recurrence, from, horizon)[0] ?? null
}

/* --- Amortissement --------------------------------------------------------*/

/**
 * Coût mensuel équivalent. Une périodicité non mensuelle est amortie au mois
 * dans toutes les statistiques (cahier §4.2). null si le montant est variable.
 */
export function monthlyEquivalent(recurrence: Recurrence): Money | null {
  const { amount, period } = recurrence
  if (amount === null) return null
  const every = normalizeEvery(period.every)
  switch (period.unit) {
    case 'week':
      return scale(amount, 52, 12 * every)
    case 'month':
      return divInt(amount, every)
    case 'year':
      return divInt(amount, 12 * every)
  }
}

/** Coût annuel. null si le montant est variable. */
export function annualCost(recurrence: Recurrence): Money | null {
  const { amount, period } = recurrence
  if (amount === null) return null
  const every = normalizeEvery(period.every)
  switch (period.unit) {
    case 'week':
      return scale(amount, 52, every)
    case 'month':
      return scale(amount, 12, every)
    case 'year':
      return divInt(amount, every)
  }
}
