/* ============================================================================
 * Regroupement des entrées d'un mois.
 *
 * Une liste plate de quarante lignes ne répond à aucune question. Regroupée,
 * elle en répond à trois selon l'axe choisi : quel jour, quel poste, qui.
 * ==========================================================================*/

import { type Money, ZERO, add, sub } from './money'
import type { Entry } from './types'

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
