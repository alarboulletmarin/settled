import { useState } from 'react'
import type { Category, Direction } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { nextCategoryColor } from '@/persistence/defaults'
import { addCategory, archiveCategory, updateCategory } from '@/store/actions'
import { useCategories } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { CategoriesIcon } from '@/ui/Icons'
import { Field, Select, TextInput } from '@/ui/Field'
import { Tile } from '@/ui/Tile'

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: 'out', label: fr.direction.out },
  { value: 'in', label: fr.direction.in },
]

function Row({ category }: { category: Category }) {
  return (
    <li className="flex h-14 items-center gap-3 rounded-inner bg-surface-2 px-3">
      <Dot color={category.color} outlined={category.archived} />
      <input
        aria-label={fr.settings.categoryName}
        value={category.label}
        maxLength={30}
        onChange={(event) => {
          updateCategory(category.id, { label: event.target.value })
        }}
        className="t-body h-full min-w-0 flex-1 bg-transparent outline-none"
      />
      <span className="t-axis shrink-0">
        {category.direction === 'in' ? fr.direction.in : fr.direction.out}
      </span>
      <Button
        size="sm"
        variant="ghost"
        aria-label={tpl(
          category.archived ? fr.settings.categoryRestore : fr.settings.categoryArchive,
          category.label,
        )}
        onClick={() => {
          archiveCategory(category.id, !category.archived)
        }}
      >
        {category.archived ? fr.settings.restore : fr.settings.archive}
      </Button>
    </li>
  )
}

export function CategoriesSection() {
  const categories = useCategories()
  const [label, setLabel] = useState('')
  const [direction, setDirection] = useState<Direction>('out')
  const active = categories.filter((c) => !c.archived)
  const archived = categories.filter((c) => c.archived)
  const trimmed = label.trim()

  return (
    <Tile className="gap-4">
      <Eyebrow icon={CategoriesIcon}>{fr.settings.categories}</Eyebrow>
      <p className="t-label">{fr.settings.categoriesHint}</p>

      <ul className="flex flex-col gap-1">
        {active.map((category) => (
          <Row key={category.id} category={category} />
        ))}
      </ul>

      {archived.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="t-axis">{fr.settings.categoryArchived}</h3>
          <ul className="flex flex-col gap-1">
            {archived.map((category) => (
              <Row key={category.id} category={category} />
            ))}
          </ul>
        </div>
      )}

      <form
        className="flex flex-wrap items-end gap-2 border-t border-border pt-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (trimmed === '') return
          addCategory({
            label: trimmed,
            icon: '',
            color: nextCategoryColor(categories),
            direction,
          })
          setLabel('')
        }}
      >
        <Field label={fr.settings.categoryName} className="min-w-40 flex-1">
          {(id) => (
            <TextInput
              id={id}
              value={label}
              placeholder={fr.settings.categoryPlaceholder}
              maxLength={30}
              onChange={(event) => {
                setLabel(event.target.value)
              }}
            />
          )}
        </Field>
        <Field label={fr.settings.categoryDirection} className="w-32">
          {(id) => (
            <Select
              id={id}
              value={direction}
              onChange={(event) => {
                setDirection(event.target.value === 'in' ? 'in' : 'out')
              }}
            >
              {DIRECTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Button type="submit" variant="secondary" disabled={trimmed === ''}>
          {fr.settings.categoryAdd}
        </Button>
      </form>
    </Tile>
  )
}
