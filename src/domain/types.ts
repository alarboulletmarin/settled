/* ============================================================================
 * Le modèle de données du cahier des charges §3, à l'identique.
 *
 * Tout est stocké dans un document unique versionné. Une `Entry` est la seule
 * source de vérité pour les statistiques : une récurrence ne produit jamais un
 * chiffre directement, elle produit des `Entry`.
 * ==========================================================================*/

import { type ISODate, type YearMonth, addMonthsToYm, startOfMonth, ymOf } from './date'
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

/**
 * Une étiquette, et rien de plus. Le revenu qui sert à répartir les charges
 * n'est pas ici : il se lit sur les récurrences de nature `resource` que le
 * membre porte (voir `domain/split.ts`). Le stocker à côté en ferait une
 * seconde vérité, et la première augmentation les ferait diverger.
 */
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
  /**
   * Ordre de grandeur d'un montant variable, facultatif et sans effet sur un
   * montant fixe.
   *
   * Ce n'est pas une seconde vérité à côté de `amount` : c'est la seule qu'un
   * récurrence variable puisse porter avant sa première échéance. Un salaire
   * qui varie n'a aucun chiffre tant que rien n'est tombé, et il ne pouvait
   * donc peser dans aucun prorata — le foyer entier restait sans répartition
   * parce qu'une personne venait d'arriver. Dès qu'une échéance est chiffrée,
   * elle l'emporte : l'estimation ne recouvre jamais un fait (voir `amountOn`).
   */
  estimate?: Money
  period: Period
  startedOn: ISODate
  /** Dernier jour où la récurrence peut encore tomber, borne incluse. */
  endedOn?: string
  /** Voir `Entry.shared` : les échéances en héritent. */
  shared?: boolean
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
  /**
   * Force le partage entre les membres, ou l'exclut. Absent, la règle tranche :
   * une sortie de nature charge ou crédit que personne ne s'est attribuée est
   * commune. Le champ est une exception, jamais une copie de la règle — c'est
   * ce qui évite d'avoir à requalifier tout ce qui a déjà été saisi.
   */
  shared?: boolean
  note?: string
}

/**
 * Un crédit en cours. Il ne produit aucun chiffre de trésorerie par lui-même :
 * c'est la récurrence liée qui pose les mensualités, comme n'importe quel
 * récurrence. Ce que le crédit ajoute, c'est le capital — ce qu'on doit encore,
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

/**
 * Une charge payée en une fois, depuis l'épargne, et remboursée à soi-même mois
 * par mois.
 *
 * L'assurance auto se règle en un versement de 600 € qui couvre douze mois. La
 * payer depuis un livret et se reverser 50 € chaque mois est le montage le plus
 * courant d'un foyer qui n'encaisse pas un tel coup sur un seul mois — et
 * jusqu'ici l'app ne savait le dire d'aucune manière : soit le mois du paiement
 * portait 600 € de charges et les onze suivants rien, soit la mensualité était
 * saisie à la main comme une charge, ce qu'elle n'est pas.
 *
 * Car la mensualité n'est pas une dépense : la dépense a eu lieu, une fois. Ce
 * qui se passe ensuite est un retour d'épargne — on remet sur le livret ce
 * qu'on lui a pris. C'est pour ça qu'elle ne pèse pas dans les charges du mois
 * mais dans ce qu'on place, et qu'elle réduit le reste à placer plutôt que la
 * capacité.
 *
 * Comme un `Debt`, une avance ne produit aucun chiffre de trésorerie par
 * elle-même : c'est la récurrence liée qui pose les mensualités, sur le support
 * d'épargne à reconstituer. Ce que l'avance ajoute, c'est ce qui a été avancé —
 * donc ce qu'il reste à se rembourser, qu'aucune somme de mensualités ne dit.
 */
export type Advance = {
  id: string
  label: string
  /** La catégorie de la charge avancée — assurance véhicule, taxe foncière. */
  categoryId: string
  /**
   * Qui a avancé, et qui se rembourse. Jamais facultatif : une épargne est
   * toujours à quelqu'un, et une avance que personne ne porte ne se reconstitue
   * sur le livret de personne.
   */
  memberId: string
  /** Ce qui a été payé, en une fois. */
  amount: Money
  /** Le jour du paiement — celui où l'épargne a été reprise. */
  paidOn: ISODate
  /** Premier et dernier mois couverts, inclus. La mensualité en découle. */
  from: YearMonth
  to: YearMonth
  /** La mensualité qui reconstitue l'épargne. Sans elle, rien ne revient. */
  recurrenceId?: string
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
  advances: Advance[]
  months: MonthState[]
  settings: Settings
}

/* --- Petits utilitaires de lecture, sans logique métier -------------------*/

export function isActiveOn(recurrence: Recurrence, date: ISODate): boolean {
  if (date < recurrence.startedOn) return false
  return recurrence.endedOn === undefined || date <= recurrence.endedOn
}

/**
 * Jusqu'où une récurrence encore à venir décrit le mois qu'on regarde.
 *
 * L'asymétrie ci-dessous — une règle arrêtée sort, une règle à venir compte —
 * est voulue, mais elle était sans limite : un salaire déclaré pour janvier
 * 2030 pesait dans le prorata d'aujourd'hui, et le déplacer d'autant. Un
 * trimestre est le plus loin qu'une déclaration puisse porter sans cesser de
 * parler du mois en cours : c'est l'ordre de grandeur d'une embauche annoncée
 * ou d'une augmentation datée, au-delà duquel on décrit une autre année.
 */
export const RUNNING_HORIZON_MONTHS = 3

/**
 * La récurrence décrit-elle la situation du foyer sur ce mois-là ?
 *
 * Une récurrence arrêtée avant le mois ne la décrit plus. Une récurrence dont la
 * première échéance est encore à venir, si : il a été déclaré, il va tomber.
 * L'asymétrie est voulue, et c'est déjà celle du total des récurrences, qui
 * compte une récurrence à venir et exclut une récurrence arrêtée — un foyer qui
 * pose ses salaires au 1er du mois prochain n'a pas à attendre ce 1er pour
 * savoir dans quelle proportion il partage ses charges.
 *
 * Elle est bornée, en revanche, et c'est le seul ajout : « à venir » veut dire
 * bientôt, pas un jour. Sans borne, une ressource déclarée pour dans cinq ans
 * pesait dès aujourd'hui dans la part de chacun — un chiffre juste au centime
 * et faux sur le fond, que rien à l'écran ne pouvait expliquer.
 *
 * La question se pose sur un mois, jamais sur un jour : la répartition d'août
 * se lit avec les revenus d'août, y compris quand on la consulte en juillet.
 * Répondre « aujourd'hui » ferait dépendre le chiffre du moment où on regarde.
 */
export function isRunningIn(recurrence: Recurrence, month: YearMonth): boolean {
  if (ymOf(recurrence.startedOn) > addMonthsToYm(month, RUNNING_HORIZON_MONTHS)) return false
  return recurrence.endedOn === undefined || recurrence.endedOn >= startOfMonth(month)
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
