import { useState } from 'react'
import { BentoGrid } from '@/ui/Tile'
import { BalanceTile, ForecastTile, RemainingTile } from './BalanceTiles'
import { BreakdownTile } from './BreakdownTile'
import { CreditsTile } from './CreditsTile'
import { DailyTile } from './DailyTile'
import { ChargesTile, IncomeTile } from './FlowTiles'
import { type Metric, MetricInfo } from './MetricInfo'
import { SavingTile } from './SavingTile'
import { SplitTile } from './SplitTile'
import { SubscriptionsTile } from './SubscriptionsTile'
import { UpcomingTile } from './UpcomingTile'

/**
 * La grille bento du DS §5. L'ordre compte : le flux dense range les 2×1 dans
 * la demi-hauteur laissée libre par les 2×2, ce qui donne la colonne centrale
 * du schéma.
 *
 * Ce qui rentre et ce qui se paie viennent juste après le solde, avant les deux
 * lectures qui les combinent : c'est la première question qu'on pose au mois —
 * combien j'ai gagné, combien je paie — et elle passait derrière trois soldes
 * qui n'y répondent qu'indirectement.
 *
 * La feuille d'explication vit ici, hors de la grille : un `<dialog>` posé
 * parmi les tuiles en occuperait une case tant qu'il est fermé.
 */
export function Dashboard() {
  const [metric, setMetric] = useState<Metric | null>(null)

  return (
    <>
      <BentoGrid>
        <BalanceTile onExplain={setMetric} />
        <IncomeTile onExplain={setMetric} />
        <ChargesTile onExplain={setMetric} />
        <BreakdownTile />
        <ForecastTile onExplain={setMetric} />
        <RemainingTile onExplain={setMetric} />
        <SavingTile onExplain={setMetric} />
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
