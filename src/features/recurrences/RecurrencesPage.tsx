import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CREDITS_PATH, RECURRENCE_NEW_PATH, recurrencePath } from '@/app/routes'
import { NO_MEMBER, type RecurrenceGroupBy, groupRecurrences } from '@/domain/grouping'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import {
  useCategoryMap,
  useMemberMap,
  useRecurrenceRows,
  useRecurrenceTotals,
} from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { Chip } from '@/ui/Chip'
import { Disclosure } from '@/ui/Disclosure'
import { useDisclosureGroup } from '@/ui/useDisclosureGroup'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { Plus, RecurrencesIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { RecurrenceRow } from './RecurrenceRow'

const AXES = [
  { value: 'category' as const, label: fr.recurrences.byCategory },
  { value: 'member' as const, label: fr.recurrences.byMember },
]

/** Le sens que la liste montre, ou `null` pour les deux. */
type FlowFilter = 'in' | 'out' | null

/* L'axe range, le filtre retire — deux gestes différents, deux commandes
   différentes. C'est déjà la règle de la liste du mois, et les mots sont les
   siens : le sens y était un axe qui rendait deux blocs dont le total en tête
   de page donne les chiffres, alors qu'en filtre il se combine aux deux axes
   qui restent. */
const FLOWS: { value: FlowFilter; label: string }[] = [
  { value: null, label: fr.recurrences.showAll },
  { value: 'out', label: fr.recurrences.showOut },
  { value: 'in', label: fr.recurrences.showIn },
]

/**
 * Les groupes se replient : c'est un résumé dans lequel on entre, et l'en-tête
 * porte déjà le chiffre.
 */
const OPEN_BY_DEFAULT: Record<RecurrenceGroupBy, boolean> = {
  category: false,
  member: false,
}

/**
 * Ce que les récurrences coûtent — ou rapportent — chaque mois.
 *
 * Le chiffre suit la pastille : câblé sur les seules sorties, il décrivait mal
 * la liste qu'il surplombe dès qu'elle montrait les revenus. Hors filtre, il
 * reste celui des charges — c'est la question qu'on pose à cet écran, et un
 * solde des deux sens ne se lit pas en tête de page.
 */
function Totals({ flow }: { flow: FlowFilter }) {
  const income = flow === 'in'
  const totals = useRecurrenceTotals(income ? 'in' : 'out')
  const currency = useCurrency()
  const label =
    flow === null
      ? fr.recurrences.totalMonthly
      : income
        ? fr.recurrences.totalIncome
        : fr.recurrences.totalCharges

  return (
    <Tile variant="accent" className="mb-4">
      <Eyebrow icon={RecurrencesIcon}>{label}</Eyebrow>
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
 * La liste, rangée sur l'axe choisi, filtrée par sens, et repliable.
 *
 * Un salaire et un abonnement de streaming ne se distinguent que par le « + »
 * que le DS §3 accorde aux entrées — trop peu dans une liste qui les mêle,
 * d'autant que la pastille prend la teinte de la catégorie et non du sens.
 * C'est le filtre qui répond à ça, et non plus deux blocs figés : il retire ce
 * qu'on ne regarde pas au lieu de le ranger à côté, et il se combine aux deux
 * axes plutôt que de leur prendre une position.
 */
function GroupedList({
  rows,
  flow,
  onFlow,
  onOpen,
}: {
  rows: ReturnType<typeof useRecurrenceRows>
  flow: FlowFilter
  onFlow: (flow: FlowFilter) => void
  onOpen: (id: string) => void
}) {
  const categories = useCategoryMap()
  const members = useMemberMap()
  const [by, setBy] = useState<RecurrenceGroupBy>('category')

  const shown = useMemo(
    () => (flow === null ? rows : rows.filter((row) => row.recurrence.direction === flow)),
    [rows, flow],
  )
  const groups = useMemo(() => groupRecurrences(shown, by), [shown, by])
  const keys = useMemo(() => groups.map((g) => g.key), [groups])
  const disclosure = useDisclosureGroup(keys, OPEN_BY_DEFAULT[by])

  const titleOf = (key: string): string => {
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

      <div role="group" aria-label={fr.recurrences.show} className="flex flex-wrap gap-2">
        {FLOWS.map((option) => (
          <Chip
            key={option.label}
            active={option.value === flow}
            onClick={() => {
              onFlow(option.value)
            }}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {/* Un filtre peut ne rien laisser, alors que la page n'est pas vide : le
          dire, plutôt que de poser une tuile vide qui semble s'être cassée. */}
      {shown.length === 0 ? (
        <p className="t-label">
          {flow === 'in' ? fr.recurrences.showEmptyIn : fr.recurrences.showEmptyOut}
        </p>
      ) : (
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
      )}
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

  /* Le sens vit sur la page et non dans la liste : le total en tête le suit
     aussi, et deux états séparés les feraient annoncer deux choses. */
  const [flow, setFlow] = useState<FlowFilter>(null)

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
          <Totals flow={flow} />
          {active.length > 0 && (
            <GroupedList rows={active} flow={flow} onFlow={setFlow} onOpen={openDetail} />
          )}
          {stopped.length > 0 && <StoppedList rows={stopped} onOpen={openDetail} />}
        </div>
      )}

      {/* Hors du branchement : sans récurrence non plus, on n'avait aucun
          chemin vers les crédits — et un crédit s'enregistre très bien avant
          la récurrence qui le rembourse. Le lien est un bloc et non un mot dans
          la phrase : dans le fil du texte, sa cible tombe à dix-huit pixels. */}
      <div className="mt-4 flex max-w-3xl flex-col">
        <p className="t-label">{fr.recurrences.creditsHint}</p>
        <Link
          to={CREDITS_PATH}
          className="t-label inline-flex min-h-11 w-fit items-center rounded-input underline underline-offset-2"
        >
          {fr.credits.title}
        </Link>
      </div>
    </>
  )
}
