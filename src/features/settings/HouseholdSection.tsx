import { useState } from 'react'
import { RECURRENCE_NEW_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { formatMoney, formatPercent, tpl } from '@/i18n/format'
import { addMember, removeMember, setHouseholdName } from '@/store/actions'
import {
  useHouseholdName,
  useMemberIncomes,
  useMemberSharesOfIncome,
  useMembers,
} from '@/store/selectors'
import { Button, IconButton } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { Field, TextInput } from '@/ui/Field'
import { Close, HouseholdIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { Link } from 'react-router-dom'

export function HouseholdSection() {
  const name = useHouseholdName()
  const members = useMembers()
  const incomes = useMemberIncomes()
  const shares = useMemberSharesOfIncome()
  const currency = useCurrency()
  const [newMember, setNewMember] = useState('')
  const trimmed = newMember.trim()

  const incomeOf = new Map(incomes.map((i) => [i.memberId, i.income]))

  return (
    <Tile className="gap-4">
      <Eyebrow icon={HouseholdIcon}>{fr.settings.household}</Eyebrow>

      <Field label={fr.settings.householdName} required>
        {(id) => (
          <TextInput
            id={id}
            value={name}
            placeholder={fr.settings.householdPlaceholder}
            maxLength={40}
            onChange={(event) => {
              setHouseholdName(event.target.value)
            }}
          />
        )}
      </Field>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <h3 className="t-body font-medium">{fr.settings.members}</h3>
        {/* La phrase explique ce que fait le retrait : sans personne à retirer,
            elle parle d'un « ses » qui ne désigne rien. */}
        {members.length > 0 && <p className="t-label">{fr.settings.memberRemoveHint}</p>}

        {members.length === 0 ? (
          <p className="t-label">{fr.settings.membersEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {members.map((member) => {
              const income = incomeOf.get(member.id) ?? null
              const shareBp = shares?.get(member.id)
              return (
                <li
                  key={member.id}
                  className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-0.5 rounded-inner bg-surface-2 px-3 py-2"
                >
                  <Dot color={member.color} />
                  <span className="t-body min-w-0 flex-1 truncate">{member.name}</span>
                  <IconButton
                    label={tpl(fr.settings.memberRemove, member.name)}
                    onClick={() => {
                      removeMember(member.id)
                    }}
                  >
                    <Close size={18} />
                  </IconButton>
                  {/* Le revenu ne se saisit pas ici : il se lit sur les
                      abonnements de ressources du membre. Une seule vérité,
                      et une augmentation se répercute d'elle-même. */}
                  <span className="t-axis tnum w-full">
                    {income === null
                      ? fr.settings.memberNoIncome
                      : formatMoney(income, currency, false) +
                        (shareBp === undefined
                          ? ''
                          : ` · ${tpl(fr.settings.memberShareOf, formatPercent(shareBp / 10_000, 1))}`)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (trimmed === '') return
            addMember(trimmed)
            setNewMember('')
          }}
        >
          <Field label={fr.settings.memberName} className="flex-1">
            {(id) => (
              <TextInput
                id={id}
                value={newMember}
                placeholder={fr.settings.memberPlaceholder}
                maxLength={24}
                onChange={(event) => {
                  setNewMember(event.target.value)
                }}
              />
            )}
          </Field>
          <Button type="submit" variant="secondary" disabled={trimmed === ''}>
            {fr.settings.memberAdd}
          </Button>
        </form>

        <p className="t-label">
          {fr.settings.memberIncomeHint}{' '}
          <Link to={RECURRENCE_NEW_PATH} className="underline underline-offset-2">
            {fr.settings.memberIncomeLink}
          </Link>
        </p>
      </div>
    </Tile>
  )
}
