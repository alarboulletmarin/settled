import { useState } from 'react'
import type { Category, CategoryKind } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { addCategory, addFamily, archiveCategory, renameFamily, updateCategory } from '@/store/actions'
import { useAllCategoriesByFamily, useFamilies } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { Field, Select, TextInput } from '@/ui/Field'
import { CategoriesIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'

const KINDS: { value: CategoryKind; label: string }[] = [
  { value: 'charge', label: fr.kinds.charge },
  { value: 'resource', label: fr.kinds.resource },
  { value: 'debt', label: fr.kinds.debt },
  { value: 'saving', label: fr.kinds.saving },
]

function Row({ category }: { category: Category }) {
  return (
    <li className="flex h-14 items-center gap-3 rounded-inner bg-surface-2 px-3">
      <Dot color={category.color} outlined={category.archived} />
      <input
        aria-label={fr.settings.categoryName}
        value={category.label}
        maxLength={40}
        onChange={(event) => {
          updateCategory(category.id, { label: event.target.value })
        }}
        className="t-body h-full min-w-0 flex-1 bg-transparent outline-none"
      />
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

/**
 * Une famille et ses catégories. Le sens n'apparaît plus sur chaque ligne : il
 * découle de la nature de la famille, qui est écrite une fois au-dessus.
 */
function FamilyBlock({
  id,
  label,
  kind,
  categories,
}: {
  id: string
  label: string
  kind: CategoryKind
  categories: Category[]
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          aria-label={fr.settings.familyName}
          value={label}
          maxLength={40}
          onChange={(event) => {
            renameFamily(id, event.target.value)
          }}
          className="t-body min-w-0 flex-1 bg-transparent font-medium outline-none"
        />
        <span className="t-axis shrink-0">{fr.kinds[kind]}</span>
      </div>
      {categories.length > 0 && (
        <ul className="flex flex-col gap-1">
          {categories.map((category) => (
            <Row key={category.id} category={category} />
          ))}
        </ul>
      )}
    </section>
  )
}

function AddCategory({ familyIds }: { familyIds: { id: string; label: string }[] }) {
  const [label, setLabel] = useState('')
  const [familyId, setFamilyId] = useState(familyIds[0]?.id ?? '')
  const trimmed = label.trim()

  return (
    <form
      className="flex flex-wrap items-end gap-2 border-t border-border pt-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed === '' || familyId === '') return
        addCategory({ label: trimmed, familyId, icon: '' })
        setLabel('')
      }}
    >
      <Field label={fr.settings.categoryName} className="min-w-40 flex-1">
        {(id) => (
          <TextInput
            id={id}
            value={label}
            placeholder={fr.settings.categoryPlaceholder}
            maxLength={40}
            onChange={(event) => {
              setLabel(event.target.value)
            }}
          />
        )}
      </Field>
      {/* La famille porte le sens et la teinte : les redemander serait leur
          offrir l'occasion de diverger d'elle. */}
      <Field label={fr.settings.familyOf} className="min-w-40 flex-1">
        {(id) => (
          <Select
            id={id}
            value={familyId}
            onChange={(event) => {
              setFamilyId(event.target.value)
            }}
          >
            {familyIds.map((family) => (
              <option key={family.id} value={family.id}>
                {family.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Button type="submit" variant="secondary" disabled={trimmed === '' || familyId === ''}>
        {fr.settings.categoryAdd}
      </Button>
    </form>
  )
}

function AddFamily() {
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState<CategoryKind>('charge')
  const trimmed = label.trim()

  return (
    <form
      className="flex flex-wrap items-end gap-2 border-t border-border pt-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed === '') return
        addFamily({ label: trimmed, kind })
        setLabel('')
      }}
    >
      <Field label={fr.settings.familyName} className="min-w-40 flex-1">
        {(id) => (
          <TextInput
            id={id}
            value={label}
            placeholder={fr.settings.familyPlaceholder}
            maxLength={40}
            onChange={(event) => {
              setLabel(event.target.value)
            }}
          />
        )}
      </Field>
      <Field label={fr.settings.familyKind} className="min-w-40 flex-1">
        {(id) => (
          <Select
            id={id}
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as CategoryKind)
            }}
          >
            {KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Button type="submit" variant="secondary" disabled={trimmed === ''}>
        {fr.settings.familyAdd}
      </Button>
    </form>
  )
}

export function CategoriesSection() {
  const groups = useAllCategoriesByFamily()
  const families = useFamilies()

  return (
    <Tile className="gap-4">
      <Eyebrow icon={CategoriesIcon}>{fr.settings.categories}</Eyebrow>
      <p className="t-label">{fr.settings.categoriesHint}</p>

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <FamilyBlock
            key={group.family.id}
            id={group.family.id}
            label={group.family.label}
            kind={group.family.kind}
            categories={group.categories}
          />
        ))}
      </div>

      <AddCategory familyIds={families.map((f) => ({ id: f.id, label: f.label }))} />
      <AddFamily />
    </Tile>
  )
}
