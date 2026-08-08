import { SAVINGS_PATH } from '@/app/routes'
import { today } from '@/domain/date'
import { ZERO, abs } from '@/domain/money'
import { nextIncomeDate, savingCapacity, savingLeft } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import {
  useIsCommonFilter,
  useIsCurrentMonth,
  useKindTotals,
  useMonthEntries,
  useMonthTotals,
  useRestToLive,
} from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { ForecastIcon } from '@/ui/Icons'
import { Row, RowGroup } from '@/ui/RowGroup'
import { useCurrency } from '@/ui/currency'
import type { Metric } from './MetricInfo'

/**
 * Les trois lectures que le mois dérive de ses deux flux : où il atterrit, ce
 * qui reste d'ici la prochaine paie, ce qu'il dégage avant d'épargner.
 *
 * **Un cadre, trois rangées, et non trois tuiles.** Elles portaient chacune la
 * leur, ce qui leur donnait le poids des deux flux dont elles sortent — et la
 * grille finissait à une tuile par métrique, ce qu'une page ne doit pas faire
 * (c'est le raisonnement de `RowGroup`, écrit pour les huit tuiles des
 * réglages). Le solde reste seul en tête, les deux flux le suivent, et ces
 * trois-ci se lisent ensemble, une ligne chacune.
 *
 * **C'est aussi le seul format où leur microcopy s'affiche.** « Prévisionnel »
 * et « Reste à vivre » annoncent le même montant au centime dès qu'aucune
 * rentrée d'argent ne reste à venir — `restToLive` prend alors la fin du mois
 * pour horizon, ce que fait déjà le prévisionnel. La phrase qui les sépare
 * vivait sur `.tile-hint`, masqué sous 300px de boîte de contenu : sur une
 * `2x1` en demi-colonne mobile, elle ne s'affichait donc jamais. On lisait deux
 * fois le même chiffre sous deux noms, sans un mot. La `description` d'une
 * rangée, elle, passe à la ligne et se lit à toutes les largeurs.
 *
 * Les deux premières ouvrent leur feuille d'explication, la troisième mène à
 * l'écran de l'épargne : devant « Capacité : 1 100 € », la question suivante
 * n'est pas « qu'est-ce qu'une capacité » mais « où je la place ».
 *
 * Elle s'efface entière sur le commun, pour la raison qui y efface le solde :
 * le pot n'a aucun revenu, et trois lectures qui soustraient des charges à des
 * ressources y vaudraient toutes les charges, au signe près.
 */
export function SituationSection({ onExplain }: { onExplain: (metric: Metric) => void }) {
  const totals = useMonthTotals()
  const kinds = useKindTotals(true)
  const remaining = useRestToLive()
  const entries = useMonthEntries()
  const common = useIsCommonFilter()
  const thisMonth = useIsCurrentMonth()
  const currency = useCurrency()

  if (common) return null

  /* « Reste à vivre » se lit depuis aujourd'hui, pas depuis le mois affiché :
     sur un mois passé l'horizon est déjà derrière, sur un mois à venir il est
     encore devant. Le chiffre se calcule dans les deux cas et ne veut rien dire
     ni dans l'un ni dans l'autre — d'où la rangée absente plutôt que fausse.
     C'est mot pour mot la règle que portait `RemainingTile`. */
  const remainingHint =
    nextIncomeDate(entries, today()) === null
      ? fr.dashboard.remainingNoIncome
      : fr.dashboard.remainingHint

  const capacity = savingCapacity(kinds)
  const left = savingLeft(kinds)

  /* L'épargne se compte en net : une reprise — l'assurance de l'année payée
     depuis le livret — la fait passer sous zéro, et le montant se nomme alors
     pour ce qu'il est. À zéro, rien : une lecture sans réponse vaut mieux
     absente que fausse. */
  const placed =
    kinds.saving === ZERO
      ? null
      : kinds.saving > ZERO
        ? tpl(fr.dashboard.savingPlaced, formatMoney(kinds.saving, currency))
        : tpl(fr.dashboard.savingWithdrawn, formatMoney(abs(kinds.saving), currency))

  /* Le dépassement n'est pas un reste : placer plus qu'on ne dégage est une
     information, et « reste −57 € » n'en serait pas une. */
  const leftHint =
    left < 0
      ? tpl(fr.savings.overHint, formatMoney(abs(left), currency))
      : tpl(fr.dashboard.savingLeft, formatMoney(left, currency))

  /* Les deux clauses au même horizon que le chiffre qu'elles encadrent : ce qui
     est versé et ce qu'il reste à placer sont les deux moitiés de la capacité,
     et trois chiffres posés côte à côte qui ne s'additionnent pas se lisent
     comme une erreur de calcul. Réunies ici, elles ne se disputent plus une
     ligne de tuile — c'est ce qui les faisait disparaître à tour de rôle. */
  const savingHint = placed === null ? leftHint : `${placed} · ${leftHint}`

  return (
    <RowGroup title={fr.dashboard.situation} icon={ForecastIcon}>
      <Row
        label={fr.dashboard.forecast}
        description={fr.dashboard.forecastHint}
        affordance="explain"
        trailing={<Amount value={totals.forecastBalance} />}
        onClick={() => {
          onExplain({
            key: 'forecast',
            value: totals.forecastBalance,
            hint: fr.dashboard.forecastHint,
          })
        }}
      />
      {thisMonth && (
        <Row
          label={fr.dashboard.remaining}
          description={remainingHint}
          affordance="explain"
          trailing={
            <Amount value={remaining} tone={remaining < 0 ? 'danger' : 'default'} />
          }
          onClick={() => {
            onExplain({ key: 'remaining', value: remaining, hint: remainingHint })
          }}
        />
      )}
      <Row
        label={fr.dashboard.capacity}
        description={savingHint}
        to={SAVINGS_PATH}
        trailing={<Amount value={capacity} tone={capacity < 0 ? 'danger' : 'default'} />}
      />
    </RowGroup>
  )
}
