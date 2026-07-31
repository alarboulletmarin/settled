import { fr } from '@/i18n/fr'
import { formatDateCompact, formatRelativeDays } from '@/i18n/format'
import { useCategoryMap, useUpcoming } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { UpcomingIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'

/** Les cinq prochaines échéances, avec le nombre de jours restants. */
export function UpcomingTile() {
  const upcoming = useUpcoming(5)
  const categories = useCategoryMap()

  return (
    <Tile span="4x2" className="gap-2">
      <Eyebrow icon={UpcomingIcon}>{fr.dashboard.upcoming}</Eyebrow>
      {upcoming.length === 0 ? (
        <p className="t-label">{fr.dashboard.noUpcoming}</p>
      ) : (
        /* `justify-center` sur une liste plus haute que sa boîte la faisait
           déborder des deux côtés : la première ligne passait sous l'eyebrow.
           Ancrée en haut, un débordement éventuel se coupe par le bas, là où
           il ne recouvre rien. */
        <ul className="flex min-h-0 flex-1 flex-col">
          {upcoming.map(({ entry, daysLeft }) => (
            <li key={entry.id} className="flex items-center gap-2 py-0.5">
              <Dot color={categories.get(entry.categoryId)?.color ?? 'var(--cat-rest)'} outlined />
              <span className="t-label min-w-0 flex-1 truncate text-text">{entry.label}</span>
              <span className="t-axis shrink-0">
                {formatDateCompact(entry.date)} · {formatRelativeDays(daysLeft)}
              </span>
              <span className="shrink-0 pl-2">
                <Amount value={entry.amount} direction={entry.direction} size="label" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  )
}
