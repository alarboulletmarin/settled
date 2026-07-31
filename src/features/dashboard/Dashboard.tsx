import { BentoGrid } from '@/ui/Tile'
import { BalanceTile, ForecastTile, RemainingTile } from './BalanceTiles'
import { BreakdownTile } from './BreakdownTile'
import { CreditsTile } from './CreditsTile'
import { DailyTile } from './DailyTile'
import { SavingTile } from './SavingTile'
import { SubscriptionsTile } from './SubscriptionsTile'
import { UpcomingTile } from './UpcomingTile'

/**
 * La grille bento du DS §5. L'ordre compte : le flux dense range les 2×1 dans
 * la demi-hauteur laissée libre par les 2×2, ce qui donne la colonne centrale
 * du schéma.
 */
export function Dashboard() {
  return (
    <BentoGrid>
      <BalanceTile />
      <ForecastTile />
      <BreakdownTile />
      <RemainingTile />
      <SavingTile />
      <UpcomingTile />
      <SubscriptionsTile />
      <CreditsTile />
      <DailyTile />
    </BentoGrid>
  )
}
