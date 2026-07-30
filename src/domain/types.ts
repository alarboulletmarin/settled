/* ============================================================================
 * Le modèle de données du cahier des charges §3, à l'identique.
 *
 * Tout est stocké dans un document unique versionné. Une `Entry` est la seule
 * source de vérité pour les statistiques : une récurrence ne produit jamais un
 * chiffre directement, elle produit des `Entry`.
 * ==========================================================================*/

import type { ISODate, YearMonth } from './date'
import type { Money } from './money'

export type Direction = 'in' | 'out'

export type Member = {
  id: string
  name: string
  color: string
}

export type Category = {
  id: string
  label: string
  /** Présent au modèle mais jamais rendu : le DS interdit l'icône décorative. */
  icon: string
  color: string
  direction: Direction
  archived: boolean
}

export type PeriodUnit = 'week' | 'month' | 'year'

/**
 * `anchorDay` se lit selon l'unité :
 * - `week`  → jour de la semaine, 1 = lundi … 7 = dimanche (ISO 8601) ;
 * - `month` → jour du mois, 1 à 31, borné au dernier jour des mois courts ;
 * - `year`  → jour du mois, le mois étant celui de `startedOn`.
 */
export type Period = {
  unit: PeriodUnit
  every: number
  anchorDay: number
}

export type Recurrence = {
  id: string
  label: string
  categoryId: string
  memberId?: string
  direction: Direction
  /** null = montant à saisir à chaque échéance. */
  amount: Money | null
  period: Period
  startedOn: ISODate
  /** Dernier jour où la récurrence peut encore tomber, borne incluse. */
  endedOn?: string
  note?: string
}

export type EntryStatus = 'planned' | 'confirmed'

export type Entry = {
  id: string
  /** Absent = ponctuel. */
  recurrenceId?: string
  label: string
  categoryId: string
  memberId?: string
  direction: Direction
  amount: Money
  date: ISODate
  status: EntryStatus
  note?: string
}

export type MonthState = {
  ym: YearMonth
  openedAt: ISODate
  closed: boolean
}

export type ThemeSetting = 'light' | 'dark' | 'system'

export type Settings = {
  theme: ThemeSetting
  currency: string
  monthStartsOn: number
}

export type Household = {
  name: string
  members: Member[]
}

export type Data = {
  schemaVersion: number
  household: Household
  categories: Category[]
  recurrences: Recurrence[]
  entries: Entry[]
  months: MonthState[]
  settings: Settings
}

/* --- Petits utilitaires de lecture, sans logique métier -------------------*/

export function isActiveOn(recurrence: Recurrence, date: ISODate): boolean {
  if (date < recurrence.startedOn) return false
  return recurrence.endedOn === undefined || date <= recurrence.endedOn
}

export function isStopped(recurrence: Recurrence, on: ISODate): boolean {
  return recurrence.endedOn !== undefined && recurrence.endedOn < on
}

/** Une récurrence à montant variable demande une saisie à chaque échéance. */
export function isVariable(recurrence: Recurrence): boolean {
  return recurrence.amount === null
}

export function findCategory(
  categories: readonly Category[],
  id: string,
): Category | undefined {
  return categories.find((c) => c.id === id)
}

export function findMember(members: readonly Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id)
}
