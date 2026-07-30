import { useState } from 'react'
import { MonthHeader } from '@/app/MonthHeader'
import { type ISODate, type YearMonth, startOfMonth, today, ymOf } from '@/domain/date'
import type { Entry } from '@/domain/types'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { fr } from '@/i18n/fr'
import { useCurrentYm, useIsMonthOpened, useMonthEntries } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { Plus } from '@/ui/Icons'
import { EntriesSection } from './EntriesSection'
import { EntrySheet } from './EntrySheet'
import { OpenMonthCard } from './OpenMonthCard'
import { PendingSection } from './PendingSection'

/** La date proposée par défaut : aujourd'hui si on est dans le mois affiché. */
function defaultDateFor(ym: YearMonth): ISODate {
  const now = today()
  return ymOf(now) === ym ? now : startOfMonth(ym)
}

export function MonthPage() {
  const ym = useCurrentYm()
  const entries = useMonthEntries()
  const opened = useIsMonthOpened()
  const [editing, setEditing] = useState<Entry | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const openCreate = (): void => {
    setEditing(null)
    setSheetOpen(true)
  }

  return (
    <>
      <MonthHeader />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <OpenMonthCard />
        <Button onClick={openCreate}>
          <Plus size={18} />
          {fr.entry.add}
        </Button>
      </div>

      {entries.length === 0 && opened ? (
        <EmptyState message={fr.month.empty} actionLabel={fr.entry.add} onAction={openCreate} />
      ) : (
        <div className="flex flex-col gap-4">
          <Dashboard />
          <div className="flex max-w-3xl flex-col gap-4">
            <PendingSection />
            <EntriesSection
              onOpen={(entry) => {
                setEditing(entry)
                setSheetOpen(true)
              }}
            />
          </div>
        </div>
      )}

      <EntrySheet
        open={sheetOpen}
        entry={editing}
        defaultDate={defaultDateFor(ym)}
        onClose={() => {
          setSheetOpen(false)
        }}
      />
    </>
  )
}
