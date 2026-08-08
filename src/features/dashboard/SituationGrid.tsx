import { useIsCommonFilter, useKindOf, useMonthConfirmed } from '@/store/selectors'
import { kindsOfNature } from '@/ui/categoryKinds'
import { BentoGrid } from '@/ui/Tile'
import { BalanceTile } from './BalanceTile'
import { ChargesTile, IncomeTile, type ShowNature } from './FlowTiles'
import type { Metric } from './MetricInfo'
import { MonthStatusTile } from './MonthStatusTile'

/**
 * Le premier étage de l'écran du mois : **où j'en suis**.
 *
 * La grille bento du DS §5 en portait douze, puis neuf — c'est-à-dire toutes les
 * questions du mois d'un coup, avec le même poids. On lisait six chiffres
 * d'argent d'affilée avant qu'aucune narration ne les ordonne, et la seule chose
 * qui demandait un geste — confirmer — arrivait deux écrans plus bas. La grille
 * se coupe donc en deux, et cette coupure *est* la refonte : ce qui répond à
 * « où j'en suis » reste ici, ce qui répond à « pourquoi » descend dans
 * `AnalysisGrid`, et « ce que j'ai à faire » se glisse entre les deux.
 *
 * Quatre tuiles, et le pavage se referme sans un trou sur les trois paliers —
 * c'est le format `4x1` de la tuile de suivi qui le permet :
 *
 * ```
 *  téléphone (2 col)     tablette (4 col)        bureau (6 col)
 *  ┌───────────────┐     ┌───────┬───┬───┐       ┌───────┬───┬───┐
 *  │    solde      │     │ solde │ € │ € │       │ solde │ € │ € │
 *  │     2×2       │     │  2×2  ├───┴───┤       │  2×2  ├───┴───┤
 *  ├───────┬───────┤     │       │ suivi │       │       │ suivi │
 *  │   €   │   €   │     └───────┴───────┘       └───────┴───────┘
 *  ├───────┴───────┤
 *  │     suivi     │
 *  └───────────────┘
 * ```
 *
 * **La paire ne bouge pas.** Sur deux colonnes, seul un `2x1` se range à côté
 * d'un autre : Revenus et Charges sont la seule chose qui fasse de cet étage une
 * grille de tailles inégales plutôt qu'une pile de cartes (DS §5). Et le cahier
 * §4.6 veut qu'ils se lisent à côté du solde, avant les lectures dérivées — un
 * solde a déjà fait la soustraction, il ne répond pas à « combien je gagne,
 * combien je paie ». Ils sont donc ici et non dans l'étage analytique, où le
 * brief les aurait volontiers rangés.
 *
 * Le prévisionnel et le reste à vivre suivent immédiatement, hors de la grille
 * et pour la raison qui les en a sortis : ils annoncent régulièrement le même
 * montant au centime, et seule une rangée sait dire pourquoi (`SituationSection`).
 *
 * Sur le commun, deux tuiles s'effacent — le pot n'a aucun revenu, donc le solde
 * et les ressources y vaudraient zéro ou les charges au signe près (cahier
 * §4.6). Le suivi du mois, lui, reste : il a quelque chose à dire sous toutes
 * les lectures, puisqu'il compte exactement les échéances que la section
 * « À confirmer » liste en dessous, filtre compris.
 *
 * La feuille d'explication ne vit pas ici mais sur la page : un `<dialog>` posé
 * parmi les tuiles occuperait une case tant qu'il est fermé.
 */
export function SituationGrid({
  onShowNature,
  onShowPending,
  onExplain,
}: {
  onShowNature?: ShowNature
  onShowPending?: () => void
  onExplain: (metric: Metric) => void
}) {
  const confirmed = useMonthConfirmed()
  const kindOf = useKindOf()
  const common = useIsCommonFilter()

  /* Une nature dont rien n'est confirmé n'a aucune ligne à montrer : sa tuile
     porte quand même un chiffre, qui compte les échéances encore prévues. Elle
     ne s'ouvre alors pas, plutôt que de mener à une liste où son chiffre n'est
     pas. La nature, pas le sens : la tuile Charges exclut l'épargne, et un
     versement confirmé ne suffit pas à lui donner des lignes à montrer. */
  const openable = (nature: 'expense' | 'income'): { onShow?: ShowNature } => {
    const kinds = kindsOfNature(nature)
    return onShowNature !== undefined &&
      confirmed.some((entry) => kinds.includes(kindOf(entry.categoryId)))
      ? { onShow: onShowNature }
      : {}
  }

  return (
    <BentoGrid>
      {!common && <BalanceTile onExplain={onExplain} />}
      {!common && <IncomeTile {...openable('income')} />}
      <ChargesTile {...openable('expense')} />
      <MonthStatusTile {...(onShowPending === undefined ? {} : { onShowPending })} />
    </BentoGrid>
  )
}
