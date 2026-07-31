import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDayFull } from '@/i18n/format'
import { useCategoryMap, useMemberMap, useMonthConfirmed } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { ListRow } from '@/ui/ListRow'
import { Tile } from '@/ui/Tile'

/** Le membre en sous-libellé, ou rien : `exactOptionalPropertyTypes` interdit
 *  de passer explicitement `undefined` à une prop optionnelle. */
function memberMeta(
  members: Map<string, { name: string }>,
  entry: Entry,
): { meta?: string } {
  if (entry.memberId === undefined) return {}
  const name = members.get(entry.memberId)?.name
  return name === undefined ? {} : { meta: name }
}

function groupByDay(entries: readonly Entry[]): [string, Entry[]][] {
  const days = new Map<string, Entry[]>()
  for (const entry of entries) {
    const bucket = days.get(entry.date) ?? []
    bucket.push(entry)
    days.set(entry.date, bucket)
  }
  return [...days.entries()]
}

/** Ce qui a réellement eu lieu ce mois-ci, regroupé par jour. */
export function EntriesSection({ onOpen }: { onOpen: (entry: Entry) => void }) {
  const entries = useMonthConfirmed()
  const categories = useCategoryMap()
  const members = useMemberMap()
  if (entries.length === 0) return null

  return (
    <Tile className="flex flex-col gap-3">
      <Eyebrow>{fr.month.entries}</Eyebrow>
      {groupByDay(entries).map(([date, ofDay]) => (
        <section key={date} className="flex flex-col">
          <h3 className="t-axis mb-1 px-3">{formatDayFull(date)}</h3>
          <ul className="flex flex-col">
            {ofDay.map((entry) => (
              <li key={entry.id}>
                <ListRow
                  color={categories.get(entry.categoryId)?.color ?? 'var(--cat-rest)'}
                  label={entry.label}
                  {...memberMeta(members, entry)}
                  trailing={<Amount value={entry.amount} direction={entry.direction} />}
                  onClick={() => {
                    onOpen(entry)
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Tile>
  )
}
