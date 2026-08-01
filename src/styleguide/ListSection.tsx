import { useState } from 'react'
import { money } from '@/domain/money'
import { fr } from '@/i18n/fr'
import { Amount } from '@/ui/Amount'
import { Chip } from '@/ui/Chip'
import { ListRow } from '@/ui/ListRow'
import { MonthNav } from '@/ui/MonthNav'
import { Tile } from '@/ui/Tile'
import { Section, SubTitle } from './Section'
import { DualTheme } from './ThemePane'

const CHIPS = [
  { id: 'logement', label: 'Logement', color: 'var(--cat-1)' },
  { id: 'courses', label: 'Courses', color: 'var(--cat-2)' },
  { id: 'transport', label: 'Transport', color: 'var(--cat-3)' },
  { id: 'loisirs', label: 'Loisirs', color: 'var(--cat-4)' },
]

function Chips() {
  const [active, setActive] = useState('courses')
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => (
        <Chip
          key={chip.id}
          color={chip.color}
          active={active === chip.id}
          onClick={() => {
            setActive(chip.id)
          }}
        >
          {chip.label}
        </Chip>
      ))}
      <Chip>{fr.common.all}</Chip>
    </div>
  )
}

function Rows() {
  return (
    <Tile className="flex flex-col">
      <ListRow
        color="var(--cat-1)"
        label="Loyer"
        meta="mensuel · le 5"
        trailing={<Amount value={money(95000)} direction="out" />}
      />
      <ListRow
        color="var(--cat-3)"
        label="Salaire"
        meta="mensuel · le 28"
        trailing={<Amount value={money(240000)} direction="in" />}
      />
      <ListRow
        color="var(--cat-4)"
        label="Récurrence musique"
        meta="12/07"
        planned
        trailing={<Amount value={money(1099)} direction="out" />}
      />
    </Tile>
  )
}

function Nav() {
  const [value, setValue] = useState('2026-07')
  return <MonthNav value={value} onChange={setValue} className="max-w-xs" />
}

export function ListSection() {
  return (
    <Section title="Chip · ListRow · MonthNav">
      <SubTitle>Chip</SubTitle>
      <DualTheme>
        <Chips />
      </DualTheme>

      <SubTitle>ListRow</SubTitle>
      <DualTheme>
        <Rows />
      </DualTheme>

      <SubTitle>MonthNav</SubTitle>
      <DualTheme>
        <Nav />
      </DualTheme>
    </Section>
  )
}
