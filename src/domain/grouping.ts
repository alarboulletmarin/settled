/* ============================================================================
 * Regroupement des entrées d'un mois.
 *
 * Une liste plate de quarante lignes ne répond à aucune question. Regroupée,
 * elle en répond à trois selon l'axe choisi : quel jour, quel poste, qui.
 * ==========================================================================*/

import { type Money, ZERO, add, sub } from './money'
import type { Entry, Recurrence } from './types'

export type GroupBy = 'day' | 'direction' | 'category' | 'member'

/** Clé du groupe qui rassemble ce que personne ne s'est attribué. */
export const NO_MEMBER = '__nobody__'

export type EntryGroup = {
  /** Date ISO, `'in'` / `'out'`, identifiant de catégorie, ou de membre. */
  key: string
  entries: Entry[]
  /** Solde du groupe : ce qui entre moins ce qui sort. */
  total: Money
}

function keyOf(entry: Entry, by: GroupBy): string {
  switch (by) {
    case 'day':
      return entry.date
    case 'direction':
      return entry.direction
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
 * le mois se lit du plus récent. Par sens, l'ordre est fixe : ce qui sort
 * d'abord, comme sur les abonnements et comme les tuiles du tableau de bord.
 * Sur les deux autres axes, le plus gros mouvement d'abord : c'est ce qu'on
 * vient chercher.
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
  if (by === 'direction') {
    return built.sort((a, b) => (a.key === b.key ? 0 : a.key === 'out' ? -1 : 1))
  }
  return built.sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
}

/* --- Récurrences ----------------------------------------------------------*/

export type RecurrenceGroupBy = 'direction' | 'category' | 'member'

/** Le minimum dont le regroupement a besoin : la règle et son coût au mois. */
export type PricedRecurrence = { recurrence: Recurrence; monthly: Money | null }

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
 * Par sens, l'ordre est fixe : ce qui sort d'abord, parce que c'est ce que
 * chiffre le total de la page. Sur les deux autres axes, le plus gros
 * mouvement d'abord.
 *
 * Une variable non estimable n'est pas comptée pour zéro : elle est comptée
 * à part, pour que l'écran puisse dire qu'un total est incomplet plutôt que
 * de le laisser croire exact.
 */
export function groupRecurrences<T extends PricedRecurrence>(
  rows: readonly T[],
  by: RecurrenceGroupBy,
): RecurrenceGroup<T>[] {
  const keyOfRow = (row: T): string => {
    if (by === 'direction') return row.recurrence.direction
    if (by === 'category') return row.recurrence.categoryId
    return row.recurrence.memberId ?? NO_MEMBER
  }

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

  if (by === 'direction') {
    return built.sort((a, b) => (a.key === b.key ? 0 : a.key === 'out' ? -1 : 1))
  }
  return built.sort((a, b) => Math.abs(b.monthly) - Math.abs(a.monthly))
}
