/* Document initial. Deux questions au premier lancement suffisent : tout le
 * reste part de valeurs par défaut modifiables ensuite (cahier §1 et §4.1). */

import type { Category, Data } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { CURRENT_SCHEMA_VERSION } from './schema'

/** Les six teintes du DS §2.4, dans l'ordre, puis on recommence. */
const CATEGORY_COLORS = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
] as const

function colorAt(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'var(--cat-1)'
}

const SEED: { id: string; label: string; direction: 'in' | 'out' }[] = [
  { id: 'housing', label: fr.defaultCategories.housing, direction: 'out' },
  { id: 'groceries', label: fr.defaultCategories.groceries, direction: 'out' },
  { id: 'transport', label: fr.defaultCategories.transport, direction: 'out' },
  { id: 'health', label: fr.defaultCategories.health, direction: 'out' },
  { id: 'leisure', label: fr.defaultCategories.leisure, direction: 'out' },
  { id: 'subscriptions', label: fr.defaultCategories.subscriptions, direction: 'out' },
  { id: 'misc', label: fr.defaultCategories.misc, direction: 'out' },
  { id: 'salary', label: fr.defaultCategories.salary, direction: 'in' },
  { id: 'otherIncome', label: fr.defaultCategories.otherIncome, direction: 'in' },
]

export function defaultCategories(): Category[] {
  return SEED.map((seed, index) => ({
    id: seed.id,
    label: seed.label,
    icon: '',
    color: colorAt(index),
    direction: seed.direction,
    archived: false,
  }))
}

export function emptyData(): Data {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    household: { name: fr.defaults.householdName, members: [] },
    categories: defaultCategories(),
    recurrences: [],
    entries: [],
    months: [],
    settings: { theme: 'system', currency: 'EUR', monthStartsOn: 1 },
  }
}

/** Couleur à attribuer à une nouvelle catégorie, en suivant l'ordre du DS. */
export function nextCategoryColor(existing: readonly Category[]): string {
  return colorAt(existing.length)
}

export const MEMBER_COLORS = CATEGORY_COLORS

export function nextMemberColor(count: number): string {
  return colorAt(count)
}
