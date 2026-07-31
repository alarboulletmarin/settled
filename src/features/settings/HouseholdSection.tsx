import { useState } from 'react'
import { parseAmount, toAmountInput } from '@/domain/money'
import type { Member } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatPercent, tpl } from '@/i18n/format'
import { addMember, removeMember, setHouseholdName, setMemberIncome } from '@/store/actions'
import { useHouseholdName, useMemberSharesOfIncome, useMembers } from '@/store/selectors'
import { Button, IconButton } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { AmountInput, Field, TextInput } from '@/ui/Field'
import { Close, HouseholdIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'

/**
 * Le revenu se modifie sur la ligne du membre, sans écran intermédiaire — c'est
 * le motif des échéances à montant variable. Une saisie illisible efface la
 * déclaration plutôt que de la figer à zéro : les deux ne disent pas la même
 * chose au prorata.
 */
function IncomeInput({ member }: { member: Member }) {
  const [text, setText] = useState(() =>
    member.income === undefined ? '' : toAmountInput(member.income),
  )

  return (
    <AmountInput
      value={text}
      placeholder="0,00"
      aria-label={tpl(fr.settings.memberIncomeOf, member.name)}
      className="min-w-0 flex-1"
      onChange={(event) => {
        setText(event.target.value)
        const parsed = parseAmount(event.target.value)
        setMemberIncome(member.id, parsed !== null && parsed >= 0 ? parsed : undefined)
      }}
    />
  )
}

export function HouseholdSection() {
  const name = useHouseholdName()
  const members = useMembers()
  const shares = useMemberSharesOfIncome()
  const [newMember, setNewMember] = useState('')
  const [newIncome, setNewIncome] = useState('')
  const trimmed = newMember.trim()

  const submit = (): void => {
    if (trimmed === '') return
    const member = addMember(trimmed)
    const income = parseAmount(newIncome)
    if (income !== null && income >= 0) setMemberIncome(member.id, income)
    setNewMember('')
    setNewIncome('')
  }

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
              const shareBp = shares?.get(member.id)
              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-2 rounded-inner bg-surface-2 px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
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
                  </div>
                  <div className="flex items-center gap-3">
                    <IncomeInput member={member} />
                    {/* La part n'apparaît que lorsqu'elle veut dire quelque
                        chose : il faut deux membres et tous les revenus. */}
                    {shareBp !== undefined && (
                      <span className="t-axis tnum shrink-0">
                        {tpl(fr.settings.memberShareOf, formatPercent(shareBp / 10_000, 1))}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          {/* Deux champs empilés au téléphone : côte à côte, leurs libellés se
              coupent en plein milieu avant même que la valeur soit saisie. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
            <Field label={fr.settings.memberName} required className="min-w-0 sm:flex-1">
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
            <Field label={fr.settings.memberIncome} optional className="sm:w-36">
              {(id) => (
                <AmountInput
                  id={id}
                  value={newIncome}
                  placeholder="0,00"
                  onChange={(event) => {
                    setNewIncome(event.target.value)
                  }}
                />
              )}
            </Field>
          </div>
          <p className="t-label">{fr.settings.memberIncomeHint}</p>
          <Button type="submit" variant="secondary" disabled={trimmed === ''} className="self-start">
            {fr.settings.memberAdd}
          </Button>
        </form>
      </div>
    </Tile>
  )
}
