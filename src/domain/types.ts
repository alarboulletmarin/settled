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

/**
 * La nature d'un flux, au-delà de son sens de trésorerie.
 *
 * `direction` dit si l'argent entre ou sort du compte. `CategoryKind` dit ce
 * qu'il devient, ce que le sens seul ne sait pas exprimer : un versement sur
 * un livret sort du compte exactement comme un plein d'essence, mais l'un est
 * consommé et l'autre simplement déplacé. Les confondre fausse la lecture —
 * un camembert où « Épargne 30 % » côtoie « Courses 12 % » compare deux choses
 * qui ne se comparent pas.
 */
export type CategoryKind = 'resource' | 'charge' | 'debt' | 'saving'

/** Le sens de trésorerie découle de la nature, jamais l'inverse. */
export function directionOfKind(kind: CategoryKind): Direction {
  return kind === 'resource' ? 'in' : 'out'
}

/** Ce qui quitte le foyer pour de bon — par opposition à ce qu'on met de côté. */
export function isSpending(kind: CategoryKind): boolean {
  return kind === 'charge' || kind === 'debt'
}

/**
 * Le premier niveau des catégories : l'onglet sous lequel on va chercher.
 * Une famille porte la nature, ses catégories n'ont plus à la répéter.
 */
export type Family = {
  id: string
  label: string
  kind: CategoryKind
}

export type Member = {
  id: string
  name: string
  color: string
}

export type Category = {
  id: string
  label: string
  /** La famille dont elle relève. C'est elle qui porte la nature du flux. */
  familyId: string
  /** Présent au modèle mais jamais rendu : le DS §9 n'admet pas l'icône ici. */
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

/**
 * Un crédit en cours. Il ne produit aucun chiffre de trésorerie par lui-même :
 * c'est la récurrence liée qui pose les mensualités, comme n'importe quel
 * abonnement. Ce que le crédit ajoute, c'est le capital — ce qu'on doit encore,
 * qu'aucune somme de mensualités ne dit lorsqu'il y a des intérêts.
 */
export type Debt = {
  id: string
  label: string
  categoryId: string
  /** La mensualité qui l'amortit. Sans elle, le capital ne bouge pas. */
  recurrenceId?: string
  /** Capital emprunté, à l'origine. */
  principal: Money
  startedOn: ISODate
  /** Dernière mensualité prévue. */
  endsOn: ISODate
  /**
   * Taux annuel en points de base — 450 = 4,50 %. Un entier, comme les
   * montants : aucun flottant ne touche un calcul financier.
   * Absent ou zéro, le prêt est sans intérêt et le capital décroît du montant
   * versé, exactement.
   */
  rateBp?: number
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
  families: Family[]
  categories: Category[]
  recurrences: Recurrence[]
  entries: Entry[]
  debts: Debt[]
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

export function findFamily(families: readonly Family[], id: string): Family | undefined {
  return families.find((f) => f.id === id)
}

/**
 * La nature d'une catégorie, lue par sa famille. Rendue par une fonction et
 * non par un champ : dupliquer la nature sur la catégorie, c'est s'exposer à
 * ce que les deux divergent.
 */
export function kindOfCategory(
  families: readonly Family[],
  categories: readonly Category[],
  categoryId: string,
): CategoryKind {
  const category = findCategory(categories, categoryId)
  if (category === undefined) return 'charge'
  return findFamily(families, category.familyId)?.kind ?? 'charge'
}
