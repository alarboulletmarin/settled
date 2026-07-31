import { useNavigate } from 'react-router-dom'
import { SPLIT_PATH } from '@/app/routes'
import type { Money } from '@/domain/money'
import { fr } from '@/i18n/fr'
import { formatMoney, formatPercent, tpl } from '@/i18n/format'
import { useMemberCharges, useMemberFilter, useMemberMap } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { SplitIcon } from '@/ui/Icons'
import { Ring } from '@/ui/Ring'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
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
 * Ce que la personne filtrée porte des charges communes, et le coefficient qui
 * le produit.
 *
 * Les chiffres d'un mois filtré comprennent déjà sa part du pot commun — sans
 * quoi chacun se lirait comme s'il vivait sans loyer. Mais une fois fondue dans
 * le total des charges, cette part ne se voit plus : le solde du mois valait
 * bien ses revenus moins ses charges moins sa part du foyer, et rien à l'écran
 * ne montrait le troisième terme ni le pourcentage dont il sort. C'est ce que
 * cette tuile pose en clair, à côté de ce qui rentre et de ce qui se paie.
 *
 * Elle est l'exacte contrepartie de la tuile Répartition, qui montre les parts
 * de tout le monde et s'efface sous un filtre : l'une ou l'autre est visible,
 * jamais les deux, et elles mènent au même écran de détail.
 *
 * Elle s'efface dans les mêmes cas que sa jumelle — pas de filtre, pas de
 * prorata calculable (l'en-tête du mois nomme alors ce qui manque), ou aucune
 * charge commune à porter : une part de rien n'est pas une part.
 */
export function MemberShareTile() {
  const charges = useMemberCharges()
  const filter = useMemberFilter()
  const members = useMemberMap()
  const currency = useCurrency()
  const navigate = useNavigate()

  const open = (): void => {
    void navigate(SPLIT_PATH)
  }

  if (filter === undefined || charges === null || charges.commonTotal <= 0) return null

  const member = members.get(filter)
  const percent = formatPercent(charges.shareBp / 10_000, 1)
  /* La lecture du DS §8 vit sur la tuile, et non en `srText` dans l'anneau : un
     bouton porte son nom accessible, et rien de ce qu'il contient n'est lu à
     côté — le texte caché de l'anneau y serait écrit sans jamais être entendu. */
  const spoken = tpl(
    fr.dashboard.srMemberShare,
    member?.name ?? '',
    percent,
    formatMoney(charges.common, currency),
    formatMoney(charges.commonTotal, currency),
  )

  return (
    /* 4×2 et non 2×2 comme la Répartition, alors qu'elles portent le même
       gabarit : celle-ci aligne des montants là où l'autre aligne des
       pourcentages. « 1 374,50 € » prend 68 des 94 pixels qu'une demi-colonne
       laisse à côté de l'anneau au point de bascule, et les trois libellés y
       tombaient à « Sa… », « C… », « Pe… » — un libellé coupé ne nomme plus
       rien. Sur téléphone les deux formats sont le même : pleine largeur, deux
       rangées.

       La tuile entière est la cible, comme la Répartition : le détail du calcul
       est à un doigt, et un lien de 44px à l'intérieur ferait déborder les
       148px de contenu. */
    <Tile span="4x2" className="gap-3" onClick={open} label={spoken}>
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
          className="shrink-0"
        >
          <span className="t-num-body tnum">{percent}</span>
        </Ring>
        {/* Bornée : sur six colonnes la tuile fait 650px, et une liste qui les
            prendrait toutes séparerait chaque libellé de son montant par un
            demi-écran de vide — on ne lit plus une ligne, on la suit. */}
        <ul className="flex min-w-0 max-w-xs flex-1 flex-col gap-1">
          <Line label={fr.dashboard.memberShareMine} value={charges.common} />
          <Line label={fr.dashboard.memberShareCommon} value={charges.commonTotal} />
          {/* Ce qu'il paie pour lui, en regard : c'est l'autre moitié de ses
              charges, et les deux ensemble redonnent le total de la tuile
              voisine — la soustraction n'est plus à faire de tête. */}
          <Line label={fr.dashboard.memberShareOwn} value={charges.own} />
        </ul>
      </div>
      <p className="t-label underline underline-offset-2">{fr.dashboard.memberShareHint}</p>
    </Tile>
  )
}
