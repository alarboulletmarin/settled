import { useState } from 'react'
import type { Member } from '@/domain/types'
import { tpl } from '@/i18n/format'
import { fr } from '@/i18n/fr'
import { Button, IconButton } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Dot } from '@/ui/Dot'
import { Field, TextInput } from '@/ui/Field'
import { Close } from '@/ui/Icons'
import { MemberNameInput } from '@/features/settings/MemberNameInput'

/** Deuxième étape : les membres. Elle peut être passée — l'usage solo existe. */
export function MembersStep({
  members,
  onAdd,
  onRename,
  onRemove,
  onDone,
}: {
  members: readonly Member[]
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => void
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [removing, setRemoving] = useState<Member | null>(null)
  const trimmed = name.trim()

  const submit = (): void => {
    if (trimmed.length === 0) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="t-section">{fr.onboarding.membersTitle}</h1>
        <p className="t-label">{fr.onboarding.membersHint}</p>
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Field label={fr.onboarding.membersLabel} className="flex-1">
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
        <Button type="submit" variant="secondary" disabled={trimmed.length === 0}>
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
              <MemberNameInput
                label={tpl(fr.onboarding.membersRename, member.name)}
                name={member.name}
                onRename={(next) => {
                  onRename(member.id, next)
                }}
              />
              <IconButton
                label={tpl(fr.onboarding.membersRemove, member.name)}
                className="ml-auto"
                onClick={() => {
                  setRemoving(member)
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

      <ConfirmDialog
        open={removing !== null}
        title={tpl(fr.onboarding.membersRemove, removing?.name ?? '')}
        steps={[
          {
            question: tpl(fr.onboarding.membersRemoveConfirm, removing?.name ?? ''),
            action: fr.common.delete,
          },
        ]}
        onCancel={() => {
          setRemoving(null)
        }}
        onConfirm={() => {
          if (removing !== null) onRemove(removing.id)
          setRemoving(null)
        }}
      />
    </div>
  )
}
