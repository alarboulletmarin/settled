import { useState } from 'react'
import { type Money, parseAmount, toAmountInput } from '@/domain/money'
import type { Member } from '@/domain/types'
import { tpl } from '@/i18n/format'
import { fr } from '@/i18n/fr'
import { Button, IconButton } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { AmountInput, Field, TextInput } from '@/ui/Field'
import { Close } from '@/ui/Icons'

/** Deuxième étape : les membres. Elle peut être passée — l'usage solo existe. */
export function MembersStep({
  members,
  onAdd,
  onRemove,
  onDone,
}: {
  members: readonly Member[]
  onAdd: (name: string, income: Money | undefined) => void
  onRemove: (id: string) => void
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [income, setIncome] = useState('')
  const trimmed = name.trim()

  const submit = (): void => {
    if (trimmed.length === 0) return
    const parsed = parseAmount(income)
    onAdd(trimmed, parsed !== null && parsed >= 0 ? parsed : undefined)
    setName('')
    setIncome('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="t-section">{fr.onboarding.membersTitle}</h1>
        <p className="t-label">{fr.onboarding.membersHint}</p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        {/* Empilés au téléphone : côte à côte, « Revenu mensuel net ·
            facultatif » se coupe en deux avant qu'on ait rien saisi. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
          <Field label={fr.onboarding.membersLabel} required className="min-w-0 sm:flex-1">
            {(id) => (
              <TextInput
                id={id}
                value={name}
                placeholder={fr.onboarding.membersPlaceholder}
                maxLength={24}
                autoFocus
                onChange={(event) => {
                  setName(event.target.value)
                }}
              />
            )}
          </Field>
          <Field label={fr.onboarding.membersIncome} optional className="sm:w-36">
            {(id) => (
              <AmountInput
                id={id}
                value={income}
                placeholder="0,00"
                onChange={(event) => {
                  setIncome(event.target.value)
                }}
              />
            )}
          </Field>
        </div>
        <p className="t-label">{fr.onboarding.membersIncomeHint}</p>
        <Button
          type="submit"
          variant="secondary"
          disabled={trimmed.length === 0}
          className="self-start"
        >
          {fr.onboarding.membersAdd}
        </Button>
      </form>

      {members.length === 0 ? (
        <p className="t-label">{fr.onboarding.membersEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex h-14 items-center gap-3 rounded-inner bg-surface-2 px-3"
            >
              <Dot color={member.color} />
              <span className="t-body truncate">{member.name}</span>
              {member.income !== undefined && (
                <span className="t-axis tnum ml-auto">{toAmountInput(member.income)}</span>
              )}
              <IconButton
                label={tpl(fr.onboarding.membersRemove, member.name)}
                className={member.income === undefined ? 'ml-auto' : ''}
                onClick={() => {
                  onRemove(member.id)
                }}
              >
                <Close size={18} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={onDone} full>
        {members.length === 0 ? fr.onboarding.solo : fr.onboarding.start}
      </Button>
    </div>
  )
}
