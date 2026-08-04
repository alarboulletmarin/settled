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
import { buildPlannedEntry } from './month'
import { expandRecurrence, monthlyEquivalent, annualCost } from './recurrence'
import { type CategoryKind, type Direction, type Entry, type Recurrence, directionOfKind } from './types'

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

/* --- Lecture par nature ---------------------------------------------------*/

/** Résout la nature d'une entrée. Injectée pour que ce module reste pur. */
export type KindOf = (categoryId: string) => CategoryKind

export type KindTotals = {
  resource: Money
  charge: Money
  debt: Money
  saving: Money
}

const EMPTY_KINDS: KindTotals = { resource: ZERO, charge: ZERO, debt: ZERO, saving: ZERO }

/**
 * Ce que le mois fait de l'argent, réparti par nature.
 *
 * `planned` compris ou non selon `forecast` : la lecture réalisée et la
 * lecture prévisionnelle répondent à deux questions différentes, et mélanger
 * les deux donnerait un taux d'épargne qui bouge tout seul au fil du mois.
 *
 * L'épargne se compte **en net**, seule des quatre natures : ce qu'on y met
 * moins ce qu'on y reprend. Une reprise — payer l'assurance de l'année depuis
 * le livret — entre en sens `in`, et la compter comme un versement dirait que
 * le mois où l'on a vidé 600 € du livret est un mois où l'on a mis 600 € de
 * côté. Les trois autres natures n'ont qu'un sens possible, il n'y a rien à
 * y compenser.
 */
export function totalsByKind(
  entries: readonly Entry[],
  month: YearMonth,
  kindOf: KindOf,
  memberId?: MemberFilter,
  forecast = false,
): KindTotals {
  const scoped = entriesOfMonth(entries, month, memberId).filter(
    (e) => forecast || e.status === 'confirmed',
  )
  const totals = { ...EMPTY_KINDS }
  for (const entry of scoped) {
    const kind = kindOf(entry.categoryId)
    totals[kind] =
      kind === 'saving' && entry.direction === 'in'
        ? sub(totals[kind], entry.amount)
        : add(totals[kind], entry.amount)
  }
  return totals
}

/**
 * Capacité d'épargne : ce qui reste des ressources une fois les charges et les
 * crédits honorés — donc avant les versements. C'est le chiffre que le solde du
 * mois ne dit pas : lui compte l'épargne comme une sortie, ce qui est juste en
 * trésorerie mais fait passer un mois où l'on a mis 300 € de côté pour un mois
 * où l'on a dépensé 300 € de plus.
 */
export function savingCapacity(totals: KindTotals): Money {
  return sub(totals.resource, add(totals.charge, totals.debt))
}

/**
 * Part des ressources effectivement mise de côté, de 0 à 1. `null` quand il n'y
 * a pas de ressource : un taux sans dénominateur ne vaut pas zéro, il ne veut
 * rien dire.
 */
export function savingRate(totals: KindTotals): number | null {
  if (totals.resource <= 0) return null
  return totals.saving / totals.resource
}

/**
 * Ce qu'il reste à placer : la capacité moins ce qui est déjà versé.
 *
 * C'est la question qui suit la capacité, et à laquelle aucun chiffre ne
 * répondait. Savoir qu'on peut mettre 1 000 € de côté ne dit pas s'il en reste
 * à répartir entre les supports : 800 € partent peut-être déjà d'eux-mêmes sur
 * un livret et un plan, et les 200 € restants sont les seuls dont on décide.
 *
 * Négatif, il a un sens tout aussi net : on verse plus qu'on ne dégage, donc le
 * mois se termine à découvert d'autant. C'est une lecture, pas une erreur — on
 * ne le borne donc pas à zéro.
 */
export function savingLeft(totals: KindTotals): Money {
  return sub(savingCapacity(totals), totals.saving)
}

/* --- Ce qui rentre, ce qui se paie ----------------------------------------*/

export type Flow = {
  /** Le mois entier : ce qui a eu lieu et ce qui doit encore tomber. */
  total: Money
  /** La part confirmée — ce qui a eu lieu. */
  done: Money
  /** Ce qui reste à tomber. C'est `total − done`, donc les seules prévues. */
  left: Money
}

/**
 * Un flux du mois, lu sur une ou plusieurs natures.
 *
 * Les deux totaux viennent du même `totalsByKind` — l'un confirmé, l'autre
 * prévisionnel — pour que le reste soit exactement leur différence. Les
 * recalculer chacun de son côté ferait deux vérités, et la première échéance
 * confirmée les ferait diverger.
 */
function flowOf(
  confirmed: KindTotals,
  forecast: KindTotals,
  kinds: readonly CategoryKind[],
): Flow {
  const done = sum(kinds.map((kind) => confirmed[kind]))
  const total = sum(kinds.map((kind) => forecast[kind]))
  return { total, done, left: sub(total, done) }
}

/** Ce que le mois fait rentrer : les ressources, et rien d'autre. */
export function incomeFlow(confirmed: KindTotals, forecast: KindTotals): Flow {
  return flowOf(confirmed, forecast, ['resource'])
}

/**
 * Ce que le mois fait payer : charges et crédits. L'épargne en est exclue pour
 * la raison qui l'exclut partout ailleurs — un versement sort du compte mais
 * reste au foyer, et personne ne le réclame.
 */
export function spendingFlow(confirmed: KindTotals, forecast: KindTotals): Flow {
  return flowOf(confirmed, forecast, ['charge', 'debt'])
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

/**
 * Répartition par famille plutôt que par catégorie. Avec une quarantaine de
 * catégories, un anneau plafonné à six parts ne montre plus que des miettes et
 * un gros « Autres » ; la famille est le niveau auquel la question « où part
 * l'argent ? » a une réponse lisible.
 */
export function breakdownByFamily(
  entries: readonly Entry[],
  month: YearMonth,
  familyOf: (categoryId: string) => string,
  keep: (categoryId: string) => boolean,
  memberId?: MemberFilter,
  limit = 6,
): CategorySlice[] {
  const scoped = entriesOfMonth(entries, month, memberId).filter((e) => keep(e.categoryId))
  const byFamily = new Map<string, Money>()
  for (const entry of scoped) {
    const family = familyOf(entry.categoryId)
    byFamily.set(family, add(byFamily.get(family) ?? ZERO, entry.amount))
  }
  return topSlices(byFamily, limit)
}

/** Trie, calcule les parts, et regroupe la queue sous « Autres ». */
function topSlices(totals: Map<string, Money>, limit: number): CategorySlice[] {
  const total = sum([...totals.values()])
  const sorted = [...totals.entries()]
    .map(([categoryId, amount]) => ({ categoryId, total: amount, share: ratio(amount, total) }))
    .sort((a, b) => b.total - a.total)

  if (sorted.length <= limit) return sorted
  const head = sorted.slice(0, limit)
  const rest = sum(sorted.slice(limit).map((s) => s.total))
  return [...head, { categoryId: OTHER_CATEGORY, total: rest, share: ratio(rest, total) }]
}

/**
 * Répartition par catégorie d'un sens de trésorerie, sans garde de nature :
 * en `out`, un versement d'épargne y pèse à côté des courses. À ne jamais
 * brancher tel quel sur un écran étiqueté « Dépenses » ou « Charges » — c'est
 * exactement le camembert « Épargne 30 % à côté de Courses 12 % » que
 * `types.ts` interdit. Les écrans passent par `breakdownByFamily` (gardé par
 * `isSpending`) ou `savingsByCategory`.
 */
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

  return topSlices(byCategory, limit)
}

/**
 * Où va l'épargne du mois, par support.
 *
 * La répartition par sens ne sait pas séparer un virement sur un PEA d'un plein
 * d'essence : les deux sortent. La nature, elle, le sait — c'est la frontière
 * de `spendingFlow`, prise par l'autre bout.
 *
 * Le plafond est plus haut que celui des dépenses : un foyer tient une
 * quarantaine de postes de charges, dont un « Autres » sauve la lisibilité,
 * mais rarement plus de six ou sept supports d'épargne — et les regrouper sous
 * « Autres » retirerait à l'écran la seule chose qu'il a à dire, où l'argent
 * est placé.
 */
export function savingsByCategory(
  entries: readonly Entry[],
  month: YearMonth,
  kindOf: KindOf,
  memberId?: MemberFilter,
  limit = 8,
): CategorySlice[] {
  const scoped = entriesOfMonth(entries, month, memberId).filter(
    (e) => kindOf(e.categoryId) === 'saving',
  )
  const byCategory = new Map<string, Money>()
  for (const entry of scoped) {
    // Net, comme `totalsByKind` : un livret dans lequel on a repris 600 € et
    // remis 50 € n'a pas reçu 650 € ce mois-ci.
    const current = byCategory.get(entry.categoryId) ?? ZERO
    byCategory.set(
      entry.categoryId,
      entry.direction === 'in' ? sub(current, entry.amount) : add(current, entry.amount),
    )
  }

  // Un support autant repris que reconstitué dans le même mois n'a rien reçu :
  // l'afficher à zéro ajouterait une ligne qui ne dit rien.
  for (const [id, total] of byCategory) if (total === ZERO) byCategory.delete(id)

  return topSlices(byCategory, limit)
}

/* --- Prochaines échéances -------------------------------------------------*/

export type Upcoming = { entry: Entry; daysLeft: number }

/** Un an et un peu : de quoi couvrir une annuelle sans jamais boucler à vide. */
const UPCOMING_HORIZON_DAYS = 400

/**
 * Les prochaines échéances, qu'elles existent déjà ou non.
 *
 * `upcomingEntries` ne lisait que les `Entry` posées, et une récurrence n'en
 * pose aucune tant que son mois n'a pas été *ouvert* — c'est-à-dire affiché.
 * Un foyer qui avait bouclé son mois puis jeté un œil trois mois plus loin
 * n'avait donc rien en septembre ni en octobre : la tuile sautait par-dessus et
 * annonçait « dans 92 jours », alors que deux mois d'échéances tombaient avant.
 * Le tri n'y était pour rien, le vivier était troué.
 *
 * La lecture se fait donc à deux sources, et la frontière est le mois ouvert :
 *
 * - **Mois ouvert, l'échéance fait foi.** On y prend les `planned` telles
 *   quelles, sans rien projeter : leur date ou leur montant ont pu être
 *   corrigés, et l'une d'elles a pu être supprimée — la règle n'a pas à la
 *   ressusciter derrière l'utilisateur.
 * - **Mois non ouvert, la règle projette.** Les échéances sont fabriquées à la
 *   volée par `buildPlannedEntry`, exactement comme le ferait l'ouverture du
 *   mois, montant variable compris. Rien n'est écrit : afficher un mois plus
 *   loin ne doit pas peupler le document de mois que personne n'a demandés.
 *
 * Les **retards** comptent aussi, à partir du mois courant : une échéance passée
 * que personne n'a confirmée est la plus proche de toutes, et la faire
 * disparaître du seul écran qui la rappelait était le meilleur moyen de
 * l'oublier. Au-delà du mois courant en arrière, on s'arrête : ce qui n'a pas
 * été confirmé il y a six mois se règle sur l'écran du mois en question, pas
 * dans une tuile qui parle de ce qui vient.
 */
export function upcomingDue(
  entries: readonly Entry[],
  recurrences: readonly Recurrence[],
  openedMonths: ReadonlySet<YearMonth>,
  from: ISODate,
  limit = 5,
): Entry[] {
  const fromMonth = ymOf(from)
  const horizon = addDays(from, UPCOMING_HORIZON_DAYS)

  /* La frontière vaut des deux côtés, et c'est tout l'intérêt de la poser une
     fois : `projected` saute déjà les mois ouverts, `posed` ne regardait que la
     date. Une `planned` qui vit dans un mois jamais ouvert — un document
     importé peut en porter, rien ne l'interdit — se retrouvait donc comptée à
     la fois telle quelle et projetée par sa règle, et la même échéance
     s'affichait deux fois. */
  const posed = entries.filter(
    (e) => e.status === 'planned' && ymOf(e.date) >= fromMonth && openedMonths.has(ymOf(e.date)),
  )

  const projected: Entry[] = []
  for (const recurrence of recurrences) {
    for (const { date } of expandRecurrence(recurrence, from, horizon)) {
      if (openedMonths.has(ymOf(date))) continue
      projected.push(
        buildPlannedEntry(recurrence, date, entries, () => `${recurrence.id}@${date}`),
      )
    }
  }

  return [...posed, ...projected]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, limit)
}

/** Le délai de chaque échéance, négatif pour un retard. */
export function withDaysLeft(entries: readonly Entry[], from: ISODate): Upcoming[] {
  return entries.map((entry) => ({ entry, daysLeft: diffDays(from, entry.date) }))
}

export type UpcomingRow = Upcoming & {
  /** Première échéance de son jour : c'est elle qui porte le délai. */
  leadsDay: boolean
}

/**
 * Les mêmes échéances, prêtes à s'afficher.
 *
 * Quatre échéances qui tombent le même jour affichaient quatre fois « dans 32
 * jours » : la répétition prenait la largeur qui manquait aux libellés, sans
 * rien apprendre. Le délai n'est donc porté que par la première de chaque jour,
 * les suivantes se lisant sous elle.
 *
 * Dans un jour, le plus gros mouvement d'abord — c'est la règle que se donne
 * déjà `groupEntries` : c'est ce qu'on vient chercher. L'ordre des jours, lui,
 * reste celui de `upcomingDue`, chronologique.
 *
 * Le tri s'applique après la coupe : il change l'ordre d'affichage, jamais
 * quelles échéances sont retenues.
 */
export function upcomingRows(upcoming: readonly Upcoming[]): UpcomingRow[] {
  const days = new Map<ISODate, Upcoming[]>()
  for (const item of upcoming) {
    const bucket = days.get(item.entry.date)
    if (bucket === undefined) days.set(item.entry.date, [item])
    else bucket.push(item)
  }

  return [...days.values()].flatMap((day) =>
    [...day]
      .sort((a, b) => b.entry.amount - a.entry.amount)
      .map((item, index) => ({ ...item, leadsDay: index === 0 })),
  )
}

/* --- Récurrences ----------------------------------------------------------*/

export type RecurrenceTotals = {
  monthly: Money
  annual: Money
  /** Récurrences variables dont rien ne permet encore de dire le montant. */
  unknownCount: number
}

/**
 * Coût des récurrences actives d'un sens, amorti au mois et à l'année.
 *
 * `amountOf` répond pour chaque récurrence, fixe ou variable — c'est la même
 * fonction que pour le revenu d'un membre, et c'est ce qui garantit qu'un
 * salaire pèse ici le montant exact dont il pèse là. Faute de réponse, la
 * récurrence est comptée comme inconnue plutôt qu'à zéro.
 *
 * Le sens est un paramètre parce que la liste des récurrences mêle les deux :
 * un total qui ne compterait que les sorties sans le dire décrirait mal la
 * liste qu'il surplombe.
 */
export function recurrenceTotals(
  recurrences: readonly Recurrence[],
  amountOf: (recurrence: Recurrence) => Money | null,
  on: ISODate,
  direction: Direction = 'out',
): RecurrenceTotals {
  let monthly = ZERO
  let annual = ZERO
  let unknownCount = 0

  for (const recurrence of recurrences) {
    if (recurrence.direction !== direction) continue
    if (recurrence.endedOn !== undefined && recurrence.endedOn < on) continue

    const resolved = amountOf(recurrence)
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

/**
 * Le même total, borné aux natures d'une lecture — charges et crédits,
 * ressources, ou épargne.
 *
 * C'est le total qui suit le filtre par nature des listes : un versement
 * d'épargne sort du compte mais n'est pas une charge, et un total « Charges »
 * qui le compterait contredirait la tuile du même nom, qui l'exclut.
 *
 * Compté en net quand le sens d'une récurrence diverge de sa nature : une
 * reprise récurrente sur un livret se retranche des versements — l'épargne se
 * compte en net, comme partout — et un remboursement récurrent se
 * retrancherait des charges de la même façon. Les natures à sens unique n'y
 * perdent rien.
 */
export function recurrenceTotalsOfKinds(
  recurrences: readonly Recurrence[],
  amountOf: (recurrence: Recurrence) => Money | null,
  on: ISODate,
  kindOf: KindOf,
  kinds: readonly CategoryKind[],
): RecurrenceTotals {
  let monthly = ZERO
  let annual = ZERO
  let unknownCount = 0

  for (const recurrence of recurrences) {
    const kind = kindOf(recurrence.categoryId)
    if (!kinds.includes(kind)) continue
    if (recurrence.endedOn !== undefined && recurrence.endedOn < on) continue

    const resolved = amountOf(recurrence)
    if (resolved === null) {
      unknownCount += 1
      continue
    }
    const priced: Recurrence = { ...recurrence, amount: resolved }
    const flip = recurrence.direction !== directionOfKind(kind)
    const monthlyValue = monthlyEquivalent(priced) ?? ZERO
    const annualValue = annualCost(priced) ?? ZERO
    monthly = flip ? sub(monthly, monthlyValue) : add(monthly, monthlyValue)
    annual = flip ? sub(annual, annualValue) : add(annual, annualValue)
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
