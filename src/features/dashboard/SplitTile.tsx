import { useNavigate } from 'react-router-dom'
import { SPLIT_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { formatMoney, formatPercent, tpl } from '@/i18n/format'
import { useMemberFilter, useMemberMap, useMonthSplit } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { SplitIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/**
 * Ce que le foyer paie ensemble ce mois-ci, et la porte vers le découpage.
 *
 * **`2x1`, et non plus la `2x2` à anneau.** Elle porte la moitié d'une rangée
 * de la grille mobile, aux côtés des crédits : c'est ce qui rend au tableau de
 * bord ses tuiles de tailles inégales, que quatre blocs pleine largeur
 * empilés ne font pas. Le prix est celui de tout format plat — l'anneau ne
 * tient pas dans 88px de haut, et la lecture des parts passe en seconde
 * lecture (DS §5). Il est payé sciemment : l'anneau, le détail du calcul et la
 * vérification du total vivent entiers sur l'écran au bout du chevron, qui est
 * fait pour ça, et cette tuile-ci n'a qu'à dire combien et mener là-bas.
 *
 * Les parts restent **dans le DOM à toutes les largeurs** : masquées à l'œil
 * sous le seuil, elles sont lues par un lecteur d'écran, et l'anneau qu'elles
 * doublaient n'est plus là pour les redire.
 *
 * Elle s'efface dans les mêmes trois cas qu'avant. Sans les revenus de tout le
 * monde, il n'y a pas de prorata à afficher — et un zéro serait un mensonge
 * plutôt qu'un vide. Sous un filtre par membre, elle n'aurait plus rien à
 * montrer : une charge commune n'appartient à personne, donc aucune ne passe le
 * filtre, et c'est « À verser sur le commun » qui prend le relais. Et seul·e du
 * foyer, une part à 100 % n'apprendrait rien.
 */
export function SplitTile() {
  const { total, shares } = useMonthSplit()
  const members = useMemberMap()
  const filter = useMemberFilter()
  const currency = useCurrency()
  const navigate = useNavigate()

  if (filter !== undefined || members.size < 2 || shares === null || total <= 0) return null

  /* Les parts dans l'ordre de l'écran de détail. Sans pastille : une tuile
     plate n'a pas la place, et une couleur sans son anneau ne désigne plus
     rien — c'est le libellé qui porte le nom, comme partout. */
  const spread = shares
    .map(
      (share) =>
        `${members.get(share.memberId)?.name ?? ''} ${formatPercent(share.shareBp / 10_000)}`,
    )
    .join(' · ')

  return (
    <Tile
      span="2x1"
      className="justify-between"
      onClick={() => {
        void navigate(SPLIT_PATH)
      }}
      /* Le nom accessible porte les chiffres, et non le geste : une tuile
         cliquable est un bouton, dont l'`aria-label` remplace le contenu — ce
         qui est dedans n'est pas annoncé. C'est déjà le parti de
         `SettlementTile`, et c'est ici qu'il devient nécessaire : l'anneau qui
         disait les parts à voix haute n'est plus là pour les porter. */
      label={tpl(fr.dashboard.srSplitTile, formatMoney(total, currency), spread)}
      /* Repère nu : l'eyebrow dit déjà « Répartition », et le nom de l'écran
         d'arrivée au coin d'une demi-colonne mangerait la largeur du chiffre. */
      affordance={{ kind: 'navigate' }}
    >
      <Eyebrow icon={SplitIcon}>{fr.dashboard.split}</Eyebrow>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Amount value={total} size="tile-fit" direction="out" />
        <span className="t-label tile-hint">{spread}</span>
      </div>
    </Tile>
  )
}
