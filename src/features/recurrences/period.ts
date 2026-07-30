/* Traduction entre la périodicité du modèle et les choix offerts au formulaire.
 * Les cinq options sont exactement celles du cahier §4.2. */

import { type ISODate, dayOfWeek, parseISO } from '@/domain/date'
import type { Period } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDayMonthShort, tpl } from '@/i18n/format'

export type PeriodKind = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'everyNMonths'

export const PERIOD_OPTIONS: { value: PeriodKind; label: string }[] = [
  { value: 'weekly', label: fr.recurrences.periods.weekly },
  { value: 'monthly', label: fr.recurrences.periods.monthly },
  { value: 'quarterly', label: fr.recurrences.periods.quarterly },
  { value: 'yearly', label: fr.recurrences.periods.yearly },
  { value: 'everyNMonths', label: fr.recurrences.periods.everyNMonths },
]

export function kindOf(period: Period): PeriodKind {
  if (period.unit === 'week') return 'weekly'
  if (period.unit === 'year') return 'yearly'
  if (period.every === 1) return 'monthly'
  if (period.every === 3) return 'quarterly'
  return 'everyNMonths'
}

export function buildPeriod(
  kind: PeriodKind,
  startedOn: ISODate,
  monthDay: number,
  weekday: number,
  everyMonths: number,
): Period {
  switch (kind) {
    case 'weekly':
      return { unit: 'week', every: 1, anchorDay: weekday }
    case 'monthly':
      return { unit: 'month', every: 1, anchorDay: monthDay }
    case 'quarterly':
      return { unit: 'month', every: 3, anchorDay: monthDay }
    case 'yearly':
      // Le mois de l'ancre vient de `startedOn` ; seul le jour est porté ici.
      return { unit: 'year', every: 1, anchorDay: parseISO(startedOn).d }
    case 'everyNMonths':
      return { unit: 'month', every: Math.max(1, everyMonths), anchorDay: monthDay }
  }
}

/** Défauts du formulaire, déduits de la date de première échéance. */
export function defaultsFrom(startedOn: ISODate): { monthDay: number; weekday: number } {
  return { monthDay: parseISO(startedOn).d, weekday: dayOfWeek(startedOn) }
}

/** Résumé lisible : « le 5 de chaque mois », « chaque année le 15 mars ». */
export function describePeriod(period: Period, startedOn: ISODate): string {
  switch (period.unit) {
    case 'week': {
      const day = fr.calendarNames.weekdays[period.anchorDay - 1] ?? ''
      return tpl(fr.recurrences.summary.weekly, day)
    }
    case 'year':
      return tpl(fr.recurrences.summary.yearly, formatDayMonthShort(startedOn))
    case 'month':
      if (period.every === 1) {
        return tpl(fr.recurrences.summary.monthly, period.anchorDay)
      }
      return tpl(fr.recurrences.summary.everyN, period.anchorDay, period.every)
  }
}
