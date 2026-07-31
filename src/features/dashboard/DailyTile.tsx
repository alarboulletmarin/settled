import { describeDays } from '@/charts/describeDays'
import { StackedBars } from '@/charts/StackedBars'
import type { Money } from '@/domain/money'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useCategoryMap, useDailyBreakdown } from '@/store/selectors'
import { Eyebrow } from '@/ui/Eyebrow'
import { DailyIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/** Dépenses par jour, barres empilées par catégorie. */
export function DailyTile() {
  const days = useDailyBreakdown('out')
  const categories = useCategoryMap()
  const currency = useCurrency()
  const hasSpending = days.some((day) => day.total > 0)

  return (
    <Tile span="6x2" className="gap-3">
      <Eyebrow icon={DailyIcon}>{fr.dashboard.daily}</Eyebrow>
      {hasSpending ? (
        <StackedBars
          days={days}
          colorOf={(id) => categories.get(id)?.color ?? 'var(--cat-rest)'}
          label={fr.dashboard.daily}
          srText={tpl(
            fr.dashboard.srDaily,
            describeDays(days, (cents) => formatMoney(cents as Money, currency, false)),
          )}
        />
      ) : (
        <p className="t-label">{fr.dashboard.noDaily}</p>
      )}
    </Tile>
  )
}
