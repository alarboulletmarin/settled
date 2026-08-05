import { useState } from 'react'
import { useIsCommonFilter, useIsCurrentMonth, useKindOf, useMonthConfirmed } from '@/store/selectors'
import { kindsOfNature } from '@/ui/categoryKinds'
import { BentoGrid } from '@/ui/Tile'
import { BalanceTile, ForecastTile, RemainingTile } from './BalanceTiles'
import { BreakdownTile, type ShowFamily } from './BreakdownTile'
import { CreditsTile } from './CreditsTile'
import { ChargesTile, IncomeTile, type ShowNature } from './FlowTiles'
import { MemberShareTile } from './MemberShareTile'
import { type Metric, MetricInfo } from './MetricInfo'
import { SavingTile } from './SavingTile'
import { SettlementTile } from './SettlementTile'
import { SplitTile } from './SplitTile'
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
 * Une nature dont rien n'est confirmé n'a aucune ligne à montrer : sa tuile
 * porte quand même un chiffre, qui compte les échéances encore prévues. Elle ne
 * s'ouvre alors pas, plutôt que de mener à une liste où son chiffre n'est pas.
 * La nature, pas le sens : la tuile Charges exclut l'épargne, et un versement
 * d'épargne confirmé ne suffit pas à lui donner des lignes à montrer.
 *
 * Pas de tuile « Récurrences » : le total mensuel et annualisé est déjà en tête
 * de l'onglet du même nom, à un doigt de la barre de navigation. Une tuile qui
 * ne fait que répéter un chiffre pour mener à l'écran où il vit prend la place
 * de ce que le mois est seul à savoir dire.
 */
export function Dashboard({
  onShowNature,
  onShowFamily,
}: {
  onShowNature?: ShowNature
  onShowFamily?: ShowFamily
}) {
  const [metric, setMetric] = useState<Metric | null>(null)
  const confirmed = useMonthConfirmed()
  const kindOf = useKindOf()
  const common = useIsCommonFilter()
  const thisMonth = useIsCurrentMonth()

  const openable = (nature: 'expense' | 'income'): { onShow?: ShowNature } => {
    const kinds = kindsOfNature(nature)
    return onShowNature !== undefined &&
      confirmed.some((entry) => kinds.includes(kindOf(entry.categoryId)))
      ? { onShow: onShowNature }
      : {}
  }

  return (
    <>
      <BentoGrid>
        {/* Sur le commun, cinq tuiles n'ont plus de quoi répondre. Un revenu ne
            se partage jamais : le pot n'en a aucun, donc les quatre lectures
            qui soustraient les charges à des ressources — le solde, le
            prévisionnel, le reste à vivre, la capacité d'épargne — vaudraient
            toutes le même chiffre, celui des charges, au signe près. Et
            l'épargne ne rentre pas dans un partage, par la même règle qui
            l'exclut de « Où part l'argent ».
            Elles s'effacent plutôt que d'annoncer un zéro ou une redite —
            c'est déjà ce que font Répartition sous un filtre par membre et
            Part du foyer sans filtre. Reste ce que le pot sait dire : ce qu'il
            coûte, où il part, quand il tombe, et qui verse quoi. */}
        {!common && <BalanceTile onExplain={setMetric} />}
        {!common && <IncomeTile {...openable('income')} />}
        <ChargesTile {...openable('expense')} />
        <MemberShareTile />
        <SettlementTile />
        <BreakdownTile {...(onShowFamily === undefined ? {} : { onShowFamily })} />
        {!common && <ForecastTile onExplain={setMetric} />}
        {/* « Reste à vivre » se lit depuis aujourd'hui, pas depuis le mois
            affiché : c'est le prévisionnel arrêté à la prochaine rentrée
            d'argent. Sur un mois passé l'horizon est déjà derrière, sur un
            mois à venir il est encore devant — le chiffre se calcule dans les
            deux cas et ne veut rien dire ni dans l'un ni dans l'autre. Il
            s'efface donc, comme les cinq tuiles que le commun retire : une
            lecture qui n'a pas de réponse vaut mieux absente que fausse. */}
        {!common && thisMonth && <RemainingTile onExplain={setMetric} />}
        {!common && <SavingTile />}
        <SplitTile />
        <UpcomingTile />
        <CreditsTile />
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
