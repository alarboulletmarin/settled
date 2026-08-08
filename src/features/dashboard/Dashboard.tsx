import { useIsCommonFilter, useKindOf, useMonthConfirmed } from '@/store/selectors'
import { kindsOfNature } from '@/ui/categoryKinds'
import { BentoGrid } from '@/ui/Tile'
import { BalanceTile } from './BalanceTile'
import { BreakdownTile, type ShowFamily } from './BreakdownTile'
import { CreditsTile } from './CreditsTile'
import { ChargesTile, IncomeTile, type ShowNature } from './FlowTiles'
import { MemberShareTile } from './MemberShareTile'
import type { Metric } from './MetricInfo'
import { SavingTile } from './SavingTile'
import { SettlementTile } from './SettlementTile'
import { SplitTile } from './SplitTile'

/**
 * La grille bento du DS §5.
 *
 * **L'ordre pave la grille, et ce sont les paires qui font le bento.** Une
 * grille de tuiles de tailles inégales n'existe, sur les deux colonnes d'un
 * téléphone, que si des `2x1` se rangent côte à côte : quatre blocs pleine
 * largeur empilés font une pile de cartes, si inégales que soient leurs
 * hauteurs. Trois paires portent donc le rythme — ce qui rentre et ce qui sort,
 * les deux soldes qui les projettent, les deux écrans qu'on ne fait que
 * désigner — et le solde du mois, l'anneau des postes et la capacité prennent
 * la largeur entre elles.
 *
 * Ce que ça donne, et c'est vrai des trois paliers :
 *
 * ```
 *  téléphone (2 col)     tablette (4 col)         bureau (6 col)
 *  ┌───────────────┐     ┌───────┬───┬───┐        ┌───────┬───┬───┐
 *  │    solde      │     │ solde │ € │ € │        │ solde │ € │ € │
 *  │     2×2       │     │  2×2  ├───┼───┤        │  2×2  ├───┼───┤
 *  ├───────┬───────┤     │       │prév│rav│       │       │prév│rav│
 *  │   €   │   €   │     ├───────┴────┴───┤       ├───────┼───────┤
 *  ├───────┼───────┤     │postes │capacité│       │postes │capacité│
 *  │ prév  │  rav  │     │  2×2  ├───┬────┤       │  2×2  ├───┬────┤
 *  ├───────┴───────┤     │       │rép│cré │       │       │rép│cré │
 *  │    postes     │     └───────┴───┴────┘       └───────┴───┴────┘
 *  │     2×2       │
 *  ├───────────────┤     Quatre rangées pleines et sans un trou sur les
 *  │   capacité    │     trois paliers : `dense` les range, mais seulement
 *  ├───────┬───────┤     si l'ordre le permet.
 *  │  rép  │  cré  │
 *  └───────┴───────┘
 * ```
 *
 * Ce qui rentre et ce qui se paie viennent juste après le solde, avant les deux
 * lectures qui les combinent : c'est la première question qu'on pose au mois —
 * combien j'ai gagné, combien je paie — et elle passait derrière trois soldes
 * qui n'y répondent qu'indirectement.
 *
 * La part du foyer les suit immédiatement sous un filtre par membre, parce
 * qu'elle est le troisième terme de la même phrase : le solde y vaut les
 * revenus moins les charges de la personne moins sa part du pot commun, et ce
 * dernier morceau était compris dans les chiffres sans être montré nulle part.
 * Hors filtre, elle s'efface et c'est la Répartition qui montre les parts de
 * tout le monde.
 *
 * **Les prochaines échéances ne sont plus ici.** Ce n'est pas un chiffre qu'on
 * lit d'un coup d'œil mais une liste qu'on parcourt, et sa hauteur doit venir
 * de son contenu plutôt que d'un format : cinq lignes se serraient à un pixel
 * d'interligne pour tenir dans les 188px d'une `4x2`. Elle vit en section sous
 * la grille (`UpcomingSection`).
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
          coûte, où il part, et qui verse quoi. */}
      {!common && <BalanceTile onExplain={onExplain} />}
      {!common && <IncomeTile {...openable('income')} />}
      <ChargesTile {...openable('expense')} />
      <MemberShareTile />
      <SettlementTile />
      <BreakdownTile {...(onShowFamily === undefined ? {} : { onShowFamily })} />
      <SplitTile />
      {!common && <SavingTile />}
      <CreditsTile />
    </BentoGrid>
  )
}
