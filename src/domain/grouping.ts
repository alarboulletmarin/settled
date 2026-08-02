/* ============================================================================
 * Regroupement des entrées d'un mois.
 *
 * Une liste plate de quarante lignes ne répond à aucune question. Regroupée,
 * elle en répond à trois selon l'axe choisi : quel jour, quel poste, qui.
 * ==========================================================================*/

import { type Money, ZERO, add, sub } from './money'
import type { Entry, Recurrence } from './types'

export type GroupBy = 'day' | 'category' | 'member'

/** Clé du groupe qui rassemble ce que personne ne s'est attribué. */
export const NO_MEMBER = '__nobody__'

export type EntryGroup = {
  /** Date ISO, identifiant de catégorie, ou identifiant de membre. */
  key: string
  entries: Entry[]
  /** Solde du groupe : ce qui entre moins ce qui sort. */
  total: Money
}

function keyOf(entry: Entry, by: GroupBy): string {
  switch (by) {
    case 'day':
      return entry.date
    case 'category':
      return entry.categoryId
    case 'member':
      return entry.memberId ?? NO_MEMBER
  }
}

/**
 * Regroupe des entrées sur un axe.
 *
 * Le total d'un groupe est un **solde**, pas une somme : un jour où l'on touche
 * un salaire et où l'on paie le loyer ne se résume pas en additionnant les
 * deux. Sur une catégorie, qui n'a qu'un sens, le solde et la somme signée sont
 * la même chose.
 *
 * Par jour, l'ordre est chronologique inverse — c'est celui de la lecture, et
 * le mois se lit du plus récent. Sur les deux autres axes, le plus gros
 * mouvement d'abord : c'est ce qu'on vient chercher.
 */
export function groupEntries(entries: readonly Entry[], by: GroupBy): EntryGroup[] {
  const groups = new Map<string, Entry[]>()
  for (const entry of entries) {
    const key = keyOf(entry, by)
    const bucket = groups.get(key)
    if (bucket === undefined) groups.set(key, [entry])
    else bucket.push(entry)
  }

  const built: EntryGroup[] = [...groups.entries()].map(([key, list]) => ({
    key,
    entries: list,
    total: list.reduce(
      (acc, e) => (e.direction === 'in' ? add(acc, e.amount) : sub(acc, e.amount)),
      ZERO,
    ),
  }))

  if (by === 'day') return built.sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0))
  return built.sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
}

/* --- Récurrences ----------------------------------------------------------*/

/**
 * Le sens n'est pas un axe : il filtre, comme dans la liste du mois.
 *
 * Il rendait deux blocs dont le total de la page donne déjà les chiffres, et
 * cette lecture-là seulement. En filtre, il se combine aux deux axes qui
 * restent : les charges par poste, les revenus par personne, ce que chacun
 * paie sans son salaire au milieu.
 */
export type RecurrenceGroupBy = 'category' | 'member'

/** Le minimum dont le regroupement a besoin : la règle et son coût au mois. */
export type PricedRecurrence = { recurrence: Recurrence; monthly: Money | null }

/**
 * L'ordre à l'intérieur d'un groupe.
 *
 * L'ordre était toujours imposé — par prochaine échéance, ce qui répond à
 * « qu'est-ce qui tombe bientôt ». C'est la bonne réponse à une question, mais
 * pas à celle qu'on vient poser à cet écran-là : « qu'est-ce qui me coûte le
 * plus » ne se lisait nulle part, alors que le coût mensuel est déjà affiché
 * sur chaque ligne.
 */
export type RecurrenceSortBy = 'due' | 'amount'

/**
 * Range les lignes d'une liste déjà triée par prochaine échéance.
 *
 * En valeur absolue : la liste mêle ce qui rentre et ce qui sort, et le plus
 * lourd est le plus lourd des deux côtés — un salaire n'est pas « moins » qu'un
 * abonnement parce qu'il est de l'autre signe.
 *
 * Une variable non chiffrable passe à la fin plutôt qu'en tête ou parmi les
 * petits montants : elle ne vaut pas zéro, on ne sait simplement pas ce qu'elle
 * vaut, et la ranger comme un zéro serait affirmer le contraire. Les égalités se
 * départagent sur le libellé puis l'identifiant, pour que deux lectures de la
 * même liste donnent le même ordre.
 */
export function sortRecurrences<T extends PricedRecurrence>(
  rows: readonly T[],
  by: RecurrenceSortBy,
): T[] {
  if (by === 'due') return [...rows]
  return [...rows].sort((a, b) => {
    if (a.monthly === null || b.monthly === null) {
      if (a.monthly === b.monthly) return tieBreak(a, b)
      return a.monthly === null ? 1 : -1
    }
    const gap = Math.abs(b.monthly) - Math.abs(a.monthly)
    return gap === 0 ? tieBreak(a, b) : gap
  })
}

function tieBreak(a: PricedRecurrence, b: PricedRecurrence): number {
  return (
    a.recurrence.label.localeCompare(b.recurrence.label, 'fr') ||
    a.recurrence.id.localeCompare(b.recurrence.id)
  )
}

export type RecurrenceGroup<T> = {
  /** `'in'` / `'out'`, un identifiant de catégorie, ou un de membre. */
  key: string
  rows: T[]
  /** Coût mensuel du groupe, en solde. Les montants non chiffrables sont comptés à part. */
  monthly: Money
  /** Récurrences à montant variable dont aucune échéance ne permet d'estimer. */
  unknownCount: number
}

/**
 * Regroupe des récurrences déjà triées — l'ordre à l'intérieur d'un groupe est
 * celui qu'on reçoit, c'est-à-dire par prochaine échéance.
 *
 * Le plus gros mouvement d'abord : c'est ce qu'on vient chercher.
 *
 * Une variable non estimable n'est pas comptée pour zéro : elle est comptée
 * à part, pour que l'écran puisse dire qu'un total est incomplet plutôt que
 * de le laisser croire exact.
 */
export function groupRecurrences<T extends PricedRecurrence>(
  rows: readonly T[],
  by: RecurrenceGroupBy,
): RecurrenceGroup<T>[] {
  const keyOfRow = (row: T): string =>
    by === 'category' ? row.recurrence.categoryId : (row.recurrence.memberId ?? NO_MEMBER)

  const groups = new Map<string, T[]>()
  for (const row of rows) {
    const key = keyOfRow(row)
    const bucket = groups.get(key)
    if (bucket === undefined) groups.set(key, [row])
    else bucket.push(row)
  }

  const built: RecurrenceGroup<T>[] = [...groups.entries()].map(([key, list]) => ({
    key,
    rows: list,
    monthly: list.reduce(
      (acc, r) =>
        r.monthly === null
          ? acc
          : r.recurrence.direction === 'in'
            ? add(acc, r.monthly)
            : sub(acc, r.monthly),
      ZERO,
    ),
    unknownCount: list.filter((r) => r.monthly === null).length,
  }))

  return built.sort((a, b) => Math.abs(b.monthly) - Math.abs(a.monthly))
}
