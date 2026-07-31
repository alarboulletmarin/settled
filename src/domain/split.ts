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

import type { YearMonth } from './date'
import { type Money, ZERO, add, money, sum } from './money'
import { type KindOf, type MemberFilter, entriesOfMonth } from './stats'
import { type CategoryKind, type Entry, type Member, isSpending } from './types'

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
  return sum(
    entriesOfMonth(entries, month, memberId)
      .filter((e) => e.direction === 'out' && isSharedEntry(e, kindOf(e.categoryId)))
      .map((e) => e.amount),
  )
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
 * Ce que chaque membre doit sur `total`, au prorata des revenus déclarés.
 *
 * Renvoie `null` — et non des parts à zéro — dans trois cas : moins de deux
 * membres, un membre sans revenu déclaré, ou des revenus tous nuls. Un prorata
 * dont le dénominateur est incomplet ne vaut pas zéro, il ne veut rien dire ;
 * c'est le raisonnement de `savingRate`, et l'écran doit dire ce qui manque
 * plutôt qu'afficher un chiffre faux.
 */
export function memberShares(members: readonly Member[], total: Money): MemberShare[] | null {
  if (members.length < 2) return null

  const incomes: Money[] = []
  for (const member of members) {
    if (member.income === undefined) return null
    incomes.push(member.income)
  }
  if (sum(incomes) <= 0) return null

  const shares = largestRemainder(10_000, incomes)
  const dues = allocate(total, incomes)

  return members.map((member, index) => ({
    memberId: member.id,
    income: incomes[index] ?? ZERO,
    shareBp: shares[index] ?? 0,
    due: dues[index] ?? ZERO,
  }))
}

/** Somme des parts. Vaut le total réparti — c'est ce que `allocate` garantit. */
export function totalDue(shares: readonly MemberShare[]): Money {
  return shares.reduce((acc, share) => add(acc, share.due), ZERO)
}
