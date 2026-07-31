import { useNavigate } from 'react-router-dom'
import { RECURRENCE_NEW_PATH, recurrencePath } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useCategoryMap, useRecurrenceRows, useSubscriptionTotals } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { Plus, SubscriptionsIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { RecurrenceRow } from './RecurrenceRow'

function Totals() {
  const totals = useSubscriptionTotals('out')
  const currency = useCurrency()
  return (
    <Tile variant="accent" className="mb-4">
      <Eyebrow icon={SubscriptionsIcon}>{fr.recurrences.totalMonthly}</Eyebrow>
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

/**
 * Une section par sens.
 *
 * Un salaire et un abonnement de streaming ne se distinguaient que par le « + »
 * que le DS §3 accorde aux entrées — trop peu dans une liste qui les mêle, et
 * d'autant plus que la pastille prend la teinte de la catégorie et non du sens.
 * Le titre porte le sens, et le total du sens : l'accent de la page, lui, ne
 * compte que les sorties, et il faut que ça se voie.
 */
function DirectionSection({
  direction,
  rows,
  onOpen,
}: {
  direction: 'in' | 'out'
  rows: ReturnType<typeof useRecurrenceRows>
  onOpen: (id: string) => void
}) {
  const totals = useSubscriptionTotals(direction)
  const currency = useCurrency()
  if (rows.length === 0) return null

  return (
    <Tile className="p-2! md:p-2!">
      <div className="mx-1 mt-1 mb-2 flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>{direction === 'in' ? fr.recurrences.inflow : fr.recurrences.outflow}</Eyebrow>
        <span className="t-axis tnum">
          {tpl(fr.recurrences.perMonth, formatMoney(totals.monthly, currency, false))}
        </span>
      </div>
      <RowList rows={rows} onOpen={onOpen} />
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
  const navigate = useNavigate()

  const active = rows.filter((row) => !row.stopped)
  const stopped = rows.filter((row) => row.stopped)

  const openCreate = (): void => {
    void navigate(RECURRENCE_NEW_PATH)
  }

  const openDetail = (id: string): void => {
    void navigate(recurrencePath(id))
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
          {/* Les sorties d'abord : c'est ce que la tuile d'accent chiffre. */}
          <DirectionSection
            direction="out"
            rows={active.filter((row) => row.recurrence.direction === 'out')}
            onOpen={openDetail}
          />
          <DirectionSection
            direction="in"
            rows={active.filter((row) => row.recurrence.direction === 'in')}
            onOpen={openDetail}
          />

          {stopped.length > 0 && (
            <Tile className="p-2! md:p-2!">
              <Eyebrow className="mx-1 mt-1 mb-2">{fr.recurrences.stoppedBadge}</Eyebrow>
              <RowList rows={stopped} onOpen={openDetail} />
            </Tile>
          )}
        </div>
      )}
    </>
  )
}
