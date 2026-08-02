import { useState } from 'react'
import { fr } from '@/i18n/fr'
import { Button } from '@/ui/Button'
import { Field, TextInput } from '@/ui/Field'

/**
 * Première étape : le nom du foyer. Elle ne peut pas être sautée (cahier §4.1).
 *
 * Le nom est porté par la page et non par ce composant : l'aperçu posé à côté
 * le lit à chaque frappe, et deux états qui décrivent la même saisie auraient
 * fini par diverger d'un caractère. `touched`, lui, ne regarde que le
 * formulaire — il reste ici.
 */
export function HouseholdStep({
  name,
  onChange,
  onSubmit,
}: {
  name: string
  onChange: (name: string) => void
  onSubmit: (name: string) => void
}) {
  const [touched, setTouched] = useState(false)
  const trimmed = name.trim()
  const invalid = touched && trimmed.length === 0

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        setTouched(true)
        if (trimmed.length > 0) onSubmit(trimmed)
      }}
    >
      <div className="flex flex-col gap-2">
        <h1 className="t-section">{fr.onboarding.householdTitle}</h1>
        <p className="t-label">{fr.onboarding.householdHint}</p>
      </div>

      <Field
        label={fr.onboarding.householdLabel}
        required
        {...(invalid ? { error: fr.onboarding.householdEmpty } : {})}
      >
        {(id, describedBy) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            value={name}
            invalid={invalid}
            placeholder={fr.onboarding.householdPlaceholder}
            autoFocus
            maxLength={40}
            onChange={(event) => {
              onChange(event.target.value)
            }}
          />
        )}
      </Field>

      <Button type="submit" full>
        {fr.common.next}
      </Button>
    </form>
  )
}
