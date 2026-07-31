import { useMemo, useState } from 'react'
import { type GroupBy, NO_MEMBER, groupEntries } from '@/domain/grouping'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDayFull, tpl } from '@/i18n/format'
import { useCategoryMap, useMemberMap, useMonthConfirmed } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { Disclosure } from '@/ui/Disclosure'
import { useDisclosureGroup } from '@/ui/useDisclosureGroup'
import { Eyebrow } from '@/ui/Eyebrow'
import { EntriesIcon } from '@/ui/Icons'
import { ListRow } from '@/ui/ListRow'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'

const AXES = [
  { value: 'day' as const, label: fr.month.byDay },
  { value: 'category' as const, label: fr.month.byCategory },
  { value: 'member' as const, label: fr.month.byMember },
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

export function EntriesSection({ onOpen }: { onOpen: (entry: Entry) => void }) {
  const entries = useMonthConfirmed()
  const categories = useCategoryMap()
  const members = useMemberMap()
  const [by, setBy] = useState<GroupBy>('day')

  const groups = useMemo(() => groupEntries(entries, by), [entries, by])
  const keys = useMemo(() => groups.map((g) => g.key), [groups])
  const disclosure = useDisclosureGroup(keys, OPEN_BY_DEFAULT[by])

  if (entries.length === 0) return null

  const titleOf = (key: string): string => {
    if (by === 'day') return formatDayFull(key)
    if (by === 'category') return categories.get(key)?.label ?? fr.common.other
    return key === NO_MEMBER ? fr.shell.everyone : (members.get(key)?.name ?? fr.common.other)
  }

  return (
    <Tile className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow icon={EntriesIcon}>{fr.month.entries}</Eyebrow>
        <Button size="sm" variant="ghost" onClick={disclosure.toggleAll}>
          {disclosure.anyOpen ? fr.month.collapseAll : fr.month.expandAll}
        </Button>
      </div>

      <Segmented
        options={AXES}
        value={by}
        onChange={(next) => {
          setBy(next)
          disclosure.reset()
        }}
        label={fr.month.groupBy}
        className="self-start"
      />

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
  )
}
