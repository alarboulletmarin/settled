/* ============================================================================
 * Répartition des charges communes entre les membres, au prorata des revenus.
 *
 * Deux personnes qui gagnent 2 500 € et 2 000 € ne peuvent pas payer le loyer
 * à parts égales sans que l'effort soit deux fois plus lourd pour l'une des
 * deux. Le prorata règle ça d'une seule règle : chacun porte la part des
 * charges communes que son revenu représente dans les revenus du foyer.
 *
 * Le module est pur — il ne connaît ni le store ni la persistance, et reçoit
 * la nature d'une catégorie sous forme de fonction, comme `stats.ts`.
 * ==========================================================================*/

import type { ISODate, YearMonth } from './date'
import { type Money, ZERO, add, money, sum } from './money'
import { monthlyEquivalent } from './recurrence'
import { type KindOf, type MemberFilter, entriesOfMonth } from './stats'
import { type CategoryKind, type Entry, type Member, type Recurrence, isActiveOn, isSpending } from './types'

/* --- Répartition d'un entier ----------------------------------------------*/

/**
 * Répartit `total` proportionnellement à des poids entiers, sans perdre ni
 * inventer une unité : la somme des parts vaut exactement `total`.
 *
 * Arrondir chaque part dans son coin ne le garantit pas — 2 000 € entre trois
 * tiers donnerait trois fois 666,67 € et un centime de trop. On pose donc les
 * parts entières, puis on distribue le reste aux plus forts restes, du plus
 * grand au plus petit ; à égalité, au poids le plus à gauche. C'est la méthode
 * des plus forts restes, et elle est déterministe, ce qui compte autant que
 * son exactitude : deux affichages du même mois doivent donner le même
 * centime au même membre.
 */
export function largestRemainder(total: number, weights: readonly number[]): number[] {
  if (!Number.isInteger(total)) {
    throw new TypeError(`largestRemainder attend un entier, reçu ${String(total)}`)
  }
  const totalWeight = weights.reduce((acc, w) => acc + w, 0)
  if (totalWeight <= 0) return weights.map(() => 0)

  const exact = weights.map((w) => (total * w) / totalWeight)
  const floors = exact.map((v) => Math.floor(v))
  let left = total - floors.reduce((acc, v) => acc + v, 0)

  // Les plus forts restes d'abord ; l'index départage les ex æquo.
  const order = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => (b.rest === a.rest ? a.index - b.index : b.rest - a.rest))

  const parts = [...floors]
  for (const { index } of order) {
    if (left <= 0) break
    parts[index] = (parts[index] ?? 0) + 1
    left -= 1
  }
  return parts
}

/** La même répartition, sur un montant. Aucun centime ne se perd en route. */
export function allocate(total: Money, weights: readonly number[]): Money[] {
  return largestRemainder(total, weights).map((cents) => money(cents))
}

/* --- Ce qui se partage ----------------------------------------------------*/

/**
 * Une sortie de nature charge ou crédit que personne ne s'est attribuée est
 * commune : c'est la même frontière que la capacité d'épargne, et pour la même
 * raison — un versement sort du compte mais reste à qui le fait, il n'a rien à
 * faire dans un partage.
 *
 * La case « à partager » de la saisie l'emporte, dans les deux sens : elle sert
 * autant à partager une dépense qu'un membre a avancée qu'à sortir du pot
 * commun une charge qui n'y a pas sa place.
 */
export function isSharedEntry(entry: Entry, kind: CategoryKind): boolean {
  return entry.shared ?? defaultShared(kind, entry.memberId)
}

/**
 * Ce que la règle dirait, sans case cochée. Sert à pré-cocher la case de la
 * saisie, et à n'enregistrer `shared` que lorsqu'il diverge : tant que la case
 * dit la même chose que la règle, c'est la règle qui reste maîtresse et le
 * document ne se remplit pas de booléens redondants.
 *
 * La chaîne vide compte comme « aucun membre » : c'est ce que vaut le choix
 * « tout le foyer » dans un `select`.
 */
export function defaultShared(kind: CategoryKind, memberId?: string): boolean {
  return isSpending(kind) && (memberId === undefined || memberId === '')
}

/** La même frontière que `sharedEntries`, en un seul endroit. */
function isCommon(entry: Entry, kindOf: KindOf): boolean {
  return entry.direction === 'out' && isSharedEntry(entry, kindOf(entry.categoryId))
}

/**
 * Total des charges communes du mois.
 *
 * Les échéances prévues comptent : la question posée est « combien chacun
 * doit-il verser ce mois-ci », pas « combien a déjà été payé ». Répondre au
 * réalisé ferait grimper la part de chacun au fil du mois, ce qui ne veut rien
 * dire pour un virement qu'on fait une fois.
 */
export function sharedTotal(
  entries: readonly Entry[],
  month: YearMonth,
  kindOf: KindOf,
  memberId?: MemberFilter,
): Money {
  return sum(sharedEntries(entries, month, kindOf, memberId).map((e) => e.amount))
}

/**
 * Le détail de ce total, du plus lourd au plus léger.
 *
 * Un chiffre de répartition qu'on ne peut pas ouvrir ne se vérifie pas, et une
 * dépense qui n'a rien à faire dans le pot commun ne se repère qu'en la voyant.
 */
export function sharedEntries(
  entries: readonly Entry[],
  month: YearMonth,
  kindOf: KindOf,
  memberId?: MemberFilter,
): Entry[] {
  return entriesOfMonth(entries, month, memberId)
    .filter((e) => isCommon(e, kindOf))
    .sort((a, b) => b.amount - a.amount)
}

/* --- Le revenu d'un membre ------------------------------------------------*/

/** Revenu mensuel d'un membre. `null` = pas de quoi le dire. */
export type MemberIncome = { memberId: string; income: Money | null }

/**
 * Le revenu mensuel d'un membre, déduit de ses récurrences de nature
 * `resource` — salaire, allocations, pension — ramenées au mois.
 *
 * Dérivé, jamais stocké. Un revenu déclaré à côté serait une seconde vérité,
 * et la première augmentation les ferait diverger. C'est aussi ce qui donne au
 * coefficient la stabilité qu'il lui faut : une récurrence est une règle, une
 * prime est une `Entry` ponctuelle — elle a lieu, mais elle ne dit rien de ce
 * que chacun gagne, et elle ne déplace donc pas la part du loyer.
 *
 * `null` quand le membre ne porte aucune récurrence de ressource, et quand
 * l'une d'elles est à montant variable sans échéance confirmée d'où tirer un
 * ordre de grandeur : un revenu qu'on ne sait pas encore ne vaut pas zéro.
 */
export function monthlyIncome(
  recurrences: readonly Recurrence[],
  memberId: string,
  kindOf: KindOf,
  resolveVariable: (recurrence: Recurrence) => Money | null,
  on: ISODate,
): Money | null {
  let total = ZERO
  let found = false

  for (const recurrence of recurrences) {
    if (recurrence.memberId !== memberId) continue
    if (kindOf(recurrence.categoryId) !== 'resource') continue
    if (!isActiveOn(recurrence, on)) continue

    found = true
    const amount = recurrence.amount ?? resolveVariable(recurrence)
    if (amount === null) return null
    total = add(total, monthlyEquivalent({ ...recurrence, amount }) ?? ZERO)
  }

  return found ? total : null
}

/** Le revenu de chaque membre du foyer, dans l'ordre du foyer. */
export function memberIncomes(
  members: readonly Member[],
  recurrences: readonly Recurrence[],
  kindOf: KindOf,
  resolveVariable: (recurrence: Recurrence) => Money | null,
  on: ISODate,
): MemberIncome[] {
  return members.map((member) => ({
    memberId: member.id,
    income: monthlyIncome(recurrences, member.id, kindOf, resolveVariable, on),
  }))
}

/* --- Parts de chacun ------------------------------------------------------*/

export type MemberShare = {
  memberId: string
  income: Money
  /** Part du revenu du foyer, en points de base. 5556 = 55,56 %. */
  shareBp: number
  /** Ce qu'il lui revient de verser sur les charges communes. */
  due: Money
}

/**
 * Les poids du prorata : les revenus, quand ils permettent de répartir.
 *
 * `null` — et non des poids à zéro — dans trois cas : moins de deux membres, un
 * membre dont le revenu n'est pas connu, ou des revenus tous nuls. Un prorata
 * dont le dénominateur est incomplet ne vaut pas zéro, il ne veut rien dire ;
 * c'est le raisonnement de `savingRate`, et l'écran doit dire ce qui manque
 * plutôt qu'afficher un chiffre faux.
 */
function prorataWeights(incomes: readonly MemberIncome[]): Money[] | null {
  if (incomes.length < 2) return null

  const known: Money[] = []
  for (const entry of incomes) {
    if (entry.income === null) return null
    known.push(entry.income)
  }
  return sum(known) <= 0 ? null : known
}

/**
 * Ce que chaque membre doit sur des charges communes, au prorata des revenus.
 *
 * Réparti charge par charge, et non sur leur somme. Les deux donnent le même
 * total au centime près — c'est ce que garantit `allocate` — mais seul le
 * découpage par charge se recompose : la part d'un poste, d'un jour ou d'une
 * moitié de mois s'additionne alors exactement pour redonner la part du mois.
 * Répartir la somme laisserait l'écran du mois filtré sur quelqu'un et l'écran
 * Répartition annoncer deux chiffres à un centime l'un de l'autre.
 */
export function memberShares(
  incomes: readonly MemberIncome[],
  amounts: readonly Money[],
): MemberShare[] | null {
  const weights = prorataWeights(incomes)
  if (weights === null) return null

  const shares = largestRemainder(10_000, weights)
  const dues = weights.map(() => 0)
  for (const amount of amounts) {
    const parts = largestRemainder(amount, weights)
    for (const [index, part] of parts.entries()) {
      dues[index] = (dues[index] ?? 0) + part
    }
  }

  return incomes.map((entry, index) => ({
    memberId: entry.memberId,
    income: weights[index] ?? ZERO,
    shareBp: shares[index] ?? 0,
    due: money(dues[index] ?? 0),
  }))
}

/* --- Le mois vu par un membre ---------------------------------------------*/

/**
 * Les entrées telles que les lit un membre : les siennes, et sa part de chaque
 * charge commune.
 *
 * Sans cette réécriture, filtrer sur quelqu'un ne garde que ce qu'il s'est
 * attribué — une charge commune n'appartient par définition à personne. Le
 * loyer, l'électricité et les crédits disparaissaient donc du filtre, et
 * chacun se lisait comme s'il vivait sans charges : capacité d'épargne à peine
 * inférieure au salaire, « aucune sortie ce mois-ci » sur la répartition.
 *
 * La part remplace le montant, et l'entrée est attribuée au membre : tout ce
 * qui lit ces entrées — totaux, natures, répartition par poste, par jour —
 * répond dès lors à sa part sans avoir à connaître le prorata. Les listes sur
 * lesquelles on agit, elles, gardent les entrées réelles : on confirme une
 * échéance entière, jamais une part.
 *
 * `null` tant que le prorata ne se calcule pas — l'appelant dit ce qui manque.
 */
export function scopeToMember(
  entries: readonly Entry[],
  memberId: string,
  kindOf: KindOf,
  incomes: readonly MemberIncome[],
): Entry[] | null {
  const weights = prorataWeights(incomes)
  const index = incomes.findIndex((income) => income.memberId === memberId)
  if (weights === null || index < 0) return null

  const scoped: Entry[] = []
  for (const entry of entries) {
    if (isCommon(entry, kindOf)) {
      const part = allocate(entry.amount, weights)[index] ?? ZERO
      // Une part nulle n'est pas une ligne : elle ferait apparaître un poste à
      // zéro dans la répartition sans rien ajouter à aucun total.
      if (part > 0) scoped.push({ ...entry, amount: part, memberId })
      continue
    }
    if (entry.memberId === memberId) scoped.push(entry)
  }
  return scoped
}

/** Somme des parts. Vaut le total réparti — c'est ce que `allocate` garantit. */
export function totalDue(shares: readonly MemberShare[]): Money {
  return shares.reduce((acc, share) => add(acc, share.due), ZERO)
}
