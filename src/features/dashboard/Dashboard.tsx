import { useIsCommonFilter, useKindOf, useMonthConfirmed } from '@/store/selectors'
import { kindsOfNature } from '@/ui/categoryKinds'
import { BentoGrid } from '@/ui/Tile'
import { BalanceTile } from './BalanceTile'
import { BreakdownTile, type ShowFamily } from './BreakdownTile'
import { ChargesTile, IncomeTile, type ShowNature } from './FlowTiles'
import { MemberShareTile } from './MemberShareTile'
import type { Metric } from './MetricInfo'
import { SettlementTile } from './SettlementTile'

/**
 * La grille bento du DS §5 — **le résumé du mois, et rien d'autre**.
 *
 * Elle en portait douze, c'est-à-dire une tuile par métrique : quatre soldes
 * qui se ressemblent, deux flux, deux répartitions, une capacité, un capital
 * restant dû, une liste d'échéances. Tout y était vrai et tout y avait le même
 * poids, sur deux écrans de défilement avant d'atteindre les lignes du mois.
 *
 * Il en reste ce à quoi on répond d'un coup d'œil, dans l'ordre des trois
 * questions qu'on pose en arrivant : où j'en suis, ce qui rentre, ce qui sort —
 * puis où il part. Le reste n'a pas disparu : ce qui se dérive de ces chiffres
 * se lit en rangées juste dessous (`SituationSection`), ce qui appelle un autre
 * écran s'y rend en une ligne (`MoreSection`), et ce qui est une liste est
 * devenu une section (`UpcomingSection`).
 *
 * **L'ordre pave la grille.** Sur six colonnes : solde (c1-2, deux rangées),
 * revenus (c3-4), charges (c5-6), puis « Où part l'argent » en `4x2` sous les
 * deux flux (c3-6). Deux rangées pleines, sans trou. Sur deux colonnes, les
 * quatre s'empilent dans le même ordre, et les deux flux restent voisins —
 * c'est la même phrase, on ne lit pas ce qui rentre sans ce qui sort.
 *
 * La part du foyer et sa régularisation s'intercalent sous un filtre par
 * membre : elles sont le troisième terme de cette phrase-là, ce que la personne
 * porte du pot commun, compris dans ses chiffres sans être montré nulle part.
 *
 * Une nature dont rien n'est confirmé n'a aucune ligne à montrer : sa tuile
 * porte quand même un chiffre, qui compte les échéances encore prévues. Elle ne
 * s'ouvre alors pas, plutôt que de mener à une liste où son chiffre n'est pas.
 * La nature, pas le sens : la tuile Charges exclut l'épargne, et un versement
 * d'épargne confirmé ne suffit pas à lui donner des lignes à montrer.
 *
 * La feuille d'explication ne vit plus ici : deux rangées de `SituationSection`
 * l'ouvrent aussi, et c'est donc la page qui la tient — un `<dialog>` par
 * appelant en monterait deux dans le DOM pour un seul à l'écran.
 */
export function Dashboard({
  onShowNature,
  onShowFamily,
  onExplain,
}: {
  onShowNature?: ShowNature
  onShowFamily?: ShowFamily
  onExplain: (metric: Metric) => void
}) {
  const confirmed = useMonthConfirmed()
  const kindOf = useKindOf()
  const common = useIsCommonFilter()

  const openable = (nature: 'expense' | 'income'): { onShow?: ShowNature } => {
    const kinds = kindsOfNature(nature)
    return onShowNature !== undefined &&
      confirmed.some((entry) => kinds.includes(kindOf(entry.categoryId)))
      ? { onShow: onShowNature }
      : {}
  }

  return (
    <BentoGrid>
      {/* Sur le commun, le solde et les revenus n'ont plus de quoi répondre :
          un revenu ne se partage jamais, donc le pot n'en a aucun, et un solde
          qui soustrait des charges à des ressources inexistantes vaudrait les
          charges au signe près. Ils s'effacent plutôt que d'annoncer un zéro —
          c'est déjà ce que font Répartition sous un filtre par membre et Part
          du foyer sans filtre. Reste ce que le pot sait dire : ce qu'il coûte,
          et où il part. */}
      {!common && <BalanceTile onExplain={onExplain} />}
      {!common && <IncomeTile {...openable('income')} />}
      <ChargesTile {...openable('expense')} />
      <MemberShareTile />
      <SettlementTile />
      <BreakdownTile {...(onShowFamily === undefined ? {} : { onShowFamily })} />
    </BentoGrid>
  )
}
