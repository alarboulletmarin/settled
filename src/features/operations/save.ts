/* Ce que le formulaire enregistre, et ce qu'il en annonce.
 *
 * En un seul endroit, parce qu'il n'y a plus qu'un formulaire : depuis les deux
 * portes, le rythme se change d'un doigt à la création, si bien que « Ajouter
 * une récurrence » peut très bien finir sur une entrée ponctuelle — et
 * inversement. C'est ce qui est construit qui décide, jamais le bouton par
 * lequel on est arrivé. */

import type { Direction } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { addEntry, addRecurrence, addRecurrencePaidOn, replaceEntry, replaceRecurrence } from '@/store/actions'
import type { EntryNature } from '@/ui/categoryKinds'
import { toast } from '@/ui/toast'
import type { Built, Operation } from './useOperationForm'

/** Annoncer « Dépense ajoutée » après un salaire ferait douter de ce qui vient
 *  d'être enregistré. */
const TOAST = {
  added: { in: fr.entry.addedIn, out: fr.entry.addedOut, saving: fr.entry.addedSaving },
  updated: { in: fr.entry.updatedIn, out: fr.entry.updatedOut, saving: fr.entry.updatedSaving },
} as const

/** La clé du toast : l'épargne parle d'elle-même, les deux autres du sens. */
const toastKey = (nature: EntryNature, direction: Direction): 'in' | 'out' | 'saving' =>
  nature === 'saving' ? 'saving' : direction

export function saveOperation(built: Built, operation: Operation | null): void {
  if (built.kind === 'entry') {
    const key = toastKey(built.nature, built.payload.direction)
    if (operation?.kind === 'entry') {
      replaceEntry(operation.entry.id, built.payload)
      toast(TOAST.updated[key])
    } else {
      addEntry(built.payload)
      toast(TOAST.added[key])
    }
    return
  }

  if (operation?.kind === 'recurrence') {
    replaceRecurrence(operation.recurrence.id, built.payload)
    toast(fr.recurrences.updated)
    return
  }

  /* La règle produit ses échéances dans la foulée. Celle qui a déjà eu lieu part
     confirmée — voir `Built.paidOn` : l'utilisateur vient de dire qu'elle a été
     payée, on ne la lui redemande pas. */
  if (built.paidOn === null) addRecurrence(built.payload)
  else addRecurrencePaidOn(built.payload, built.paidOn)
  toast(fr.recurrences.added)
}
