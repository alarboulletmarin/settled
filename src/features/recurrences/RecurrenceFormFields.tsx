import type { Member } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { CategorySelect } from '@/ui/CategorySelect'
import { AmountInput, Field, Select, TextInput } from '@/ui/Field'
import { Segmented } from '@/ui/Segmented'
import { PERIOD_OPTIONS } from './period'
import type { DraftErrors, RecurrenceDraft } from './useRecurrenceForm'

const DIRECTIONS = [
  { value: 'out' as const, label: fr.direction.out },
  { value: 'in' as const, label: fr.direction.in },
]

const AMOUNT_KINDS = [
  { value: 'fixed' as const, label: fr.recurrences.fixedAmount },
  { value: 'variable' as const, label: fr.recurrences.variable },
]

export type FieldsProps = {
  draft: RecurrenceDraft
  patch: (next: Partial<RecurrenceDraft>) => void
  errors: DraftErrors
  members: Member[]
}

export function IdentityFields({ draft, patch, errors, members }: FieldsProps) {
  return (
    <>
      <Field label={fr.recurrences.form.label} required {...(errors.label ? { error: errors.label } : {})}>
        {(id, describedBy) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            value={draft.label}
            invalid={Boolean(errors.label)}
            placeholder={fr.recurrences.form.labelPlaceholder}
            maxLength={60}
            onChange={(e) => {
              patch({ label: e.target.value })
            }}
          />
        )}
      </Field>

      <Segmented
        options={DIRECTIONS}
        value={draft.direction}
        onChange={(direction) => {
          patch({ direction, categoryId: '' })
        }}
        label={fr.recurrences.form.direction}
      />

      <Field
        label={fr.recurrences.form.category}
        required
        {...(errors.category ? { error: errors.category } : {})}
      >
        {(id, describedBy) => (
          <CategorySelect
            id={id}
            aria-describedby={describedBy}
            direction={draft.direction}
            value={draft.categoryId}
            onChange={(e) => {
              patch({ categoryId: e.target.value })
            }}
          />
        )}
      </Field>

      {members.length > 0 && (
        <Field label={fr.recurrences.form.member} optional>
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
    </>
  )
}

export function AmountFields({ draft, patch, errors }: Omit<FieldsProps, 'members'>) {
  return (
    <>
      <Segmented
        options={AMOUNT_KINDS}
        value={draft.variable ? 'variable' : 'fixed'}
        onChange={(kind) => {
          patch({ variable: kind === 'variable' })
        }}
        label={fr.recurrences.form.amountKind}
      />

      {draft.variable ? (
        <p className="t-label">{fr.recurrences.variableHint}</p>
      ) : (
        <Field
          label={fr.recurrences.form.amount}
          required
          {...(errors.amount ? { error: errors.amount } : {})}
        >
          {(id, describedBy) => (
            <AmountInput
              id={id}
              aria-describedby={describedBy}
              value={draft.amountText}
              invalid={Boolean(errors.amount)}
              placeholder="0,00"
              onChange={(e) => {
                patch({ amountText: e.target.value })
              }}
            />
          )}
        </Field>
      )}
    </>
  )
}

export function PeriodFields({ draft, patch }: Pick<FieldsProps, 'draft' | 'patch'>) {
  return (
    <>
      <Field label={fr.recurrences.form.period} required>
        {(id) => (
          <Select
            id={id}
            value={draft.kind}
            onChange={(e) => {
              patch({ kind: e.target.value as RecurrenceDraft['kind'] })
            }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label={fr.recurrences.form.startedOn} required>
        {(id) => (
          <TextInput
            id={id}
            type="date"
            value={draft.startedOn}
            onChange={(e) => {
              if (e.target.value !== '') patch({ startedOn: e.target.value })
            }}
          />
        )}
      </Field>

      {draft.kind === 'weekly' && (
        <Field label={fr.recurrences.form.weekday} required>
          {(id) => (
            <Select
              id={id}
              value={String(draft.weekday)}
              onChange={(e) => {
                patch({ weekday: Number(e.target.value) })
              }}
            >
              {fr.calendarNames.weekdays.map((day, index) => (
                <option key={day} value={index + 1}>
                  {day}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      {draft.kind === 'everyNMonths' && (
        <Field label={fr.recurrences.form.everyMonths} required>
          {(id) => (
            <TextInput
              id={id}
              type="number"
              min={1}
              max={24}
              value={String(draft.everyMonths)}
              onChange={(e) => {
                patch({ everyMonths: Math.max(1, Number(e.target.value) || 1) })
              }}
            />
          )}
        </Field>
      )}

      {draft.kind !== 'weekly' && draft.kind !== 'yearly' && (
        <Field label={fr.recurrences.form.monthDay} required hint={fr.recurrences.form.monthDayHint}>
          {(id, describedBy) => (
            <TextInput
              id={id}
              type="number"
              min={1}
              max={31}
              aria-describedby={describedBy}
              value={String(draft.monthDay)}
              onChange={(e) => {
                patch({ monthDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })
              }}
            />
          )}
        </Field>
      )}
    </>
  )
}
