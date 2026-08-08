import { SPLIT_PATH } from '@/app/routes'
import { type Money, add } from '@/domain/money'
import { fr } from '@/i18n/fr'
import { formatPercent, tpl } from '@/i18n/format'
import { useMemberCharges, useMemberFilter, useMemberMap } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { SplitIcon } from '@/ui/Icons'
import { Ring } from '@/ui/Ring'
import { Tile } from '@/ui/Tile'
import { DONUT_SIZE, DONUT_THICKNESS } from './donut'

function Line({ label, value }: { label: string; value: Money }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="t-label min-w-0 flex-1 truncate">{label}</span>
      {/* Au centime, alors que la colonne est étroite : arrondis, les deux
          premières lignes annonceraient 764 € et 153 € quand la tuile Charges
          juste au-dessus en annonce 916,22. Un décalage de quatre-vingts
          centimes entre deux tuiles voisines se lit comme une erreur — c'est
          le libellé qui se coupe, jamais le chiffre. */}
      <Amount value={value} size="label" direction="out" className="shrink-0" />
    </li>
  )
}

/**
 * Ce que la personne filtrée doit verser sur le pot commun, et ce que le mois
 * lui coûte en tout.
 *
 * Les chiffres d'un mois filtré comprennent déjà sa part du pot commun — sans
 * quoi chacun se lirait comme s'il vivait sans loyer. Mais une fois fondue dans
 * le total des charges, cette part ne se voit plus : le solde du mois valait
 * bien ses revenus moins ses charges moins sa part du foyer, et rien à l'écran
 * ne montrait le troisième terme ni le pourcentage dont il sort.
 *
 * La tuile sert un geste, et un seul : le virement du mois sur le compte joint.
 * Ce montant est donc le chiffre de tête, en corps de tuile, et non une ligne
 * parmi trois qu'il fallait retrouver à chaque fois. Le total des charges
 * communes du foyer, lui, n'y est plus — c'est un chiffre qu'on ne doit pas, et
 * l'écran Répartition l'ouvre déjà en détail à un doigt d'ici.
 *
 * Restent les deux montants qu'on ne peut pas déduire de la tuile Charges
 * voisine, laquelle mêle les deux : ce qu'il paie pour lui, et la somme des
 * deux — le vrai coût de son mois, qu'on faisait de tête.
 *
 * Elle s'efface dans les mêmes cas que sa jumelle Répartition — pas de filtre,
 * pas de prorata calculable (l'en-tête du mois nomme alors ce qui manque), ou
 * aucune charge commune à porter : une part de rien n'est pas une part.
 */
export function MemberShareTile() {
  const charges = useMemberCharges()
  const filter = useMemberFilter()
  const members = useMemberMap()

  if (filter === undefined || charges === null || charges.commonTotal <= 0) return null

  const member = members.get(filter)
  const percent = formatPercent(charges.shareBp / 10_000, 1)
  /* La lecture de la jauge redescend dans l'anneau, d'où elle était partie : la
     tuile n'est plus un bouton, son contenu se lit donc ligne à ligne, et les
     trois montants que cette phrase récitait sont désormais entendus là où ils
     s'affichent. Reste ce que la jauge seule montre — la part, et de qui. */
  const spoken = tpl(fr.dashboard.srMemberShare, member?.name ?? '', percent)
  /* Le coût du mois, et lui seul : le report n'en fait pas partie. Ce qu'une
     dépense a coûté à quelqu'un est arrêté au mois où elle a eu lieu, et ces
     deux lignes doivent continuer de recomposer la tuile Charges voisine. */
  const total = add(charges.own, charges.common)
  /* Le virement, lui, se rattrape : celui qui a trop avancé le mois passé verse
     moins ce mois-ci, et l'autre un peu plus. */
  const toPay = add(charges.common, charges.adjustment)

  return (
    /* 4×2 et non 2×2 comme la Répartition, alors qu'elles portent le même
       gabarit : celle-ci aligne des montants là où l'autre aligne des
       pourcentages. « 1 374,50 € » prend 68 des 94 pixels qu'une demi-colonne
       laisse à côté de l'anneau au point de bascule, et le montant à verser y
       serait posé en corps de tuile sur une colonne qui ne peut pas le tenir.
       Sur téléphone les deux formats sont le même : pleine largeur, deux
       rangées.

       Un lien et non un bouton, comme la Répartition : son contenu porte une
       liste, et le nom unique d'un bouton effaçait les deux montants qu'elle
       sépare exprès. Le lien couvre toute la tuile et le repère reste au coin,
       hors du flux — c'est ce qui lui permet de ne rien coûter aux 148px de
       contenu, qui sont comptés. */
    <Tile
      span="4x2"
      className="gap-3"
      label={fr.dashboard.memberShare}
      /* Le repère nu, sans nommer sa destination : « À VERSER SUR LE COMMUN »
         est l'eyebrow le plus long de la grille (~195px en mono 11px, sans
         césure possible) et « Répartition › » en demande 95 de plus, quand la
         tuile n'en offre que 288 sur un écran de 360. Les deux se croisaient.
         `SplitTile` passe déjà son repère nu, pour la même raison. Le nom du
         lien, lui, est entier : il ne coûte aucun pixel. */
      link={{ to: SPLIT_PATH, label: fr.dashboard.showMemberShare }}
    >
      {/* L'eyebrow nomme le chiffre, au lieu qu'un libellé le refasse juste
          au-dessus : la tuile portait cinq éléments là où le DS §5 en autorise
          quatre, et les trente pixels de trop se coupaient en haut comme en
          bas — le libellé remontait sous l'eyebrow, le total à payer sortait
          par le bas.

          Le renvoi vers le détail était ici, souligné comme un lien sans en
          être un, et occupait exactement la place où la tuile pose désormais
          son repère. C'est le repère qui le porte, et il nomme l'écran
          d'arrivée au lieu de dire « détail ». */}
      <Eyebrow icon={SplitIcon}>{fr.dashboard.memberShare}</Eyebrow>
      <div className="flex min-h-0 flex-1 items-center gap-4">
        {/* Une jauge et non un donut : la question n'est pas comment le pot
            commun se découpe entre tous — c'est la tuile Répartition — mais
            quelle fraction en revient à cette personne-là. Le pourcentage est
            au centre parce qu'il est la réponse ; les montants qu'il produit
            se lisent à côté. */}
        <Ring
          size={DONUT_SIZE}
          thickness={DONUT_THICKNESS}
          value={charges.shareBp / 10_000}
          color={member?.color ?? 'var(--cat-rest)'}
          label={fr.dashboard.memberShare}
          srText={spoken}
          className="shrink-0"
        >
          <span className="t-num-body tnum">{percent}</span>
        </Ring>
        {/* Bornée : sur six colonnes la tuile fait 650px, et une liste qui les
            prendrait toutes séparerait chaque libellé de son montant par un
            demi-écran de vide — on ne lit plus une ligne, on la suit. */}
        <div className="flex min-w-0 max-w-xs flex-1 flex-col gap-1">
          {/* Le montant du virement, en corps de tuile : c'est la réponse, et
              on vient la recopier dans une application bancaire. */}
          <Amount value={toPay} size="tile-fit" direction="out" />
          <ul className="flex flex-col gap-1 border-t border-border pt-2">
            {/* Ce qu'il paie pour lui, puis la somme des deux : la tuile
                Charges voisine mêle déjà les deux sans les séparer, et le coût
                réel de son mois se faisait de tête. */}
            <Line label={fr.dashboard.memberShareOwn} value={charges.own} />
            <Line label={fr.dashboard.memberShareTotal} value={total} />
          </ul>
        </div>
      </div>
    </Tile>
  )
}
