import { useState } from 'react'
import { useMonthConfirmed } from '@/store/selectors'
import { BentoGrid } from '@/ui/Tile'
import { BalanceTile, ForecastTile, RemainingTile } from './BalanceTiles'
import { BreakdownTile } from './BreakdownTile'
import { CreditsTile } from './CreditsTile'
import { DailyTile } from './DailyTile'
import { ChargesTile, IncomeTile, type ShowFlow } from './FlowTiles'
import { MemberShareTile } from './MemberShareTile'
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
 * La part du foyer les suit immédiatement, parce qu'elle est le troisième terme
 * de la même phrase : sous un filtre, le solde vaut les revenus moins les
 * charges de la personne moins sa part du pot commun, et ce dernier morceau
 * était compris dans les chiffres sans être montré nulle part. Hors filtre,
 * elle s'efface et c'est la Répartition, plus bas, qui montre les parts de
 * tout le monde.
 *
 * La feuille d'explication vit ici, hors de la grille : un `<dialog>` posé
 * parmi les tuiles en occuperait une case tant qu'il est fermé.
 *
 * Les deux tuiles de flux, elles, ne s'expliquent pas : elles mènent aux lignes
 * du mois. C'est la page qui tient cette liste, pas la grille — d'où le relais.
 *
 * Un sens dont rien n'est confirmé n'a aucune ligne à montrer : sa tuile porte
 * quand même un chiffre, qui compte les échéances encore prévues. Elle ne
 * s'ouvre alors pas, plutôt que de mener à une liste où son chiffre n'est pas.
 */
export function Dashboard({ onShowFlow }: { onShowFlow?: ShowFlow }) {
  const [metric, setMetric] = useState<Metric | null>(null)
  const confirmed = useMonthConfirmed()

  const flow = (direction: 'in' | 'out'): { onShow?: ShowFlow } =>
    onShowFlow !== undefined && confirmed.some((entry) => entry.direction === direction)
      ? { onShow: onShowFlow }
      : {}

  return (
    <>
      <BentoGrid>
        <BalanceTile onExplain={setMetric} />
        <IncomeTile {...flow('in')} />
        <ChargesTile {...flow('out')} />
        <MemberShareTile />
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
