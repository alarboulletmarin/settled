import { useState } from 'react'
import { fr } from '@/i18n/fr'
import { Button, IconButton } from '@/ui/Button'
import { AmountInput, Field, Select, TextInput } from '@/ui/Field'
import { Plus } from '@/ui/Icons'
import { Segmented } from '@/ui/Segmented'
import { Section, SubTitle } from './Section'
import { DualTheme } from './ThemePane'

const DIRECTIONS = [
  { value: 'in' as const, label: fr.direction.in },
  { value: 'out' as const, label: fr.direction.out },
]

function Controls() {
  const [direction, setDirection] = useState<'in' | 'out'>('out')
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button>{fr.common.save}</Button>
        <Button variant="secondary">{fr.common.cancel}</Button>
        <Button variant="ghost">{fr.common.edit}</Button>
        <Button variant="danger">{fr.common.delete}</Button>
        <Button disabled>{fr.common.save}</Button>
        <IconButton label={fr.common.add} variant="primary">
          <Plus />
        </IconButton>
      </div>

      <Segmented
        options={DIRECTIONS}
        value={direction}
        onChange={setDirection}
        label={fr.direction.in}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Libellé">
          {(id, describedBy) => (
            <TextInput id={id} aria-describedby={describedBy} placeholder="Loyer" />
          )}
        </Field>
        <Field label="Montant" hint="En euros">
          {(id, describedBy) => (
            <AmountInput id={id} aria-describedby={describedBy} defaultValue="950,00" />
          )}
        </Field>
        <Field label="Catégorie">
          {(id) => (
            <Select id={id} defaultValue="logement">
              <option value="logement">Logement</option>
              <option value="courses">Courses</option>
            </Select>
          )}
        </Field>
        <Field label="Jour" error="Le mois ne compte que 30 jours.">
          {(id, describedBy) => (
            <TextInput id={id} aria-describedby={describedBy} defaultValue="31" invalid />
          )}
        </Field>
      </div>
    </div>
  )
}

export function ControlsSection() {
  return (
    <Section title="Contrôles" note="Primitives de formulaire, alignées sur les mêmes tokens.">
      <SubTitle>{fr.styleguide.states}</SubTitle>
      <DualTheme>
        <Controls />
      </DualTheme>
    </Section>
  )
}
