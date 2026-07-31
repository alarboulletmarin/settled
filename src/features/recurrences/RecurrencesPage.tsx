import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RECURRENCE_NEW_PATH, recurrencePath } from '@/app/routes'
import { NO_MEMBER, type RecurrenceGroupBy, groupRecurrences } from '@/domain/grouping'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import {
  useCategoryMap,
  useMemberMap,
  useRecurrenceRows,
  useSubscriptionTotals,
} from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { Disclosure } from '@/ui/Disclosure'
import { useDisclosureGroup } from '@/ui/useDisclosureGroup'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { Plus, SubscriptionsIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { RecurrenceRow } from './RecurrenceRow'

const AXES = [
  { value: 'direction' as const, label: fr.recurrences.bySense },
  { value: 'category' as const, label: fr.recurrences.byCategory },
  { value: 'member' as const, label: fr.recurrences.byMember },
]

/**
 * Par sens, les deux groupes s'ouvrent : c'est la lecture par défaut, et ils
 * ne sont que deux. Par poste ou par personne, ils se replient — c'est un
 * résumé dans lequel on entre, et l'en-tête porte déjà le chiffre.
 */
const OPEN_BY_DEFAULT: Record<RecurrenceGroupBy, boolean> = {
  direction: true,
  category: false,
  member: false,
}

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
 * La liste, regroupée sur l'axe choisi et repliable.
 *
 * Par sens d'abord : un salaire et un abonnement de streaming ne se
 * distinguaient que par le « + » que le DS §3 accorde aux entrées — trop peu
 * dans une liste qui les mêle, et d'autant plus que la pastille prend la teinte
 * de la catégorie et non du sens.
 */
function GroupedList({
  rows,
  onOpen,
}: {
  rows: ReturnType<typeof useRecurrenceRows>
  onOpen: (id: string) => void
}) {
  const categories = useCategoryMap()
  const members = useMemberMap()
  const [by, setBy] = useState<RecurrenceGroupBy>('direction')

  const groups = useMemo(() => groupRecurrences(rows, by), [rows, by])
  const keys = useMemo(() => groups.map((g) => g.key), [groups])
  const disclosure = useDisclosureGroup(keys, OPEN_BY_DEFAULT[by])

  const titleOf = (key: string): string => {
    if (by === 'direction') {
      return key === 'in' ? fr.recurrences.inflow : fr.recurrences.outflow
    }
    if (by === 'category') return categories.get(key)?.label ?? fr.common.other
    return key === NO_MEMBER ? fr.shell.everyone : (members.get(key)?.name ?? fr.common.other)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          options={AXES}
          value={by}
          onChange={(next) => {
            setBy(next)
            disclosure.reset()
          }}
          label={fr.recurrences.groupBy}
        />
        <Button size="sm" variant="ghost" onClick={disclosure.toggleAll}>
          {disclosure.anyOpen ? fr.recurrences.collapseAll : fr.recurrences.expandAll}
        </Button>
      </div>

      <Tile className="flex flex-col gap-1 p-2! md:p-2!">
        {groups.map((group) => (
          <Disclosure
            key={group.key}
            open={disclosure.isOpen(group.key)}
            onOpenChange={(open) => {
              disclosure.setOpen(group.key, open)
            }}
            title={
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="t-body truncate">{titleOf(group.key)}</span>
                <span className="t-axis shrink-0">
                  {tpl(
                    group.rows.length > 1 ? fr.recurrences.groupCount : fr.recurrences.groupCountOne,
                    group.rows.length,
                  )}
                </span>
              </span>
            }
            trailing={
              /* Un groupe dont tout est à montant variable n'a pas de chiffre à
                 montrer : mieux vaut le dire que d'annoncer zéro. */
              group.unknownCount === group.rows.length ? (
                <span className="t-axis">{fr.recurrences.variable}</span>
              ) : (
                <Amount value={group.monthly} size="body" signed />
              )
            }
          >
            <ul className="flex flex-col">
              {group.rows.map((row) => (
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
          </Disclosure>
        ))}
      </Tile>
    </>
  )
}

function StoppedList({
  rows,
  onOpen,
}: {
  rows: ReturnType<typeof useRecurrenceRows>
  onOpen: (id: string) => void
}) {
  const categories = useCategoryMap()
  const keys = useMemo(() => ['stopped'], [])
  const disclosure = useDisclosureGroup(keys, false)

  return (
    <Tile className="p-2! md:p-2!">
      <Disclosure
        open={disclosure.isOpen('stopped')}
        onOpenChange={(open) => {
          disclosure.setOpen('stopped', open)
        }}
        title={
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="t-body truncate">{fr.recurrences.stoppedBadge}</span>
            <span className="t-axis shrink-0">
              {tpl(
                rows.length > 1 ? fr.recurrences.groupCount : fr.recurrences.groupCountOne,
                rows.length,
              )}
            </span>
          </span>
        }
      >
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
      </Disclosure>
    </Tile>
  )
}

export function RecurrencesPage() {
  const rows = useRecurrenceRows()
  const navigate = useNavigate()

  const active = useMemo(() => rows.filter((row) => !row.stopped), [rows])
  const stopped = useMemo(() => rows.filter((row) => row.stopped), [rows])

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
          {active.length > 0 && <GroupedList rows={active} onOpen={openDetail} />}
          {stopped.length > 0 && <StoppedList rows={stopped} onOpen={openDetail} />}
        </div>
      )}
    </>
  )
}
