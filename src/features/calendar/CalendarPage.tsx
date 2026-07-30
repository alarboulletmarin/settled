import { useState } from 'react'
import { MonthHeader } from '@/app/MonthHeader'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDate } from '@/i18n/format'
import { useCategoryMap, useMemberMap } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { ListRow } from '@/ui/ListRow'
import { Tile } from '@/ui/Tile'
import { EntrySheet } from '@/features/month/EntrySheet'
import { CalendarGrid } from './CalendarGrid'
import { useCalendarDays } from './useCalendarDays'

/** Les entrées du jour sélectionné. */
function DayPanel({ entries, date, onOpen }: { entries: Entry[]; date: string; onOpen: (e: Entry) => void }) {
  const categories = useCategoryMap()
  const members = useMemberMap()

  return (
    <Tile className="flex flex-col gap-3">
      <Eyebrow>{formatDate(date)}</Eyebrow>
      {entries.length === 0 ? (
        <p className="t-label">{fr.calendar.emptyDay}</p>
      ) : (
        <ul className="flex flex-col">
          {entries.map((entry) => {
            const name = entry.memberId === undefined ? undefined : members.get(entry.memberId)?.name
            return (
              <li key={entry.id}>
                <ListRow
                  color={categories.get(entry.categoryId)?.color ?? 'var(--cat-rest)'}
                  label={entry.label}
                  {...(name === undefined ? {} : { meta: name })}
                  planned={entry.status === 'planned'}
                  trailing={<Amount value={entry.amount} direction={entry.direction} />}
                  onClick={() => { onOpen(entry) }}
                />
              </li>
            )
          })}
        </ul>
      )}
    </Tile>
  )
}

export function CalendarPage() {
  const month = useCalendarDays()
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<Entry | null>(null)

  const hasAny = month.days.some((day) => day.entries.length > 0)
  // La sélection est dérivée, pas synchronisée : un jour d'un autre mois ne se
  // retrouve simplement pas dans la grille, sans effet ni remise à zéro.
  const day = month.days.find((d) => d.date === selected)

  return (
    <>
      <MonthHeader />
      <div className="flex max-w-2xl flex-col gap-4">
        <Tile>
          <CalendarGrid month={month} selected={day?.date ?? null} onSelect={setSelected} />
        </Tile>

        {day !== undefined ? (
          <DayPanel entries={day.entries} date={day.date} onOpen={setEditing} />
        ) : (
          !hasAny && <EmptyState message={fr.calendar.empty} />
        )}
      </div>

      <EntrySheet
        open={editing !== null}
        entry={editing}
        onClose={() => { setEditing(null) }}
      />
    </>
  )
}
