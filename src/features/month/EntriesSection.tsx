import { useEffect, useMemo, useRef, useState } from 'react'
import { type GroupBy, NO_MEMBER, groupEntries } from '@/domain/grouping'
import { sum } from '@/domain/money'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDayFull, tpl } from '@/i18n/format'
import { reveal } from '@/lib/reveal'
import {
  useCategoryMap,
  useMemberFilter,
  useMemberMap,
  useMembers,
  useMonthConfirmed,
} from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { Chip } from '@/ui/Chip'
import { Disclosure } from '@/ui/Disclosure'
import { useDisclosureGroup } from '@/ui/useDisclosureGroup'
import { Eyebrow } from '@/ui/Eyebrow'
import { EntriesIcon } from '@/ui/Icons'
import { ListRow } from '@/ui/ListRow'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'

/** Le sens que la liste montre, ou `null` pour les deux. */
export type FlowFilter = 'in' | 'out' | null

const AXES = [
  { value: 'day' as const, label: fr.month.byDay },
  { value: 'category' as const, label: fr.month.byCategory },
  { value: 'member' as const, label: fr.month.byMember },
]

/* L'axe range, le filtre retire — deux gestes différents, deux commandes
   différentes. La bascule dit sur quoi la liste est rangée, les pilules ce
   qu'elle montre : c'est déjà la règle de l'en-tête du mois, qui filtre par
   membre avec les mêmes pilules. */
const FLOWS: { value: FlowFilter; label: string }[] = [
  { value: null, label: fr.month.showAll },
  { value: 'out', label: fr.month.showOut },
  { value: 'in', label: fr.month.showIn },
]

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

/**
 * Groupé par jour, la liste se lit dans l'ordre où les choses ont eu lieu :
 * elle s'ouvre. Groupée par poste ou par personne, c'est un résumé dans lequel
 * on entre — elle se replie, et l'en-tête porte déjà la réponse.
 */
const OPEN_BY_DEFAULT: Record<GroupBy, boolean> = { day: true, category: false, member: false }

/**
 * Les entrées confirmées du mois, rangées sur un axe et filtrées par sens.
 *
 * Le filtre est tenu par la page, pas ici : les tuiles du tableau de bord le
 * posent aussi. `focus` compte les demandes de défilement venues d'elles — un
 * compteur plutôt qu'un drapeau, sinon redemander le même sens après avoir fait
 * défiler la page ne changerait aucun état, donc ne défilerait pas.
 */
export function EntriesSection({
  flow,
  onFlow,
  focus,
  onOpen,
}: {
  flow: FlowFilter
  onFlow: (flow: FlowFilter) => void
  focus: number
  onOpen: (entry: Entry) => void
}) {
  const confirmed = useMonthConfirmed()
  const categories = useCategoryMap()
  const members = useMemberMap()
  const memberList = useMembers()
  const memberFilter = useMemberFilter()
  const root = useRef<HTMLDivElement>(null)

  /* Regrouper par personne ne rend qu'un seul groupe quand la liste ne montre
     qu'une personne — sous un filtre par membre, elle ne montre que ses lignes
     — ou quand le foyer n'en compte aucune. L'axe ne se propose alors pas :
     c'est une position de plus dans la barre pour une réponse déjà connue. */
  const byMemberSplits = memberList.length > 0 && memberFilter === undefined
  const axes = useMemo(
    () => (byMemberSplits ? AXES : AXES.filter((axis) => axis.value !== 'member')),
    [byMemberSplits],
  )

  const [by, setBy] = useState<GroupBy>('day')
  const entries = useMemo(
    () => (flow === null ? confirmed : confirmed.filter((entry) => entry.direction === flow)),
    [confirmed, flow],
  )
  const groups = useMemo(() => groupEntries(entries, by), [entries, by])
  const keys = useMemo(() => groups.map((g) => g.key), [groups])
  const disclosure = useDisclosureGroup(keys, OPEN_BY_DEFAULT[by])

  // Une demande venue d'une tuile : la section vient sous les yeux.
  useEffect(() => {
    if (focus === 0) return
    reveal(root.current)
  }, [focus])

  /* L'axe courant peut cesser d'être proposé — il suffit d'activer un filtre
     par membre. On retombe alors sur le jour, plutôt que de laisser la barre
     sans position active. Ajusté au rendu : React relance aussitôt, rien ne
     s'affiche entre les deux. */
  if (!axes.some((axis) => axis.value === by)) {
    setBy('day')
    disclosure.reset()
  }

  if (confirmed.length === 0) return null

  const titleOf = (key: string): string => {
    if (by === 'day') return formatDayFull(key)
    if (by === 'category') return categories.get(key)?.label ?? fr.common.other
    return key === NO_MEMBER ? fr.shell.everyone : (members.get(key)?.name ?? fr.common.other)
  }

  return (
    <div ref={root} className="scroll-mt-4">
      <Tile className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow icon={EntriesIcon}>{fr.month.entries}</Eyebrow>
          <Button size="sm" variant="ghost" onClick={disclosure.toggleAll}>
            {disclosure.anyOpen ? fr.month.collapseAll : fr.month.expandAll}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Segmented
            options={axes}
            value={by}
            onChange={(next) => {
              setBy(next)
              disclosure.reset()
            }}
            label={fr.month.groupBy}
          />
          <div role="group" aria-label={fr.month.show} className="flex flex-wrap gap-2">
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
        </div>

        {/* Hors filtre, ce total est celui de la tuile « Solde du mois », au
            même calcul près : le redire ici en ferait une seconde vérité. Sous
            filtre, en revanche, aucune tuile ne le porte — celle des charges
            compte les échéances encore prévues, que cette liste n'a pas. */}
        {flow !== null && entries.length > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="t-axis">
              {tpl(
                entries.length > 1 ? fr.month.groupCount : fr.month.groupCountOne,
                entries.length,
              )}
            </span>
            <Amount value={sum(groups.map((group) => group.total))} size="label" signed />
          </div>
        )}

        {/* Un filtre peut ne rien laisser, alors que le mois n'est pas vide :
            le dire, plutôt que de laisser une tuile qui semble s'être cassée. */}
        {entries.length === 0 && (
          <p className="t-label">
            {flow === 'in' ? fr.month.showEmptyIn : fr.month.showEmptyOut}
          </p>
        )}

        <div className="flex flex-col gap-1">
          {groups.map((group) => (
            <Disclosure
              key={group.key}
              open={disclosure.isOpen(group.key)}
              onOpenChange={(open) => {
                disclosure.setOpen(group.key, open)
              }}
              title={
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className={by === 'day' ? 't-axis truncate' : 't-body truncate'}>
                    {titleOf(group.key)}
                  </span>
                  <span className="t-axis shrink-0">
                    {tpl(
                      group.entries.length > 1 ? fr.month.groupCount : fr.month.groupCountOne,
                      group.entries.length,
                    )}
                  </span>
                </span>
              }
              trailing={<Amount value={group.total} size="body" signed />}
            >
              <ul className="flex flex-col">
                {group.entries.map((entry) => (
                  <li key={entry.id}>
                    <ListRow
                      color={categories.get(entry.categoryId)?.color ?? 'var(--cat-rest)'}
                      label={entry.label}
                      {...(by === 'member' ? {} : memberMeta(members, entry))}
                      trailing={<Amount value={entry.amount} direction={entry.direction} />}
                      onClick={() => {
                        onOpen(entry)
                      }}
                    />
                  </li>
                ))}
              </ul>
            </Disclosure>
          ))}
        </div>
      </Tile>
    </div>
  )
}
