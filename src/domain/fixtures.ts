/** Fabriques de test. Aucun module d'application ne dépend de ce fichier. */

import { type Money, money } from './money'
import type { Category, Data, Debt, Entry, Family, Period, Recurrence } from './types'

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
    familyId: 'fam-leisure',
    icon: '',
    color: 'var(--cat-1)',
    direction: 'out',
    archived: false,
    ...over,
  }
}

export function makeFamily(over: Partial<Family> & { id: string }): Family {
  return { label: 'Famille', kind: 'charge', ...over }
}

export function makeDebt(over: Partial<Debt> & { id: string }): Debt {
  return {
    label: 'Crédit',
    categoryId: 'car-loan',
    principal: money(1200000),
    startedOn: '2026-01-05',
    endsOn: '2028-12-05',
    ...over,
  }
}

export function makeData(over: Partial<Data> = {}): Data {
  return {
    // La version courante du document : un aller-retour export / import doit
    // pouvoir se comparer à l'identique, sans qu'une migration s'intercale.
    schemaVersion: 2,
    household: { name: 'Maison', members: [] },
    families: [makeFamily({ id: 'fam-leisure' })],
    categories: [],
    recurrences: [],
    entries: [],
    debts: [],
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
