/* ============================================================================
 * Actions — le seul vocabulaire dont dispose un composant pour changer l'état.
 *
 * Chacune se contente d'appliquer une mutation pure du domaine. Aucune règle
 * métier ne vit ici, et encore moins dans un composant.
 * ==========================================================================*/

import { type ISODate, today } from '@/domain/date'
import { makeId } from '@/domain/ids'
import type { Money } from '@/domain/money'
import type { Category, Entry, Member, Recurrence, Settings } from '@/domain/types'
import * as updates from '@/domain/updates'
import { nextMemberColor } from '@/persistence/defaults'
import { useStore } from './store'

const mutate = (recipe: Parameters<ReturnType<typeof useStore.getState>['mutate']>[0]): void => {
  useStore.getState().mutate(recipe)
}

/* --- Foyer ----------------------------------------------------------------*/

export function setHouseholdName(name: string): void {
  mutate((data) => updates.setHouseholdName(data, name))
}

export function addMember(name: string): Member {
  const member: Member = {
    id: makeId(),
    name,
    color: nextMemberColor(useStore.getState().data.household.members.length),
  }
  mutate((data) => updates.addMember(data, member))
  return member
}

export function renameMember(id: string, name: string): void {
  mutate((data) => updates.renameMember(data, id, name))
}

export function removeMember(id: string): void {
  mutate((data) => updates.removeMember(data, id))
  if (useStore.getState().memberFilter === id) useStore.getState().setMemberFilter(undefined)
}

/* --- Catégories -----------------------------------------------------------*/

export function addCategory(input: Omit<Category, 'id' | 'archived'>): Category {
  const category: Category = { ...input, id: makeId(), archived: false }
  mutate((data) => updates.addCategory(data, category))
  return category
}

export function updateCategory(id: string, patch: Partial<Category>): void {
  mutate((data) => updates.updateCategory(data, id, patch))
}

export function archiveCategory(id: string, archived = true): void {
  mutate((data) => updates.archiveCategory(data, id, archived))
}

/* --- Récurrences ----------------------------------------------------------*/

/* Toute écriture sur une récurrence réaligne ses échéances dans la foulée :
   poser la règle et en tirer les faits sont un seul geste pour qui l'utilise,
   ce ne sont pas deux commandes dont la seconde s'oublie. */

export function addRecurrence(input: Omit<Recurrence, 'id'>): Recurrence {
  const recurrence: Recurrence = { ...input, id: makeId() }
  mutate((data) =>
    updates.syncRecurrenceEntries(updates.addRecurrence(data, recurrence), recurrence.id, makeId),
  )
  return recurrence
}

export function updateRecurrence(id: string, patch: Partial<Recurrence>): void {
  mutate((data) => updates.syncRecurrenceEntries(updates.updateRecurrence(data, id, patch), id, makeId))
}

export function stopRecurrence(id: string, on: ISODate = today()): void {
  // `stopRecurrence` retire déjà les prévues postérieures : rien à replanifier.
  mutate((data) => updates.stopRecurrence(data, id, on))
}

export function resumeRecurrence(id: string): void {
  mutate((data) => updates.syncRecurrenceEntries(updates.resumeRecurrence(data, id), id, makeId))
}

export function removeRecurrence(id: string): void {
  mutate((data) => updates.removeRecurrence(data, id, today()))
}

/* --- Entrées --------------------------------------------------------------*/

export function addEntry(input: Omit<Entry, 'id'>): Entry {
  const entry: Entry = { ...input, id: makeId() }
  mutate((data) => updates.addEntry(data, entry))
  return entry
}

export function updateEntry(id: string, patch: Partial<Entry>): void {
  mutate((data) => updates.updateEntry(data, id, patch))
}

export function removeEntry(id: string): void {
  mutate((data) => updates.removeEntry(data, id))
}

export function confirmEntry(id: string, amount?: Money): void {
  mutate((data) =>
    updates.updateEntry(data, id, {
      status: 'confirmed',
      ...(amount === undefined ? {} : { amount }),
    }),
  )
}

export function confirmEntries(ids: readonly string[]): void {
  mutate((data) => updates.confirmEntries(data, ids))
}

/* --- Réglages -------------------------------------------------------------*/

export function updateSettings(patch: Partial<Settings>): void {
  mutate((data) => updates.updateSettings(data, patch))
}
