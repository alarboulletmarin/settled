import { useNavigate } from 'react-router-dom'
import { SAVINGS_PATH } from '@/app/routes'
import { abs } from '@/domain/money'
import { savingCapacity, savingLeft } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useKindTotals, useMemberFilter } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { SavingsIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/**
 * Capacité d'épargne : ressources − charges − crédits, donc avant versements.
 *
 * C'est ce que le solde du mois ne dit pas. Lui compte un versement comme une
 * sortie — exact en trésorerie — si bien qu'un mois où l'on met 300 € de côté
 * se lit comme un mois où l'on a dépensé 300 € de plus.
 *
 * Le chiffre est celui du mois entier, échéances prévues comprises, comme les
 * tuiles Revenus et Charges dont il est exactement la soustraction. Lu au seul
 * confirmé — ce qu'il faisait — il annonçait presque zéro un 3 du mois, et ne
 * valait pas la différence des deux tuiles posées trois cases plus haut : deux
 * chiffres voisins qui ne se recomposent pas se lisent comme une erreur.
 *
 * Elle mène à l'écran de l'épargne plutôt qu'à une feuille qui la définit,
 * comme la Répartition mène au partage : devant « Capacité : 1 100 € », la
 * question suivante n'est pas « qu'est-ce qu'une capacité » mais « où je la
 * place, et combien m'en reste-t-il ». La feuille répondait à l'autre.
 */
export function SavingTile() {
  const totals = useKindTotals(true)
  const currency = useCurrency()
  const navigate = useNavigate()
  const member = useMemberFilter()

  const capacity = savingCapacity(totals)
  const left = savingLeft(totals)
  /* Ce qui est déjà placé ne se dit que sous un filtre par membre. Une épargne
     est à quelqu'un : au foyer, la somme de deux versements ne décide de rien,
     et c'est justement pour ça qu'elle a quitté « Où part l'argent ». Filtrée,
     elle est individuelle — `useKindTotals` passe par `scopeToMember` — et elle
     complète le reste à placer, dont elle est l'autre moitié.
     Le dépassement se dit dans les deux cas : placer plus qu'on ne dégage est
     une information, et « reste −57 € » n'en serait pas une. */
  const placed = member !== undefined && totals.saving > 0
  const hint =
    left < 0
      ? placed
        ? tpl(
            fr.dashboard.savingPlacedOver,
            formatMoney(totals.saving, currency),
            formatMoney(abs(left), currency),
          )
        : tpl(fr.savings.overHint, formatMoney(abs(left), currency))
      : placed
        ? tpl(
            fr.dashboard.savingPlacedLeft,
            formatMoney(totals.saving, currency),
            formatMoney(left, currency),
          )
        : tpl(fr.dashboard.savingLeft, formatMoney(left, currency))

  return (
    // 4×1 et non 2×1 : « CAPACITÉ D'ÉPARGNE » ne tient pas dans la centaine de
    // pixels utiles d'une demi-colonne mobile, et c'est de toute façon un
    // chiffre de tête de gondole, pas une valeur d'appoint.
    <Tile
      span="4x1"
      className="justify-between"
      onClick={() => {
        void navigate(SAVINGS_PATH)
      }}
      label={tpl(fr.dashboard.showSavings, fr.dashboard.capacity)}
      affordance={{ kind: 'navigate', destination: fr.savings.title }}
    >
      <Eyebrow icon={SavingsIcon}>{fr.dashboard.capacity}</Eyebrow>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Amount value={capacity} size="tile-fit" tone={capacity < 0 ? 'danger' : 'default'} />
        <span className="t-label max-lg:sr-only">{hint}</span>
      </div>
    </Tile>
  )
}
