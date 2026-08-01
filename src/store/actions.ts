/* ============================================================================
 * Actions — le seul vocabulaire dont dispose un composant pour changer l'état.
 *
 * Chacune se contente d'appliquer une mutation pure du domaine. Aucune règle
 * métier ne vit ici, et encore moins dans un composant.
 * ==========================================================================*/

import { type ISODate, endOfMonth, parseISO, startOfMonth, today } from '@/domain/date'
import { monthlyInstalment } from '@/domain/advance'
import { makeId } from '@/domain/ids'
import type { Money } from '@/domain/money'
import { type Advance, type Category, type CategoryKind, type Debt, type Entry, type Family, type Member, type Recurrence, type Settings, directionOfKind } from '@/domain/types'
import * as updates from '@/domain/updates'
import { nextCategoryColor, nextMemberColor } from '@/persistence/defaults'
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

export function addCategory(input: Omit<Category, 'id' | 'archived' | 'color' | 'direction'>): Category {
  const kind =
    useStore.getState().data.families.find((f) => f.id === input.familyId)?.kind ?? 'charge'
  const category: Category = {
    ...input,
    id: makeId(),
    // La teinte et le sens ne se saisissent pas : ils découlent de la famille,
    // et les laisser diverger d'elle n'aurait aucun sens lisible.
    color: nextCategoryColor(input.familyId),
    direction: directionOfKind(kind),
    archived: false,
  }
  mutate((data) => updates.addCategory(data, category))
  return category
}

/* --- Familles -------------------------------------------------------------*/

export function addFamily(input: { label: string; kind: CategoryKind }): Family {
  const family: Family = { ...input, id: makeId() }
  mutate((data) => updates.addFamily(data, family))
  return family
}

export function renameFamily(id: string, label: string): void {
  mutate((data) => updates.renameFamily(data, id, label))
}

/* --- Crédits --------------------------------------------------------------*/

export function addDebt(input: Omit<Debt, 'id'>): Debt {
  const debt: Debt = { ...input, id: makeId() }
  mutate((data) => updates.addDebt(data, debt))
  return debt
}

/* Un formulaire pose l'état complet de ce qu'il montre, jamais un correctif :
   voir `updates.replaceRecurrence`. */
export function replaceDebt(id: string, next: Omit<Debt, 'id'>): void {
  mutate((data) => updates.replaceDebt(data, id, next))
}

export function removeDebt(id: string): void {
  mutate((data) => updates.removeDebt(data, id))
}

/* --- Avances --------------------------------------------------------------*/

/** Ce qu'un écran a à dire pour poser une avance. Le reste s'en déduit. */
export type AdvanceInput = Omit<Advance, 'id' | 'recurrenceId'> & {
  /** Le support d'épargne repris, puis reconstitué. */
  savingCategoryId: string
  /** La charge avancée entre-t-elle dans le pot commun du foyer ? */
  shared?: boolean
}

/**
 * Traduit une avance en ce qu'elle est vraiment : une reprise sur le livret, et
 * la récurrence qui l'y remet mois après mois.
 *
 * Les trois écritures tiennent dans une seule mutation — donc un seul rendu,
 * une seule sauvegarde — et surtout la reprise ne peut pas rester seule si la
 * récurrence échouait : une épargne qu'on a prise sans jamais la rendre est
 * exactement le trou que cet écran existe pour éviter.
 *
 * La reprise part **confirmée** : elle a eu lieu, c'est même tout le propos —
 * l'argent est déjà sorti du livret. Elle entre en sens `in` parce que c'est ce
 * qu'elle est du point de vue du foyer, de l'argent qui revient de l'épargne
 * vers ce qu'on peut dépenser. La dépense qu'elle a financée, elle, se saisit
 * comme n'importe quelle autre — l'app ne l'invente pas à la place de qui l'a
 * faite.
 */
export function addAdvance(input: AdvanceInput): Advance {
  const { savingCategoryId, shared, ...rest } = input
  const recurrence: Recurrence = {
    id: makeId(),
    label: rest.label,
    categoryId: savingCategoryId,
    memberId: rest.memberId,
    direction: 'out',
    amount: monthlyInstalment(rest),
    period: { unit: 'month', every: 1, anchorDay: parseISO(rest.paidOn).d },
    startedOn: startOfMonth(rest.from),
    endedOn: endOfMonth(rest.to),
    ...(shared === undefined ? {} : { shared }),
  }
  const advance: Advance = { ...rest, id: makeId(), recurrenceId: recurrence.id }
  const drawdown: Entry = {
    id: makeId(),
    label: rest.label,
    categoryId: savingCategoryId,
    memberId: rest.memberId,
    direction: 'in',
    amount: rest.amount,
    date: rest.paidOn,
    status: 'confirmed',
  }

  mutate((data) =>
    updates.addAdvance(
      updates.addEntry(
        updates.syncRecurrenceEntries(
          updates.addRecurrence(data, recurrence),
          recurrence.id,
          makeId,
        ),
        drawdown,
      ),
      advance,
    ),
  )
  return advance
}

/**
 * Retire l'avance du suivi, et avec elle la mensualité qui la reconstitue —
 * mais pas ce qui est déjà revenu sur le livret.
 *
 * C'est la différence avec un crédit, dont la mensualité survit au retrait : le
 * remboursement d'un crédit continue après qu'on a cessé d'en suivre le
 * capital, alors qu'une avance qu'on ne suit plus n'a plus de raison de se
 * reverser. La récurrence part donc avec elle, sans toucher aux échéances déjà
 * confirmées, que `removeRecurrence` conserve.
 */
export function removeAdvance(id: string): void {
  const advance = useStore.getState().data.advances.find((a) => a.id === id)
  const recurrenceId = advance?.recurrenceId
  mutate((data) => {
    const without = updates.removeAdvance(data, id)
    return recurrenceId === undefined
      ? without
      : updates.removeRecurrence(without, recurrenceId)
  })
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

/**
 * Pose la récurrence et marque l'échéance du jour saisi comme déjà payée.
 *
 * C'est le geste de la saisie d'une dépense qu'on bascule en récurrence :
 * celle-là a eu lieu, les suivantes sont à venir. Les trois étapes tiennent
 * dans une seule mutation — donc un seul rendu, une seule écriture — et surtout
 * l'échéance du jour ne peut pas rester prévue si la suite échouait.
 */
export function addRecurrencePaidOn(input: Omit<Recurrence, 'id'>, on: ISODate): Recurrence {
  const recurrence: Recurrence = { ...input, id: makeId() }
  mutate((data) =>
    updates.confirmOccurrence(
      updates.syncRecurrenceEntries(updates.addRecurrence(data, recurrence), recurrence.id, makeId),
      recurrence.id,
      on,
      makeId,
    ),
  )
  return recurrence
}

export function replaceRecurrence(id: string, next: Omit<Recurrence, 'id'>): void {
  mutate((data) =>
    updates.syncRecurrenceEntries(updates.replaceRecurrence(data, id, next), id, makeId),
  )
}

export function stopRecurrence(id: string, on: ISODate = today()): void {
  // `stopRecurrence` retire déjà les prévues postérieures : rien à replanifier.
  mutate((data) => updates.stopRecurrence(data, id, on))
}

export function resumeRecurrence(id: string): void {
  mutate((data) => updates.syncRecurrenceEntries(updates.resumeRecurrence(data, id), id, makeId))
}

export function removeRecurrence(id: string): void {
  mutate((data) => updates.removeRecurrence(data, id))
}

/* --- Entrées --------------------------------------------------------------*/

export function addEntry(input: Omit<Entry, 'id'>): Entry {
  const entry: Entry = { ...input, id: makeId() }
  mutate((data) => updates.addEntry(data, entry))
  return entry
}

export function replaceEntry(id: string, next: Omit<Entry, 'id' | 'recurrenceId'>): void {
  mutate((data) => updates.replaceEntry(data, id, next))
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

export function unconfirmEntry(id: string): void {
  mutate((data) => updates.unconfirmEntries(data, [id]))
}

export function unconfirmEntries(ids: readonly string[]): void {
  mutate((data) => updates.unconfirmEntries(data, ids))
}

/* --- Réglages -------------------------------------------------------------*/

export function updateSettings(patch: Partial<Settings>): void {
  mutate((data) => updates.updateSettings(data, patch))
}
