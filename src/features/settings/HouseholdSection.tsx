import { useState } from 'react'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { addMember, removeMember, setHouseholdName } from '@/store/actions'
import { useHouseholdName, useMembers } from '@/store/selectors'
import { Button, IconButton } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { Field, TextInput } from '@/ui/Field'
import { Close } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'

export function HouseholdSection() {
  const name = useHouseholdName()
  const members = useMembers()
  const [newMember, setNewMember] = useState('')
  const trimmed = newMember.trim()

  return (
    <Tile className="gap-4">
      <Eyebrow>{fr.settings.household}</Eyebrow>

      <Field label={fr.settings.householdName}>
        {(id) => (
          <TextInput
            id={id}
            value={name}
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
            {members.map((member) => (
              <li
                key={member.id}
                className="flex h-14 items-center gap-3 rounded-inner bg-surface-2 px-3"
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
              </li>
            ))}
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
      </div>
    </Tile>
  )
}
