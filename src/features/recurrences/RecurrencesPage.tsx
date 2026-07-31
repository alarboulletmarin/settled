import { useState } from 'react'
import type { Recurrence } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useCategoryMap, useRecurrenceRows, useSubscriptionTotals } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { Plus } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { RecurrenceDetail } from './RecurrenceDetail'
import { RecurrenceRow } from './RecurrenceRow'
import { RecurrenceSheet } from './RecurrenceSheet'

function Totals() {
  const totals = useSubscriptionTotals()
  const currency = useCurrency()
  return (
    <Tile variant="accent" className="mb-4">
      <Eyebrow>{fr.recurrences.totalMonthly}</Eyebrow>
      <Amount value={totals.monthly} size="tile" className="mt-3" />
      <p className="t-label mt-1 tnum">
        {tpl(fr.recurrences.perYear, formatMoney(totals.annual, currency, false))}
      </p>
      {totals.unknownCount > 0 && (
        <p className="t-label mt-1">
          {tpl(
            fr.recurrences.unknownAmounts,
            totals.unknownCount,
            totals.unknownCount > 1 ? 's' : '',
          )}
        </p>
      )}
    </Tile>
  )
}

function RowList({
  rows,
  onOpen,
}: {
  rows: ReturnType<typeof useRecurrenceRows>
  onOpen: (id: string) => void
}) {
  const categories = useCategoryMap()
  return (
    <ul className="flex flex-col">
      {rows.map((row) => (
        <li key={row.recurrence.id}>
          <RecurrenceRow
            row={row}
            color={categories.get(row.recurrence.categoryId)?.color ?? 'var(--cat-rest)'}
            onOpen={() => {
              onOpen(row.recurrence.id)
            }}
          />
        </li>
      ))}
    </ul>
  )
}

export function RecurrencesPage() {
  const rows = useRecurrenceRows()
  const [editing, setEditing] = useState<Recurrence | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const active = rows.filter((row) => !row.stopped)
  const stopped = rows.filter((row) => row.stopped)
  const detail = rows.find((row) => row.recurrence.id === detailId) ?? null

  const openCreate = (): void => {
    setEditing(null)
    setSheetOpen(true)
  }

  return (
    <>
      {/* L'état vide porte déjà le même bouton : le garder en titre l'affiche
          deux fois dans le même écran. */}
      <PageTitle title={fr.recurrences.title}>
        {rows.length > 0 && (
          <Button onClick={openCreate}>
            <Plus size={18} />
            {fr.common.add}
          </Button>
        )}
      </PageTitle>

      {rows.length === 0 ? (
        <EmptyState
          message={fr.recurrences.empty}
          actionLabel={fr.recurrences.add}
          onAction={openCreate}
        />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <Totals />
          <Tile className="p-2! md:p-2!">
            <RowList rows={active} onOpen={setDetailId} />
          </Tile>

          {stopped.length > 0 && (
            <Tile className="p-2! md:p-2!">
              <Eyebrow className="mx-1 mt-1 mb-2">{fr.recurrences.stoppedBadge}</Eyebrow>
              <RowList rows={stopped} onOpen={setDetailId} />
            </Tile>
          )}
        </div>
      )}

      <RecurrenceDetail
        row={detail}
        onClose={() => {
          setDetailId(null)
        }}
        onEdit={(recurrence) => {
          setDetailId(null)
          setEditing(recurrence)
          setSheetOpen(true)
        }}
      />

      <RecurrenceSheet
        open={sheetOpen}
        recurrence={editing}
        onClose={() => {
          setSheetOpen(false)
        }}
      />
    </>
  )
}
