import { sum } from '@/domain/money'
import { OTHER_CATEGORY } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatMoney, formatPercent, tpl } from '@/i18n/format'
import { useCategoryBreakdown, useCategoryMap } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { Ring, type RingSegment } from '@/ui/Ring'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

const MAX_LEGEND = 4

/** Répartition par catégorie sur les sorties du mois — le donut du DS §6. */
export function BreakdownTile() {
  const slices = useCategoryBreakdown('out')
  const categories = useCategoryMap()
  const currency = useCurrency()

  const labelOf = (id: string): string =>
    id === OTHER_CATEGORY ? fr.common.other : (categories.get(id)?.label ?? fr.common.other)
  const colorOf = (id: string): string =>
    id === OTHER_CATEGORY ? 'var(--cat-rest)' : (categories.get(id)?.color ?? 'var(--cat-rest)')

  if (slices.length === 0) {
    return (
      <Tile span="2x2" className="justify-between">
        <Eyebrow>{fr.dashboard.breakdown}</Eyebrow>
        <p className="t-label">{fr.dashboard.noBreakdown}</p>
      </Tile>
    )
  }

  const segments: RingSegment[] = slices.map((slice) => ({
    id: slice.categoryId,
    value: slice.share,
    color: colorOf(slice.categoryId),
    label: labelOf(slice.categoryId),
  }))
  const total = sum(slices.map((slice) => slice.total))
  const spoken = slices
    .map((slice) => `${labelOf(slice.categoryId)} ${formatPercent(slice.share)}`)
    .join(', ')

  return (
    <Tile span="2x2" className="gap-3">
      <Eyebrow>{fr.dashboard.breakdown}</Eyebrow>
      <div className="flex min-h-0 flex-1 items-center gap-4">
        <Ring
          size={104}
          thickness={12}
          segments={segments}
          label={fr.dashboard.breakdown}
          srText={tpl(fr.dashboard.srBreakdown, spoken)}
          className="shrink-0"
        >
          <Amount value={total} size="label" direction="out" withCents={false} />
        </Ring>
        <ul className="flex min-w-0 flex-1 flex-col gap-1">
          {slices.slice(0, MAX_LEGEND).map((slice) => (
            <li key={slice.categoryId} className="flex items-center gap-2">
              <Dot color={colorOf(slice.categoryId)} />
              <span className="t-label min-w-0 flex-1 truncate">
                {labelOf(slice.categoryId)}
              </span>
              <span className="t-axis tnum shrink-0">{formatPercent(slice.share)}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="sr-only-text">{formatMoney(total, currency)}</p>
    </Tile>
  )
}
