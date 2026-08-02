/* ============================================================================
 * La recherche par libellé — appariement pur, sans UI.
 *
 * Deux emplois : retrouver une catégorie parmi quarante-six rangées sous onze
 * familles repliées, et retrouver une ligne sans naviguer mois par mois.
 * ==========================================================================*/

import type { Entry, Recurrence } from './types'

/**
 * Casse et accents mis de côté.
 *
 * « energies » doit trouver « Énergies », et « ecole » « École » : on ne tape
 * pas ses accents dans un champ de recherche, surtout au pouce. `NFD` sépare la
 * lettre de son signe, et la classe `\p{Diacritic}` retire le signe — c'est le
 * seul moyen sans table de correspondance, et il vaut pour tout le français.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * En dessous, on ne cherche pas.
 *
 * Une seule lettre apparie la moitié du foyer : le résultat est plus long que
 * la liste qu'il prétend réduire, et il change à chaque frappe sous les doigts.
 */
export const MIN_QUERY_LENGTH = 2

/** Vrai si la requête est assez longue pour valoir une recherche. */
export function isSearchable(query: string): boolean {
  return normalizeText(query).length >= MIN_QUERY_LENGTH
}

/**
 * Sous-chaîne, et non début de mot : on cherche « edf » dans « Prélèvement EDF »
 * autant qu'en tête, et un foyer nomme ses lignes comme il l'entend.
 */
export function matchesText(haystack: string, normalizedQuery: string): boolean {
  return normalizeText(haystack).includes(normalizedQuery)
}

export type SearchResult<T> = {
  items: T[]
  /** Ce que la limite a laissé de côté. Zéro quand tout tient. */
  hidden: number
}

function take<T>(all: T[], limit: number): SearchResult<T> {
  return { items: all.slice(0, limit), hidden: Math.max(0, all.length - limit) }
}

/**
 * Les entrées dont le libellé apparie, la plus récente d'abord.
 *
 * C'est l'ordre de la question posée : « ce prélèvement de mars » se cherche en
 * remontant le temps, pas en le descendant. Une date égale se départage sur
 * l'identifiant, pour que deux lectures de la même recherche rendent le même
 * ordre — sans quoi la liste change de forme sous les doigts au fil des rendus.
 */
export function searchEntries(
  entries: readonly Entry[],
  query: string,
  limit: number,
): SearchResult<Entry> {
  if (!isSearchable(query)) return { items: [], hidden: 0 }
  const needle = normalizeText(query)
  const found = entries
    .filter((entry) => matchesText(entry.label, needle))
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : b.date.localeCompare(a.date)))
  return take(found, limit)
}

/** Les récurrences dont le libellé apparie, par ordre alphabétique. */
export function searchRecurrences(
  recurrences: readonly Recurrence[],
  query: string,
  limit: number,
): SearchResult<Recurrence> {
  if (!isSearchable(query)) return { items: [], hidden: 0 }
  const needle = normalizeText(query)
  const found = recurrences
    .filter((recurrence) => matchesText(recurrence.label, needle))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr') || a.id.localeCompare(b.id))
  return take(found, limit)
}
