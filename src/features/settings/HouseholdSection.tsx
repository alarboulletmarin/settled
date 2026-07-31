import { useState } from 'react'
import {
  RECURRENCES_PATH,
  RECURRENCE_NEW_PATH,
  SPLIT_PATH,
  recurrenceEditPath,
} from '@/app/routes'
import { fr } from '@/i18n/fr'
import { formatMoney, formatPercent, tpl } from '@/i18n/format'
import { addMember, removeMember, renameMember, setHouseholdName } from '@/store/actions'
import {
  useHouseholdName,
  useMemberIncomes,
  useMemberSharesOfIncome,
  useMembers,
  useUnassignedIncomes,
} from '@/store/selectors'
import { Button, IconButton } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { Field, TextInput } from '@/ui/Field'
import { Close, HouseholdIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { Link } from 'react-router-dom'
import { MemberNameInput } from './MemberNameInput'

export function HouseholdSection() {
  const name = useHouseholdName()
  const members = useMembers()
  const incomes = useMemberIncomes()
  const unassigned = useUnassignedIncomes()
  const shares = useMemberSharesOfIncome()
  const currency = useCurrency()
  const [newMember, setNewMember] = useState('')
  const trimmed = newMember.trim()

  const incomeOf = new Map(incomes.map((i) => [i.memberId, i]))

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
              const read = incomeOf.get(member.id)
              const shareBp = shares?.get(member.id)
              return (
                <li
                  key={member.id}
                  className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-0.5 rounded-inner bg-surface-2 px-3 py-2"
                >
                  <Dot color={member.color} />
                  <MemberNameInput
                    label={tpl(fr.settings.memberRename, member.name)}
                    name={member.name}
                    onRename={(next) => {
                      renameMember(member.id, next)
                    }}
                  />
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
                      et une augmentation se répercute d'elle-même.

                      Quand il ne se lit pas, la ligne dit laquelle des deux
                      raisons c'est : « aucun revenu enregistré » sur un membre
                      qui en porte un, mais variable et pas encore chiffré,
                      envoyait en créer un second. */}
                  <span className="t-axis tnum w-full">
                    {read?.income != null
                      ? formatMoney(read.income, currency, false) +
                        (shareBp === undefined
                          ? ''
                          : ` · ${tpl(fr.settings.memberShareOf, formatPercent(shareBp / 10_000, 1))}`)
                      : read?.gap === 'unpriced'
                        ? fr.settings.memberIncomeUnpriced
                        : fr.settings.memberNoIncome}
                  </span>
                  {read?.gap === 'unpriced' && (
                    <Link
                      to={RECURRENCES_PATH}
                      className="t-label w-full underline underline-offset-2"
                    >
                      {fr.settings.memberIncomeUnpricedFix}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* Un salaire resté « tout le foyer » ne compte dans le revenu de
            personne : il rentre bien sur le mois, mais il ne pèse dans aucune
            part, et rien nulle part ne le disait. C'est la première explication
            d'une répartition qui ne se calcule pas — la saisie l'exige
            désormais à quelqu'un, restent ceux posés avant cette règle, ou
            avant qu'il y ait des membres. */}
        {members.length > 0 && unassigned.length > 0 && (
          <div className="flex flex-col gap-1 rounded-inner bg-surface-2 px-3 py-2">
            <p className="t-label">
              {tpl(
                unassigned.length > 1
                  ? fr.settings.incomeUnassignedMany
                  : fr.settings.incomeUnassignedOne,
                unassigned.map((r) => r.label).join(', '),
              )}
            </p>
            {/* Droit sur l'abonnement quand il n'y en a qu'un : le nom est déjà
                dans la phrase, le répéter en lien ne dirait rien de plus. */}
            <Link
              to={
                unassigned.length === 1 && unassigned[0] !== undefined
                  ? recurrenceEditPath(unassigned[0].id)
                  : RECURRENCES_PATH
              }
              className="t-label underline underline-offset-2"
            >
              {fr.settings.incomeUnassignedFix}
            </Link>
          </div>
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

        {/* Sous deux membres il n'y a rien à répartir, et l'écran renverrait
            ici même : le lien ne s'affiche qu'une fois le foyer partagé. */}
        {members.length > 1 && (
          <Link
            to={SPLIT_PATH}
            className="t-label inline-flex min-h-11 w-fit items-center rounded-input underline underline-offset-2"
          >
            {fr.settings.splitLink}
          </Link>
        )}
      </div>
    </Tile>
  )
}
