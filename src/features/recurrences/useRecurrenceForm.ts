/* État et validation du formulaire d'abonnement. Le composant n'en garde
 * aucune règle : il lit des champs et appelle `submit`. */

import { useMemo, useState } from 'react'
import { today } from '@/domain/date'
import { type Money, parseAmount, toAmountInput } from '@/domain/money'
import { memberRequired } from '@/domain/split'
import type { Direction, Recurrence } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { useKindOf, useMembers } from '@/store/selectors'
import { type PeriodDraft, defaultsFrom, kindOf, periodOf } from './period'

export type RecurrenceDraft = PeriodDraft & {
  label: string
  direction: Direction
  categoryId: string
  memberId: string
  amountText: string
  variable: boolean
  /** `undefined` = la règle tranche ; voir `isSharedEntry`. */
  shared: boolean | undefined
  note: string
}

export type DraftErrors = Partial<Record<'label' | 'amount' | 'category' | 'member', string>>

function draftFrom(recurrence: Recurrence | null, defaultCategoryId: string): RecurrenceDraft {
  const start = recurrence?.startedOn ?? today()
  const fallbacks = defaultsFrom(start)
  return {
    label: recurrence?.label ?? '',
    direction: recurrence?.direction ?? 'out',
    categoryId: recurrence?.categoryId ?? defaultCategoryId,
    memberId: recurrence?.memberId ?? '',
    amountText: recurrence?.amount != null ? toAmountInput(recurrence.amount) : '',
    variable: recurrence ? recurrence.amount === null : false,
    shared: recurrence?.shared,
    kind: recurrence ? kindOf(recurrence.period) : 'monthly',
    everyMonths: recurrence?.period.unit === 'month' ? recurrence.period.every : 2,
    monthDay:
      recurrence && recurrence.period.unit !== 'week'
        ? recurrence.period.anchorDay
        : fallbacks.monthDay,
    weekday:
      recurrence?.period.unit === 'week' ? recurrence.period.anchorDay : fallbacks.weekday,
    startedOn: start,
    note: recurrence?.note ?? '',
  }
}

export type SubmitPayload = Omit<Recurrence, 'id'>

export function useRecurrenceForm(recurrence: Recurrence | null, defaultCategoryId: string) {
  const [draft, setDraft] = useState<RecurrenceDraft>(() =>
    draftFrom(recurrence, defaultCategoryId),
  )
  const [showErrors, setShowErrors] = useState(false)
  const members = useMembers()
  const kindOf = useKindOf()

  const amount: Money | null = useMemo(
    () => (draft.variable ? null : parseAmount(draft.amountText)),
    [draft.variable, draft.amountText],
  )

  const errors: DraftErrors = useMemo(() => {
    const found: DraftErrors = {}
    if (draft.label.trim().length === 0) found.label = fr.recurrences.form.labelRequired
    if (draft.categoryId === '') found.category = fr.recurrences.form.categoryRequired
    if (!draft.variable && (amount === null || amount <= 0)) {
      found.amount = fr.recurrences.form.amountRequired
    }
    /* Un abonnement qui n'entre pas dans les charges communes doit être à
       quelqu'un : il pose une échéance par période, et chacune manquerait au
       mois de tout le monde. */
    if (
      members.length > 0 &&
      memberRequired(draft.direction, kindOf(draft.categoryId), draft.memberId, draft.shared)
    ) {
      found.member = fr.recurrences.form.memberRequired
    }
    return found
  }, [
    draft.label,
    draft.categoryId,
    draft.variable,
    draft.direction,
    draft.memberId,
    draft.shared,
    amount,
    members,
    kindOf,
  ])

  const patch = (next: Partial<RecurrenceDraft>): void => {
    setDraft((current) => {
      // Changer la date de première échéance réaligne les ancres tant que
      // l'utilisateur ne les a pas lui-même touchées.
      if (next.startedOn !== undefined && next.startedOn !== current.startedOn) {
        return { ...current, ...next, ...defaultsFrom(next.startedOn) }
      }
      return { ...current, ...next }
    })
  }

  const build = (): SubmitPayload | null => {
    setShowErrors(true)
    if (Object.keys(errors).length > 0) return null
    return {
      label: draft.label.trim(),
      categoryId: draft.categoryId,
      ...(draft.memberId === '' ? {} : { memberId: draft.memberId }),
      direction: draft.direction,
      amount,
      period: periodOf(draft),
      startedOn: draft.startedOn,
      ...(recurrence?.endedOn === undefined ? {} : { endedOn: recurrence.endedOn }),
      ...(draft.shared === undefined ? {} : { shared: draft.shared }),
      ...(draft.note.trim() === '' ? {} : { note: draft.note.trim() }),
    }
  }

  /* La mention « obligatoire » ne se découvre pas après un échec : le champ la
     porte dès que la règle s'applique, comme les autres champs obligatoires. */
  return { draft, patch, errors: showErrors ? errors : {}, needsMember: errors.member !== undefined, build }
}
