import { useMemo, useState } from 'react'
import { isSearchable, matchesText, normalizeText } from '@/domain/search'
import type { Category, CategoryKind } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { addCategory, addFamily, archiveCategory, renameFamily, updateCategory } from '@/store/actions'
import { useAllCategoriesByFamily, useFamilies } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { Disclosure } from '@/ui/Disclosure'
import { useDisclosureGroup } from '@/ui/useDisclosureGroup'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { Field, Select, TextInput } from '@/ui/Field'
import { CategoriesIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useDraftField } from '@/ui/useDraftField'

const KINDS: { value: CategoryKind; label: string }[] = [
  { value: 'charge', label: fr.kinds.charge },
  { value: 'resource', label: fr.kinds.resource },
  { value: 'debt', label: fr.kinds.debt },
  { value: 'saving', label: fr.kinds.saving },
]

function Row({ category }: { category: Category }) {
  const draft = useDraftField(category.label, (next) => {
    updateCategory(category.id, { label: next })
  })

  return (
    <li className="flex h-14 items-center gap-3 rounded-inner bg-surface-2 px-3">
      <Dot color={category.color} outlined={category.archived} />
      <input
        aria-label={fr.settings.categoryName}
        maxLength={40}
        {...draft}
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
 *
 * Repliée par défaut : le catalogue compte onze familles et trente-huit
 * catégories, soit un écran de réglages qu'on parcourt au doigt pendant dix
 * secondes avant d'atteindre le thème. Replié, il tient en onze lignes.
 *
 * Le nom de la famille se modifie à l'intérieur, pas dans l'en-tête : un champ
 * de saisie dans un `<summary>` se replie à chaque espace qu'on y tape.
 */
function FamilyBlock({
  id,
  label,
  kind,
  categories,
  open,
  onOpenChange,
}: {
  id: string
  label: string
  kind: CategoryKind
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const draft = useDraftField(label, (next) => {
    renameFamily(id, next)
  })

  return (
    <Disclosure
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="t-body truncate font-medium">{label}</span>
          <span className="t-axis shrink-0">
            {tpl(
              categories.length > 1 ? fr.settings.familyCount : fr.settings.familyCountOne,
              categories.length,
            )}
          </span>
        </span>
      }
      trailing={<span className="t-axis">{fr.kinds[kind]}</span>}
    >
      <div className="flex flex-col gap-2 pt-2 pl-6">
        <Field label={fr.settings.familyName}>
          {(fieldId) => <TextInput id={fieldId} maxLength={40} {...draft} />}
        </Field>
        {categories.length > 0 && (
          <ul className="flex flex-col gap-1">
            {categories.map((category) => (
              <Row key={category.id} category={category} />
            ))}
          </ul>
        )}
      </div>
    </Disclosure>
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
  const keys = useMemo(() => groups.map((g) => g.family.id), [groups])
  const disclosure = useDisclosureGroup(keys, false)
  const [query, setQuery] = useState('')
  const searching = isSearchable(query)

  /* Une famille apparaît si son nom apparie — elle garde alors toutes ses
     catégories, c'est elle qu'on cherchait — ou si l'une de ses catégories
     apparie, et elle se réduit à celles-là. */
  const shown = useMemo(() => {
    if (!searching) return groups
    const needle = normalizeText(query)
    return groups
      .map((group) =>
        matchesText(group.family.label, needle)
          ? group
          : { ...group, categories: group.categories.filter((c) => matchesText(c.label, needle)) },
      )
      .filter((group) => group.categories.length > 0)
  }, [groups, query, searching])

  return (
    <Tile className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow icon={CategoriesIcon}>{fr.settings.categories}</Eyebrow>
        {/* Pendant une recherche, tout ce qui reste est déjà ouvert : le bouton
            dirait « tout replier » pour un geste sans effet visible. */}
        {!searching && (
          <Button size="sm" variant="ghost" onClick={disclosure.toggleAll}>
            {disclosure.anyOpen ? fr.settings.collapseAll : fr.settings.expandAll}
          </Button>
        )}
      </div>
      <p className="t-label">{fr.settings.categoriesHint}</p>

      {/* Quarante-six catégories sous onze familles repliées : retrouver
          « Carburant » demandait de deviner qu'elle est rangée sous Transport,
          et d'ouvrir les familles une par une jusqu'à tomber dessus. */}
      <Field label={fr.settings.categorySearch}>
        {(id) => (
          <TextInput
            id={id}
            type="search"
            value={query}
            placeholder={fr.settings.categorySearchPlaceholder}
            maxLength={40}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
          />
        )}
      </Field>

      {searching && shown.length === 0 ? (
        <p className="t-label">{tpl(fr.settings.categorySearchEmpty, query.trim())}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {shown.map((group) => (
            <FamilyBlock
              key={group.family.id}
              id={group.family.id}
              label={group.family.label}
              kind={group.family.kind}
              categories={group.categories}
              /* Un résultat de recherche est ouvert par définition — sinon la
                 recherche rendrait onze en-têtes à ouvrir un par un, ce qu'elle
                 existe pour éviter. L'état de repli n'est pas touché pour
                 autant : effacer la recherche retrouve les sections telles
                 qu'on les avait laissées. */
              open={searching || disclosure.isOpen(group.family.id)}
              onOpenChange={(open) => {
                disclosure.setOpen(group.family.id, open)
              }}
            />
          ))}
        </div>
      )}

      <AddCategory familyIds={families.map((f) => ({ id: f.id, label: f.label }))} />
      <AddFamily />
    </Tile>
  )
}
