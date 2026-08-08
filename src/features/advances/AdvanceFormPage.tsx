import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ADVANCES_PATH } from '@/app/routes'
import { monthlyInstalment, monthsCovered } from '@/domain/advance'
import { type ISODate, type YearMonth, currentYm, today, ymOf } from '@/domain/date'
import { parseAmount } from '@/domain/money'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { addAdvance } from '@/store/actions'
import { useCategoriesByFamily, useMembers } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { CategorySelect } from '@/ui/CategorySelect'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { AmountInput, Checkbox, Field, Select, TextInput } from '@/ui/Field'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { toast } from '@/ui/toast'
import { useLeaveGuard } from '@/ui/useLeaveGuard'

type Draft = {
  label: string
  amountText: string
  paidOn: ISODate
  categoryId: string
  savingCategoryId: string
  memberId: string
  from: YearMonth
  to: YearMonth
  shared: boolean
}

/** Douze mois, bornes comprises : la période d'une assurance ou d'une taxe. */
function defaultDraft(): Draft {
  const now = currentYm()
  const [y, m] = now.split('-')
  const year = Number(y)
  const month = Number(m)
  const endYear = month === 1 ? year : year + 1
  const endMonth = month === 1 ? 12 : month - 1
  return {
    label: '',
    amountText: '',
    paidOn: today(),
    categoryId: '',
    savingCategoryId: '',
    memberId: '',
    from: now,
    to: `${String(endYear)}-${String(endMonth).padStart(2, '0')}`,
    shared: false,
  }
}

/**
 * Le support d'épargne repris — un `select` restreint aux natures `saving`.
 *
 * `CategorySelect` range par sens, et le sens ne sait pas distinguer un livret
 * d'un plein d'essence : les deux sortent. C'est la nature qui le sait, et
 * proposer ici les trente-huit catégories de sortie ferait chercher le livret
 * parmi les courses.
 */
function SavingSelect(props: Omit<Parameters<typeof Select>[0], 'children'>) {
  const groups = useCategoriesByFamily(['saving'])
  return (
    <Select {...props}>
      <option value="">{fr.entry.categoryPlaceholder}</option>
      {groups.map((group) => (
        <optgroup key={group.family.id} label={group.family.label}>
          {group.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  )
}

/**
 * Poser une avance : ce qui a été payé, quand, sur quel support, et la période
 * que ça couvre. La mensualité s'en déduit — on ne la saisit pas, sinon les
 * deux chiffres finiraient par ne plus se répondre.
 *
 * Pas d'écran de reprise : une avance décrit un paiement qui a eu lieu, une
 * fois. La corriger, c'est la retirer et la reposer — ce qui est déjà revenu
 * sur le livret reste, comme pour un crédit qu'on cesse de suivre.
 */
export function AdvanceFormPage() {
  const members = useMembers()
  const currency = useCurrency()
  const navigate = useNavigate()
  const location = useLocation()
  const [draft, setDraft] = useState<Draft>(defaultDraft)
  const [showErrors, setShowErrors] = useState(false)

  const amount = parseAmount(draft.amountText)
  const errors = {
    label: draft.label.trim() === '' ? fr.advances.labelRequired : undefined,
    amount: amount === null || amount <= 0 ? fr.advances.amountRequired : undefined,
    category: draft.categoryId === '' ? fr.advances.categoryRequired : undefined,
    saving: draft.savingCategoryId === '' ? fr.advances.savingCategoryRequired : undefined,
    member: draft.memberId === '' ? fr.advances.memberRequired : undefined,
    period: draft.to < draft.from ? fr.advances.periodInvalid : undefined,
  }
  // Le type doit rester celui de `errors` : `{}` littéral perdrait les clés, et
  // chaque champ irait chercher une propriété que TypeScript ne connaît plus.
  const shown: Partial<typeof errors> = showErrors ? errors : {}

  const patch = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }))
  }

  const back = (): void => {
    if (location.key === 'default') void navigate(ADVANCES_PATH)
    else void navigate(-1)
  }

  const guard = useLeaveGuard(draft, back)

  const months = monthsCovered(draft)
  const monthly = amount === null ? null : monthlyInstalment({ ...draft, amount })

  const submit = (): void => {
    if (Object.values(errors).some((error) => error !== undefined) || amount === null) {
      setShowErrors(true)
      return
    }
    addAdvance({
      label: draft.label.trim(),
      categoryId: draft.categoryId,
      savingCategoryId: draft.savingCategoryId,
      memberId: draft.memberId,
      amount,
      paidOn: draft.paidOn,
      from: draft.from,
      to: draft.to,
      ...(draft.shared ? { shared: true } : {}),
    })
    toast(fr.advances.added)
    void navigate(ADVANCES_PATH)
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <PageTitle title={fr.advances.add} onBack={guard.request} />

      {/* Sans membre, rien à enregistrer : une épargne est toujours à
          quelqu'un, et l'écran le dit plutôt que de proposer un champ vide. */}
      {members.length === 0 ? (
        <p className="t-label">{fr.advances.memberNone}</p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <Tile className="gap-4">
            <Field
              label={fr.advances.label}
              required
              {...(shown.label === undefined ? {} : { error: shown.label })}
            >
              {(id, describedBy) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  value={draft.label}
                  invalid={shown.label !== undefined}
                  placeholder={fr.advances.labelPlaceholder}
                  maxLength={60}
                  autoFocus
                  onChange={(e) => {
                    patch({ label: e.target.value })
                  }}
                />
              )}
            </Field>

            <Field
              label={fr.advances.amount}
              required
              hint={fr.advances.amountHint}
              {...(shown.amount === undefined ? {} : { error: shown.amount })}
            >
              {(id, describedBy) => (
                <AmountInput
                  id={id}
                  aria-describedby={describedBy}
                  value={draft.amountText}
                  invalid={shown.amount !== undefined}
                  placeholder="600,00"
                  onChange={(e) => {
                    patch({ amountText: e.target.value })
                  }}
                />
              )}
            </Field>

            <Field label={fr.advances.paidOn} required>
              {(id) => (
                <TextInput
                  id={id}
                  type="date"
                  value={draft.paidOn}
                  onChange={(e) => {
                    const next = e.target.value
                    // Le mois de départ suit le paiement tant qu'on ne l'a pas
                    // déplacé soi-même : une avance couvre presque toujours la
                    // période qui commence le mois où on l'a réglée.
                    patch(
                      ymOf(draft.paidOn) === draft.from
                        ? { paidOn: next, from: ymOf(next) }
                        : { paidOn: next },
                    )
                  }}
                />
              )}
            </Field>

            <Field
              label={fr.advances.category}
              required
              {...(shown.category === undefined ? {} : { error: shown.category })}
            >
              {(id, describedBy) => (
                <CategorySelect
                  id={id}
                  aria-describedby={describedBy}
                  direction="out"
                  value={draft.categoryId}
                  invalid={shown.category !== undefined}
                  onChange={(e) => {
                    patch({ categoryId: e.target.value })
                  }}
                />
              )}
            </Field>

            <Field
              label={fr.advances.savingCategory}
              required
              hint={fr.advances.savingCategoryHint}
              {...(shown.saving === undefined ? {} : { error: shown.saving })}
            >
              {(id, describedBy) => (
                <SavingSelect
                  id={id}
                  aria-describedby={describedBy}
                  value={draft.savingCategoryId}
                  invalid={shown.saving !== undefined}
                  onChange={(e) => {
                    patch({ savingCategoryId: e.target.value })
                  }}
                />
              )}
            </Field>

            <Field
              label={fr.advances.member}
              required
              {...(shown.member === undefined ? {} : { error: shown.member })}
            >
              {(id, describedBy) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  value={draft.memberId}
                  invalid={shown.member !== undefined}
                  onChange={(e) => {
                    patch({ memberId: e.target.value })
                  }}
                >
                  <option value="">{fr.advances.member}</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="flex flex-wrap gap-4">
              <Field label={fr.advances.from} className="min-w-40 flex-1">
                {(id) => (
                  <TextInput
                    id={id}
                    type="month"
                    value={draft.from}
                    onChange={(e) => {
                      patch({ from: e.target.value })
                    }}
                  />
                )}
              </Field>
              <Field
                label={fr.advances.to}
                className="min-w-40 flex-1"
                {...(shown.period === undefined ? {} : { error: shown.period })}
              >
                {(id, describedBy) => (
                  <TextInput
                    id={id}
                    type="month"
                    aria-describedby={describedBy}
                    value={draft.to}
                    invalid={shown.period !== undefined}
                    onChange={(e) => {
                      patch({ to: e.target.value })
                    }}
                  />
                )}
              </Field>
            </div>

            {/* La case ne s'affiche qu'à partir de deux membres, comme sur la
                saisie : à un seul, tout est déjà à la même personne. */}
            {members.length > 1 && (
              <Checkbox
                checked={draft.shared}
                label={fr.entry.shared}
                hint={fr.advances.methodShared}
                onChange={(next) => {
                  patch({ shared: next })
                }}
              />
            )}
          </Tile>

          {/* La mensualité se lit avant d'enregistrer : c'est le chiffre qui
              tombera chaque mois, et le seul moyen de vérifier que la période
              saisie est la bonne. */}
          {monthly !== null && errors.period === undefined && (
            <Tile variant="accent" className="mt-4 gap-1">
              <span className="t-label">{fr.advances.monthly}</span>
              <Amount value={monthly} size="tile" direction="out" />
              <span className="t-axis">
                {tpl(fr.advances.monthlyOf, formatMoney(monthly, currency, false), months)}
              </span>
            </Tile>
          )}

          <Button type="submit" full className="mt-4">
            {fr.common.save}
          </Button>
        </form>
      )}

      <Tile className="gap-2">
        <span className="t-label font-medium">{fr.advances.method}</span>
        <p className="t-label">{fr.advances.methodDrawdown}</p>
        <p className="t-label">{fr.advances.methodInstalments}</p>
        <p className="t-label">{fr.advances.methodExpense}</p>
      </Tile>

      <ConfirmDialog {...guard.dialog} />
    </div>
  )
}
