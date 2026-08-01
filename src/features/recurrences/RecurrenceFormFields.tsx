import type { Member } from '@/domain/types'
import { memberPatch } from '@/features/split/memberDraft'
import { fr } from '@/i18n/fr'
import { CategorySelect } from '@/ui/CategorySelect'
import { kindsOfNature } from '@/ui/categoryKinds'
import { AmountInput, Field, Select, TextInput } from '@/ui/Field'
import { Segmented } from '@/ui/Segmented'
import { PERIOD_OPTIONS, type PeriodDraft } from './period'
import type { DraftErrors, RecurrenceDraft } from './useRecurrenceForm'

/* Les mêmes trois positions que la saisie ponctuelle, et pour la même raison :
   un virement d'épargne programmé n'est pas un abonnement de plus dans les
   charges, et il allait se chercher parmi elles. */
const NATURES = [
  { value: 'expense' as const, label: fr.entry.natureExpense },
  { value: 'income' as const, label: fr.entry.natureIncome },
  { value: 'saving' as const, label: fr.entry.natureSaving },
]

const MOVEMENTS = [
  { value: 'out' as const, label: fr.entry.savingIn },
  { value: 'in' as const, label: fr.entry.savingOut },
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
  /** La règle « à quelqu'un, ou à tout le monde » s'applique-t-elle ici ? */
  needsMember?: boolean
}

export function IdentityFields({ draft, patch, errors, members, needsMember = false }: FieldsProps) {
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

      <div className="flex flex-wrap gap-2">
        <Segmented
          options={NATURES}
          value={draft.nature}
          onChange={(nature) => {
            patch({
              nature,
              direction: nature === 'income' ? 'in' : 'out',
              categoryId: '',
            })
          }}
          label={fr.entry.nature}
        />
        {draft.nature === 'saving' && (
          <Segmented
            options={MOVEMENTS}
            value={draft.direction}
            onChange={(direction) => {
              patch({ direction })
            }}
            label={fr.entry.savingMovement}
          />
        )}
      </div>

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
            kinds={kindsOfNature(draft.nature)}
            value={draft.categoryId}
            onChange={(e) => {
              patch({ categoryId: e.target.value })
            }}
          />
        )}
      </Field>

      {members.length > 0 && (
        /* La phrase sert d'aide tant qu'on n'a pas essayé d'enregistrer, puis
           d'erreur : c'est la même, et elle dit pourquoi ce champ, facultatif
           ailleurs, ne l'est pas ici. */
        <Field
          label={fr.recurrences.form.member}
          {...(needsMember
            ? { required: true, hint: fr.recurrences.form.memberRequired }
            : { optional: true })}
          {...(errors.member ? { error: errors.member } : {})}
        >
          {(id, describedBy) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={draft.memberId}
              invalid={Boolean(errors.member)}
              onChange={(e) => {
                patch(memberPatch(e.target.value))
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
        <>
          <p className="t-label">{fr.recurrences.variableHint}</p>
          {/* Sans lui, un salaire variable ne vaut rien tant qu'aucune échéance
              n'est tombée — et tout le foyer reste sans répartition, sans que
              rien n'indique qu'il manque un chiffre quelque part. */}
          <Field
            label={fr.recurrences.form.estimate}
            optional
            hint={fr.recurrences.form.estimateHint}
            {...(errors.estimate ? { error: errors.estimate } : {})}
          >
            {(id, describedBy) => (
              <AmountInput
                id={id}
                aria-describedby={describedBy}
                value={draft.estimateText}
                invalid={Boolean(errors.estimate)}
                placeholder="0,00"
                onChange={(e) => {
                  patch({ estimateText: e.target.value })
                }}
              />
            )}
          </Field>
        </>
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

export type PeriodFieldsProps = {
  draft: PeriodDraft
  patch: (next: Partial<PeriodDraft>) => void
  /**
   * Faux quand l'écran porte déjà le champ de date. La saisie d'une dépense
   * bascule en récurrence sans changer de date : celle qu'on vient d'entrer
   * *est* la première échéance, et en demander une seconde donnerait deux
   * champs de date pour une seule réponse.
   */
  withStart?: boolean
}

export function PeriodFields({ draft, patch, withStart = true }: PeriodFieldsProps) {
  return (
    <>
      <Field label={fr.recurrences.form.period} required>
        {(id) => (
          <Select
            id={id}
            value={draft.kind}
            onChange={(e) => {
              patch({ kind: e.target.value as PeriodDraft['kind'] })
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

      {withStart && (
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
      )}

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
