import type { Recurrence } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { addRecurrence, updateRecurrence } from '@/store/actions'
import { useActiveCategories, useMembers } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { Field, TextInput } from '@/ui/Field'
import { Sheet } from '@/ui/Sheet'
import { AmountFields, IdentityFields, PeriodFields } from './RecurrenceFormFields'
import { useRecurrenceForm } from './useRecurrenceForm'

/** Création et édition. Le même formulaire, la même validation. */
function Form({ recurrence, onDone }: { recurrence: Recurrence | null; onDone: () => void }) {
  const members = useMembers()
  const categories = useActiveCategories()
  const scoped = categories.filter((c) => c.direction === (recurrence?.direction ?? 'out'))
  const { draft, patch, errors, build } = useRecurrenceForm(recurrence, scoped[0]?.id ?? '')
  const forDirection = categories.filter((c) => c.direction === draft.direction)

  const submit = (): void => {
    const payload = build()
    if (payload === null) return
    if (recurrence === null) addRecurrence(payload)
    else updateRecurrence(recurrence.id, payload)
    onDone()
  }

  return (
    <form
      id="recurrence-form"
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <IdentityFields
        draft={draft}
        patch={patch}
        errors={errors}
        categories={forDirection}
        members={members}
      />
      <AmountFields draft={draft} patch={patch} errors={errors} />
      <PeriodFields draft={draft} patch={patch} />

      <Field label={fr.recurrences.form.note} optional>
        {(id) => (
          <TextInput
            id={id}
            value={draft.note}
            maxLength={140}
            onChange={(e) => {
              patch({ note: e.target.value })
            }}
          />
        )}
      </Field>
    </form>
  )
}

export function RecurrenceSheet({
  open,
  recurrence,
  onClose,
}: {
  open: boolean
  recurrence: Recurrence | null
  onClose: () => void
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={recurrence === null ? fr.recurrences.add : fr.recurrences.edit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {fr.common.cancel}
          </Button>
          <Button type="submit" form="recurrence-form">
            {fr.common.save}
          </Button>
        </>
      }
    >
      {/* Remonté à chaque ouverture : le brouillon repart de la récurrence. */}
      {open && <Form key={recurrence?.id ?? 'new'} recurrence={recurrence} onDone={onClose} />}
    </Sheet>
  )
}
