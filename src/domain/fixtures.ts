/** Fabriques de test. Aucun module d'application ne dépend de ce fichier. */

import { type Money, money } from './money'
import type { Category, Data, Entry, Period, Recurrence } from './types'

export function makeEntry(over: Partial<Entry> & { date: string }): Entry {
  return {
    id: `e-${over.date}-${String(over.amount ?? 0)}-${over.label ?? ''}`,
    label: 'Entrée',
    categoryId: 'cat-1',
    direction: 'out',
    amount: money(1000),
    status: 'confirmed',
    ...over,
  }
}

export function makeRecurrence(
  over: Partial<Omit<Recurrence, 'period'>> & { period: Period },
): Recurrence {
  return {
    id: 'rec-1',
    label: 'Abonnement',
    categoryId: 'cat-1',
    direction: 'out',
    amount: money(999),
    startedOn: '2026-01-01',
    ...over,
  }
}

export function makeCategory(over: Partial<Category> & { id: string }): Category {
  return {
    label: 'Catégorie',
    icon: '',
    color: 'var(--cat-1)',
    direction: 'out',
    archived: false,
    ...over,
  }
}

export function makeData(over: Partial<Data> = {}): Data {
  return {
    schemaVersion: 1,
    household: { name: 'Maison', members: [] },
    categories: [],
    recurrences: [],
    entries: [],
    months: [],
    settings: { theme: 'system', currency: 'EUR', monthStartsOn: 1 },
    ...over,
  }
}

/** Générateur d'identifiants déterministe, pour que les tests soient stables. */
export function sequentialIds(prefix = 'id'): () => string {
  let n = 0
  return () => {
    n += 1
    return `${prefix}-${String(n)}`
  }
}

export const eur = (value: number): Money => money(value)
