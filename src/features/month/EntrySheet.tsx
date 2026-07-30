import { useState } from 'react'
import { type ISODate, today } from '@/domain/date'
import { parseAmount, toAmountInput } from '@/domain/money'
import type { Direction, Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { addEntry, removeEntry, updateEntry } from '@/store/actions'
import { useActiveCategories, useMembers } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { AmountInput, Field, Select, TextInput } from '@/ui/Field'
import { Segmented } from '@/ui/Segmented'
import { Sheet } from '@/ui/Sheet'
import { toast } from '@/ui/toast'

const DIRECTIONS = [
  { value: 'out' as const, label: fr.direction.out },
  { value: 'in' as const, label: fr.direction.in },
]

type Draft = {
  amountText: string
  direction: Direction
  categoryId: string
  date: ISODate
  label: string
  memberId: string
  note: string
}

function initial(entry: Entry | null, defaultDate: ISODate): Draft {
  return {
    amountText: entry ? toAmountInput(entry.amount) : '',
    direction: entry?.direction ?? 'out',
    categoryId: entry?.categoryId ?? '',
    date: entry?.date ?? defaultDate,
    label: entry?.label ?? '',
    memberId: entry?.memberId ?? '',
    note: entry?.note ?? '',
  }
}

/**
 * Formulaire court du cahier §4.4 : montant, catégorie, date, libellé, membre.
 * Une saisie ponctuelle est créée directement en `confirmed`.
 */
function Form({ entry, defaultDate, onDone }: { entry: Entry | null; defaultDate: ISODate; onDone: () => void }) {
  const categories = useActiveCategories()
  const members = useMembers()
  const [draft, setDraft] = useState<Draft>(() => initial(entry, defaultDate))
  const [showErrors, setShowErrors] = useState(false)

  const amount = parseAmount(draft.amountText)
  const forDirection = categories.filter((c) => c.direction === draft.direction)
  const errors = {
    amount: amount === null || amount <= 0 ? fr.entry.amountRequired : undefined,
    category: draft.categoryId === '' ? fr.entry.categoryRequired : undefined,
    label: draft.label.trim() === '' ? fr.entry.labelRequired : undefined,
  }
  const shown = showErrors ? errors : { amount: undefined, category: undefined, label: undefined }

  const patch = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }))
  }

  const submit = (): void => {
    setShowErrors(true)
    if (amount === null || amount <= 0 || draft.categoryId === '' || draft.label.trim() === '') return
    const payload = {
      label: draft.label.trim(),
      categoryId: draft.categoryId,
      ...(draft.memberId === '' ? {} : { memberId: draft.memberId }),
      direction: draft.direction,
      amount,
      date: draft.date,
      status: 'confirmed' as const,
      ...(draft.note.trim() === '' ? {} : { note: draft.note.trim() }),
    }
    if (entry === null) {
      addEntry(payload)
      toast(fr.entry.added)
    } else {
      updateEntry(entry.id, payload)
      toast(fr.entry.updated)
    }
    onDone()
  }

  return (
    <form
      id="entry-form"
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <Segmented
        options={DIRECTIONS}
        value={draft.direction}
        onChange={(direction) => {
          patch({ direction, categoryId: '' })
        }}
        label={fr.entry.direction}
      />

      <Field label={fr.entry.amount} {...(shown.amount ? { error: shown.amount } : {})}>
        {(id, describedBy) => (
          <AmountInput
            id={id}
            aria-describedby={describedBy}
            value={draft.amountText}
            invalid={Boolean(shown.amount)}
            placeholder="0,00"
            autoFocus
            onChange={(e) => {
              patch({ amountText: e.target.value })
            }}
          />
        )}
      </Field>

      <Field label={fr.entry.category} {...(shown.category ? { error: shown.category } : {})}>
        {(id, describedBy) => (
          <Select
            id={id}
            aria-describedby={describedBy}
            value={draft.categoryId}
            onChange={(e) => {
              patch({ categoryId: e.target.value })
            }}
          >
            <option value="">—</option>
            {forDirection.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label={fr.entry.date}>
        {(id) => (
          <TextInput
            id={id}
            type="date"
            value={draft.date}
            onChange={(e) => {
              if (e.target.value !== '') patch({ date: e.target.value })
            }}
          />
        )}
      </Field>

      <Field label={fr.entry.label} {...(shown.label ? { error: shown.label } : {})}>
        {(id, describedBy) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            value={draft.label}
            invalid={Boolean(shown.label)}
            placeholder={fr.entry.labelPlaceholder}
            maxLength={60}
            onChange={(e) => {
              patch({ label: e.target.value })
            }}
          />
        )}
      </Field>

      {members.length > 0 && (
        <Field label={fr.entry.member} optional>
          {(id) => (
            <Select
              id={id}
              value={draft.memberId}
              onChange={(e) => {
                patch({ memberId: e.target.value })
              }}
            >
              <option value="">{fr.shell.everyone}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      {entry !== null && (
        <Button
          variant="ghost"
          onClick={() => {
            removeEntry(entry.id)
            toast(fr.entry.removed)
            onDone()
          }}
        >
          {fr.entry.remove}
        </Button>
      )}
    </form>
  )
}

export function EntrySheet({
  open,
  entry,
  defaultDate,
  onClose,
}: {
  open: boolean
  entry: Entry | null
  defaultDate?: ISODate
  onClose: () => void
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={entry === null ? fr.entry.add : fr.entry.edit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {fr.common.cancel}
          </Button>
          <Button type="submit" form="entry-form">
            {fr.common.save}
          </Button>
        </>
      }
    >
      {open && (
        <Form
          key={entry?.id ?? 'new'}
          entry={entry}
          defaultDate={defaultDate ?? today()}
          onDone={onClose}
        />
      )}
    </Sheet>
  )
}
