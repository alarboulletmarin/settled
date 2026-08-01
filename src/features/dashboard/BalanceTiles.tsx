import { daysInMonth, parseYm, today, ymOf } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { useCurrentYm, useMonthProgress, useMonthTotals, useRestToLive } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { BalanceIcon, ForecastIcon, RemainingIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { nextIncomeDate } from '@/domain/stats'
import { useMonthEntries } from '@/store/selectors'
import type { Metric } from './MetricInfo'

/**
 * Solde du mois : entrées confirmées − sorties confirmées. C'est l'unique
 * tuile accentuée de l'écran, comme le veut le DS §6.
 */
/**
 * « Jour n sur N » ne veut rien dire hors du mois courant : un mois pas encore
 * commencé afficherait « jour 1 », un mois passé « jour 31 », comme si on y
 * était. Les deux se disent en toutes lettres.
 */
function progressLabel(ym: string, progress: number, days: number): string {
  const current = ymOf(today())
  if (ym > current) return fr.dashboard.monthAhead
  if (ym < current) return fr.dashboard.monthDone
  return tpl(fr.dashboard.progress, Math.round(progress * days), days)
}

export function BalanceTile({ onExplain }: { onExplain: (metric: Metric) => void }) {
  const totals = useMonthTotals()
  const ym = useCurrentYm()
  const progress = useMonthProgress()
  const { y, m } = parseYm(ym)
  const days = daysInMonth(y, m)
  const hint = progressLabel(ym, progress, days)

  return (
    /* La tuile entière ouvre l'explication : sur une 2×1, un bouton « i » et
       l'eyebrow ne tiennent pas côte à côte dans les 134px utiles. Le glyphe du
       coin n'est donc pas une cible — c'est un repère, qui dit que le geste
       existe et qu'il reste sur la page. */
    <Tile
      span="2x2"
      variant="accent"
      className="justify-between"
      onClick={() => {
        onExplain({ key: 'balance', value: totals.balance, hint })
      }}
      label={tpl(fr.dashboard.explain, fr.dashboard.balance)}
      affordance={{ kind: 'explain' }}
    >
      <Eyebrow icon={BalanceIcon}>{fr.dashboard.balance}</Eyebrow>
      {/* Un eyebrow, un chiffre, une lecture secondaire — le maximum qu'une
          tuile porte selon le DS §5. L'anneau signature vit sur la répartition. */}
      <div className="flex flex-col gap-1">
        <Amount value={totals.balance} size="hero-fit" className="min-w-0" />
        <span className="t-label">{hint}</span>
      </div>
    </Tile>
  )
}

/** Solde prévisionnel : en incluant les échéances encore prévues. */
export function ForecastTile({ onExplain }: { onExplain: (metric: Metric) => void }) {
  const totals = useMonthTotals()
  return (
    <Tile
      span="2x1"
      className="justify-between"
      onClick={() => {
        onExplain({
          key: 'forecast',
          value: totals.forecastBalance,
          hint: fr.dashboard.forecastHint,
        })
      }}
      label={tpl(fr.dashboard.explain, fr.dashboard.forecast)}
      affordance={{ kind: 'explain' }}
    >
      <Eyebrow icon={ForecastIcon}>{fr.dashboard.forecast}</Eyebrow>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Amount value={totals.forecastBalance} size="tile-fit" />
        {/* Tant que la rangée fait une demi-hauteur, la lecture secondaire
            reste lue par un lecteur d'écran mais ne s'affiche pas. */}
        <span className="t-label max-lg:sr-only">{fr.dashboard.forecastHint}</span>
      </div>
    </Tile>
  )
}

/** Reste à vivre : le prévisionnel arrêté à la prochaine rentrée d'argent. */
export function RemainingTile({ onExplain }: { onExplain: (metric: Metric) => void }) {
  const remaining = useRestToLive()
  const entries = useMonthEntries()
  const hasIncome = nextIncomeDate(entries, today()) !== null
  const hint = hasIncome ? fr.dashboard.remainingHint : fr.dashboard.remainingNoIncome

  return (
    <Tile
      span="2x1"
      className="justify-between"
      onClick={() => {
        onExplain({ key: 'remaining', value: remaining, hint })
      }}
      label={tpl(fr.dashboard.explain, fr.dashboard.remaining)}
      affordance={{ kind: 'explain' }}
    >
      <Eyebrow icon={RemainingIcon}>{fr.dashboard.remaining}</Eyebrow>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Amount value={remaining} size="tile-fit" tone={remaining < 0 ? 'danger' : 'default'} />
        <span className="t-label max-lg:sr-only">{hint}</span>
      </div>
    </Tile>
  )
}
