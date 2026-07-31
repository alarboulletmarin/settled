import { useState } from 'react'
import { BentoGrid } from '@/ui/Tile'
import { BalanceTile, ForecastTile, RemainingTile } from './BalanceTiles'
import { BreakdownTile } from './BreakdownTile'
import { CreditsTile } from './CreditsTile'
import { DailyTile } from './DailyTile'
import { type MetricKey, MetricInfo } from './MetricInfo'
import { SavingTile } from './SavingTile'
import { SplitTile } from './SplitTile'
import { SubscriptionsTile } from './SubscriptionsTile'
import { UpcomingTile } from './UpcomingTile'

/**
 * La grille bento du DS §5. L'ordre compte : le flux dense range les 2×1 dans
 * la demi-hauteur laissée libre par les 2×2, ce qui donne la colonne centrale
 * du schéma.
 *
 * La feuille d'explication vit ici, hors de la grille : un `<dialog>` posé
 * parmi les tuiles en occuperait une case tant qu'il est fermé.
 */
export function Dashboard() {
  const [metric, setMetric] = useState<MetricKey | null>(null)
  const explain = (key: MetricKey) => () => {
    setMetric(key)
  }

  return (
    <>
      <BentoGrid>
        <BalanceTile onExplain={explain('balance')} />
        <ForecastTile onExplain={explain('forecast')} />
        <BreakdownTile />
        <RemainingTile onExplain={explain('remaining')} />
        <SavingTile onExplain={explain('capacity')} />
        <SplitTile />
        <UpcomingTile />
        <SubscriptionsTile />
        <CreditsTile />
        <DailyTile />
      </BentoGrid>

      <MetricInfo
        metric={metric}
        onClose={() => {
          setMetric(null)
        }}
      />
    </>
  )
}
