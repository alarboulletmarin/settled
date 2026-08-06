import { useNavigate } from 'react-router-dom'
import { SAVINGS_PATH } from '@/app/routes'
import { ZERO, abs } from '@/domain/money'
import { savingCapacity, savingLeft } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useKindTotals } from '@/store/selectors'
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
 *
 * **Sa seconde lecture porte deux clauses, et les deux au même horizon que le
 * chiffre.** Ce qui est versé et ce qu'il reste à placer sont les deux moitiés
 * de la capacité : posés à côté d'elle, ils doivent la redonner, sinon la tuile
 * se lit comme une erreur de calcul. Ce qui interdit de dire le versement au
 * seul confirmé, si tentant que ce soit — le mois entier compte alors dans
 * deux des trois chiffres, et il manque à l'écran ce qui est programmé sans
 * être parti. L'écran de l'épargne, qui compte le mois entier lui aussi, dirait
 * de surcroît un autre montant sous le même mot.
 *
 * Le versement se dit avec ou sans filtre. Il ne se disait que filtré, au motif
 * qu'une somme d'épargnes individuelles ne décide de rien : ça vaut pour le
 * reste à placer, qui appelle un geste et se décide sur un compte à la fois,
 * pas pour un constat — l'écran de l'épargne additionne d'ailleurs déjà les
 * versements du foyer. Hors filtre et sur un téléphone, le mois ne disait donc
 * nulle part ce qu'il avait mis de côté, quand son solde comptait le versement
 * comme une dépense.
 */
export function SavingTile() {
  const totals = useKindTotals(true)
  const currency = useCurrency()
  const navigate = useNavigate()

  const capacity = savingCapacity(totals)
  const left = savingLeft(totals)

  /* L'épargne se compte en net : une reprise — l'assurance de l'année payée
     depuis le livret — la fait passer sous zéro, et le montant se nomme alors
     pour ce qu'il est. À zéro, rien : une lecture sans réponse vaut mieux
     absente que fausse. */
  const placedHint =
    totals.saving === ZERO
      ? null
      : totals.saving > ZERO
        ? tpl(fr.dashboard.savingPlaced, formatMoney(totals.saving, currency))
        : tpl(fr.dashboard.savingWithdrawn, formatMoney(abs(totals.saving), currency))

  /* Le dépassement n'est pas un reste : placer plus qu'on ne dégage est une
     information, et « reste −57 € » n'en serait pas une. */
  const leftHint =
    left < 0
      ? tpl(fr.savings.overHint, formatMoney(abs(left), currency))
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
        {/* Deux clauses et deux seuils, parce qu'elles ne font pas la même
            longueur. Le versement tient en trois mots et passe donc par la
            requête de conteneur de `.tile-hint`, comme les deux tuiles de flux :
            c'est ce qui le rend lisible sur un téléphone, où la tuile prend
            toute la largeur. Le reste, lui, est une phrase — « les versements
            dépassent la capacité de 57 € » — et garde le seuil de viewport,
            faute de rangée assez haute pour une seconde ligne sous 1024px.
            Réunis en une seule, ils ne tenaient à aucune largeur sous ce
            seuil-là, et le versement ne s'affichait donc nulle part. Les deux
            restent dans le DOM à toutes les largeurs : ce qui ne s'affiche pas
            se lit quand même. */}
        {placedHint !== null && <span className="t-label tile-hint">{placedHint}</span>}
        {placedHint !== null && (
          <span aria-hidden="true" className="t-label max-lg:hidden">
            ·
          </span>
        )}
        <span className="t-label max-lg:sr-only">{leftHint}</span>
      </div>
    </Tile>
  )
}
