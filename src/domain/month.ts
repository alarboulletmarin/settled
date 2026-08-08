/* ============================================================================
 * Ouverture d'un mois — génération des `Entry` planned.
 *
 * L'opération est idempotente : rejouer l'ouverture d'un mois ne duplique
 * jamais une échéance déjà générée, et ne touche jamais une entrée confirmée.
 * ==========================================================================*/

import {
  type ISODate,
  type YearMonth,
  addMonthsToYm,
  endOfMonth,
  startOfMonth,
  today,
  ymOf,
} from './date'
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
  // Montant variable : on propose celui que la récurrence vaut à cette date —
  // la même règle qu'ailleurs, pour que le chiffre proposé à la confirmation
  // soit celui-là même que les totaux ont déjà compté.
  const amount = amountOn(recurrence, entries, date) ?? ZERO
  return {
    id: makeId(),
    recurrenceId: recurrence.id,
    label: recurrence.label,
    categoryId: recurrence.categoryId,
    ...(recurrence.memberId === undefined ? {} : { memberId: recurrence.memberId }),
    /* Le support voyage par identifiant, jamais par libellé ni par catégorie :
       une échéance générée sait sur quel compte elle tombe parce que sa règle
       le dit, et deux supports du même poste ne peuvent pas se confondre. */
    ...(recurrence.savingSupportId === undefined
      ? {}
      : { savingSupportId: recurrence.savingSupportId }),
    direction: recurrence.direction,
    amount,
    date,
    status: 'planned',
    // La règle de partage est portée par la récurrence : ses échéances en
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

/**
 * Jusqu'où l'on ouvre des mois à venir.
 *
 * Ouvrir un mois y écrit toutes les échéances de toutes les récurrences, et
 * rien ne bornait ce geste : chaque « mois suivant » ouvrait le mois, ce qui
 * repoussait la borne d'un cran, ce qui permettait d'aller encore plus loin.
 * Cent clics valaient cent mois d'échéances prévisionnelles écrites pour de
 * bon dans le document, inélaguables autrement qu'entrée par entrée.
 *
 * Douze mois : c'est la fenêtre de l'historique, celle d'une assurance annuelle
 * et celle des avances — au-delà, on ne consulte plus un prévisionnel, on
 * spécule sur des récurrences qui auront changé.
 */
export const HORIZON_MONTHS = 12

/** Le mois le plus lointain qu'on ouvre. */
export function monthHorizon(on: ISODate = today()): YearMonth {
  return addMonthsToYm(ymOf(on), HORIZON_MONTHS)
}

/** Ce qu'on peut atteindre en changeant de mois. */
export type MonthBounds = { min: YearMonth; max: YearMonth }

/**
 * Les bornes de la navigation entre mois.
 *
 * En arrière, on ne remonte pas avant la première donnée. En avant, un mois
 * d'avance est toujours accessible — c'est ce qui permet d'ouvrir le mois
 * suivant et d'y voir tomber les échéances —, mais jamais au-delà de
 * l'horizon.
 *
 * Un document qui porte déjà des données plus loin reste consultable jusqu'à
 * elles : un fichier importé peut contenir des échéances lointaines, et une
 * borne qui les rendrait injoignables cacherait des données qu'on possède. Il
 * n'y gagne pas le mois d'avance pour autant — ce mois-là est une invitation à
 * ouvrir, et l'horizon dit précisément où l'on cesse d'inviter.
 */
export function navigationBounds(
  data: Pick<Data, 'entries' | 'months'>,
  on: ISODate = today(),
): MonthBounds {
  const covered = coveredMonths(data)
  const now = ymOf(on)
  const first = covered[0] ?? now
  const last = covered.at(-1) ?? now
  const reach = addMonthsToYm(last > now ? last : now, 1)
  const horizon = monthHorizon(on)

  return {
    min: first < now ? first : now,
    max: reach <= horizon ? reach : last > horizon ? last : horizon,
  }
}
