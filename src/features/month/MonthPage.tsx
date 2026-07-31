import { useState } from 'react'
import { MonthHeader } from '@/app/MonthHeader'
import type { Entry } from '@/domain/types'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { fr } from '@/i18n/fr'
import { useCurrentYm, useMonthEntries } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { Plus } from '@/ui/Icons'
import { EntriesSection } from './EntriesSection'
import { EntrySheet } from './EntrySheet'
import { defaultDateFor } from './defaultDate'
import { OpenMonthNotice, RegenerateEntriesButton } from './OpenMonth'
import { PendingSection } from './PendingSection'

export function MonthPage() {
  const ym = useCurrentYm()
  const entries = useMonthEntries()
  const [editing, setEditing] = useState<Entry | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const openCreate = (): void => {
    setEditing(null)
    setSheetOpen(true)
  }

  const isEmpty = entries.length === 0

  return (
    <>
      <h1 className="sr-only">{fr.month.title}</h1>
      <MonthHeader />

      <OpenMonthNotice />

      {/* Mois vide, toutes les actions vivent dans l'état vide : les répéter
          au-dessus afficherait deux fois « Ajouter une dépense » d'un coup
          d'œil, et laisserait la régénération seule au sommet de l'écran. */}
      {!isEmpty && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button onClick={openCreate}>
            <Plus size={18} />
            {fr.entry.add}
          </Button>
          <RegenerateEntriesButton />
        </div>
      )}

      {isEmpty ? (
        <EmptyState message={fr.month.empty} actionLabel={fr.entry.add} onAction={openCreate}>
          <RegenerateEntriesButton />
        </EmptyState>
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
