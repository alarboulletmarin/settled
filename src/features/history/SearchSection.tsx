import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { entryPath, recurrencePath } from '@/app/routes'
import { isSearchable, searchEntries, searchRecurrences } from '@/domain/search'
import { fr } from '@/i18n/fr'
import { formatDate, tpl } from '@/i18n/format'
import { useCategoryMap, useEntries, useRecurrences } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { Field, TextInput } from '@/ui/Field'
import { SearchIcon } from '@/ui/Icons'
import { ListRow } from '@/ui/ListRow'
import { Tile } from '@/ui/Tile'

/**
 * Assez pour répondre, pas assez pour noyer.
 *
 * Une recherche qui rend deux cents lignes ne réduit rien : elle remplace un
 * défilement mois par mois par un défilement d'un seul tenant. Ce qui dépasse
 * est compté et dit — une coupe silencieuse se lirait comme « il n'y a que
 * ça », c'est-à-dire comme une réponse.
 */
const LIMIT = 20

/**
 * Retrouver une ligne sans naviguer mois par mois.
 *
 * Elle vit sur l'historique, et non derrière un sixième onglet — la barre en
 * porte cinq et n'en tient pas six à 320px (DS §5). C'est de toute façon
 * l'écran de la question : « ce prélèvement de mars » est un regard en arrière,
 * et l'historique est ce qu'on ouvre pour en jeter un. Les récurrences y
 * figurent aussi parce que la question suivante est presque toujours la même —
 * est-ce que ça revient tous les mois, et combien.
 *
 * Chaque résultat mène à sa fiche : une recherche qui montre sans laisser
 * ouvrir oblige à retrouver une deuxième fois ce qu'elle vient de trouver.
 */
export function SearchSection() {
  const [query, setQuery] = useState('')
  const entries = useEntries()
  const recurrences = useRecurrences()
  const categories = useCategoryMap()
  const navigate = useNavigate()

  const found = useMemo(
    () => ({
      entries: searchEntries(entries, query, LIMIT),
      recurrences: searchRecurrences(recurrences, query, LIMIT),
    }),
    [entries, recurrences, query],
  )

  const searching = isSearchable(query)
  const nothing =
    searching && found.entries.items.length === 0 && found.recurrences.items.length === 0

  const colorOf = (categoryId: string): string =>
    categories.get(categoryId)?.color ?? 'var(--cat-rest)'

  return (
    <Tile className="gap-4">
      <Eyebrow icon={SearchIcon}>{fr.history.search}</Eyebrow>

      <Field label={fr.history.searchLabel} hint={fr.history.searchHint}>
        {(id) => (
          <TextInput
            id={id}
            type="search"
            value={query}
            placeholder={fr.history.searchPlaceholder}
            maxLength={60}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
          />
        )}
      </Field>

      {nothing && <p className="t-label">{tpl(fr.history.searchEmpty, query.trim())}</p>}

      {found.entries.items.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="t-label font-medium">{fr.history.searchEntries}</span>
          <ul className="flex flex-col">
            {found.entries.items.map((entry) => (
              <li key={entry.id}>
                <ListRow
                  color={colorOf(entry.categoryId)}
                  label={entry.label}
                  meta={formatDate(entry.date)}
                  planned={entry.status === 'planned'}
                  trailing={<Amount value={entry.amount} direction={entry.direction} />}
                  onClick={() => {
                    void navigate(entryPath(entry.id))
                  }}
                />
              </li>
            ))}
          </ul>
          {found.entries.hidden > 0 && (
            <p className="t-label">{tpl(fr.history.searchMore, found.entries.hidden)}</p>
          )}
        </div>
      )}

      {found.recurrences.items.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="t-label font-medium">{fr.history.searchRecurrences}</span>
          <ul className="flex flex-col">
            {found.recurrences.items.map((recurrence) => (
              <li key={recurrence.id}>
                <ListRow
                  color={colorOf(recurrence.categoryId)}
                  label={recurrence.label}
                  meta={
                    recurrence.endedOn === undefined
                      ? (categories.get(recurrence.categoryId)?.label ?? fr.common.other)
                      : fr.recurrences.stoppedBadge
                  }
                  trailing={
                    recurrence.amount === null ? (
                      <span className="t-label">{fr.recurrences.variable}</span>
                    ) : (
                      <Amount value={recurrence.amount} direction={recurrence.direction} />
                    )
                  }
                  onClick={() => {
                    void navigate(recurrencePath(recurrence.id))
                  }}
                />
              </li>
            ))}
          </ul>
          {found.recurrences.hidden > 0 && (
            <p className="t-label">{tpl(fr.history.searchMore, found.recurrences.hidden)}</p>
          )}
        </div>
      )}
    </Tile>
  )
}
