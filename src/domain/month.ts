/* ============================================================================
 * Ouverture d'un mois — génération des `Entry` planned.
 *
 * L'opération est idempotente : rejouer l'ouverture d'un mois ne duplique
 * jamais une échéance déjà générée, et ne touche jamais une entrée confirmée.
 * ==========================================================================*/

import { type ISODate, type YearMonth, endOfMonth, startOfMonth, ymOf } from './date'
import { ZERO } from './money'
import { amountOn } from './priceHistory'
import { occurrencesInMonth } from './recurrence'
import type { Data, Entry, MonthState, Recurrence } from './types'

export type MonthPlan = {
  ym: YearMonth
  /** Échéances à créer — aucune n'existe encore dans le document. */
  created: Entry[]
  /** Celles dont le montant reste à saisir, listées à part (cahier §4.3). */
  variable: Entry[]
}

/** Clé d'unicité d'une échéance générée : une récurrence, une date. */
function occurrenceKey(recurrenceId: string, date: ISODate): string {
  return `${recurrenceId}@${date}`
}

function existingOccurrences(entries: readonly Entry[], month: YearMonth): Set<string> {
  const keys = new Set<string>()
  for (const entry of entries) {
    if (entry.recurrenceId === undefined) continue
    if (ymOf(entry.date) !== month) continue
    keys.add(occurrenceKey(entry.recurrenceId, entry.date))
  }
  return keys
}

/**
 * Calcule ce que produirait l'ouverture d'un mois, sans rien muter.
 * `makeId` est injecté pour que la fonction reste pure et testable.
 */
export function planMonth(
  data: Pick<Data, 'recurrences' | 'entries'>,
  month: YearMonth,
  makeId: () => string,
): MonthPlan {
  const from = startOfMonth(month)
  const to = endOfMonth(month)
  const seen = existingOccurrences(data.entries, month)
  const created: Entry[] = []
  const variable: Entry[] = []

  for (const recurrence of data.recurrences) {
    for (const occurrence of occurrencesInMonth(recurrence, month)) {
      if (occurrence.date < from || occurrence.date > to) continue
      if (seen.has(occurrenceKey(recurrence.id, occurrence.date))) continue

      const entry = buildPlannedEntry(recurrence, occurrence.date, data.entries, makeId)
      created.push(entry)
      if (recurrence.amount === null) variable.push(entry)
    }
  }

  created.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return { ym: month, created, variable }
}

/** Fabrique l'échéance d'une récurrence à une date. Exportée pour `updates`. */
export function buildPlannedEntry(
  recurrence: Recurrence,
  date: ISODate,
  entries: readonly Entry[],
  makeId: () => string,
): Entry {
  // Montant variable : on propose celui que l'abonnement vaut à cette date —
  // la même règle qu'ailleurs, pour que le chiffre proposé à la confirmation
  // soit celui-là même que les totaux ont déjà compté.
  const amount = amountOn(recurrence, entries, date) ?? ZERO
  return {
    id: makeId(),
    recurrenceId: recurrence.id,
    label: recurrence.label,
    categoryId: recurrence.categoryId,
    ...(recurrence.memberId === undefined ? {} : { memberId: recurrence.memberId }),
    direction: recurrence.direction,
    amount,
    date,
    status: 'planned',
    // La règle de partage est portée par l'abonnement : ses échéances en
    // héritent, comme elles héritent du membre.
    ...(recurrence.shared === undefined ? {} : { shared: recurrence.shared }),
  }
}

/* --- État des mois --------------------------------------------------------*/

export function findMonthState(
  months: readonly MonthState[],
  month: YearMonth,
): MonthState | undefined {
  return months.find((m) => m.ym === month)
}

export function isMonthOpened(months: readonly MonthState[], month: YearMonth): boolean {
  return findMonthState(months, month) !== undefined
}

/** Les mois couverts par les données, du plus ancien au plus récent. */
export function coveredMonths(data: Pick<Data, 'entries' | 'months'>): YearMonth[] {
  const set = new Set<YearMonth>()
  for (const entry of data.entries) set.add(ymOf(entry.date))
  for (const state of data.months) set.add(state.ym)
  return [...set].sort()
}
