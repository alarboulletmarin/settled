import type { Flow } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useMonthFlows } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { ChargesIcon, type IconComponent, IncomeIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import type { Metric, MetricKey } from './MetricInfo'

/**
 * Les deux chiffres que les quatre soldes combinent sans jamais les dire :
 * ce qu'on gagne, et ce qu'on paie. Un solde répond « ce qu'il te reste », ce
 * qui ne répond pas à « combien je paie ce mois-ci ».
 *
 * Le chiffre est celui du mois entier, échéances prévues comprises : la
 * question se pose le 3 comme le 28, et un total qui s'arrêterait au confirmé
 * répondrait « presque rien » en début de mois. Ce qui reste à tomber se lit
 * en seconde lecture, là où les autres tuiles plates mettent la leur.
 */
function FlowTile({
  metricKey,
  label,
  icon,
  flow,
  direction,
  hint,
  onExplain,
}: {
  metricKey: MetricKey
  label: string
  icon: IconComponent
  flow: Flow
  direction: 'in' | 'out'
  hint: string
  onExplain: (metric: Metric) => void
}) {
  return (
    <Tile
      span="2x1"
      className="justify-between"
      onClick={() => {
        onExplain({ key: metricKey, value: flow.total, direction, hint })
      }}
      label={tpl(fr.dashboard.explain, label)}
    >
      <Eyebrow icon={icon}>{label}</Eyebrow>
      <div className="flex flex-wrap items-baseline gap-x-2">
        {/* Un flux, pas un solde : la valeur est absolue, et le « + » du DS §3
            distingue l'une de l'autre les deux tuiles voisines. */}
        <Amount value={flow.total} size="tile-fit" direction={direction} />
        {/* Une tuile d'une rangée fait 88px : la seconde lecture ne s'affiche
            qu'au-delà de 1024px, et la feuille d'explication la porte partout
            ailleurs. */}
        <span className="t-label max-lg:sr-only">{hint}</span>
      </div>
    </Tile>
  )
}

export function IncomeTile({ onExplain }: { onExplain: (metric: Metric) => void }) {
  const { income } = useMonthFlows()
  const currency = useCurrency()

  const hint =
    income.total === 0
      ? fr.dashboard.incomeNone
      : income.left > 0
        ? tpl(fr.dashboard.incomeLeft, formatMoney(income.left, currency, false))
        : fr.dashboard.incomeAllIn

  return (
    <FlowTile
      metricKey="income"
      label={fr.dashboard.income}
      icon={IncomeIcon}
      flow={income}
      direction="in"
      hint={hint}
      onExplain={onExplain}
    />
  )
}

export function ChargesTile({ onExplain }: { onExplain: (metric: Metric) => void }) {
  const { spending } = useMonthFlows()
  const currency = useCurrency()

  const hint =
    spending.total === 0
      ? fr.dashboard.chargesNone
      : spending.left > 0
        ? tpl(fr.dashboard.chargesLeft, formatMoney(spending.left, currency, false))
        : fr.dashboard.chargesAllPaid

  return (
    <FlowTile
      metricKey="charges"
      label={fr.dashboard.charges}
      icon={ChargesIcon}
      flow={spending}
      direction="out"
      hint={hint}
      onExplain={onExplain}
    />
  )
}
