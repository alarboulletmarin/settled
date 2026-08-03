import { daysInMonth, parseYm, today, ymOf } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { useCurrentYm, useMonthProgress, useMonthTotals, useRestToLive } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { BalanceIcon, ForecastIcon, RemainingIcon } from '@/ui/Icons'
import { Ring } from '@/ui/Ring'
import { Tile } from '@/ui/Tile'
import { nextIncomeDate } from '@/domain/stats'
import { useMonthEntries } from '@/store/selectors'
import type { Metric } from './MetricInfo'

/**
 * « Jour n sur N » ne veut rien dire hors du mois courant : un mois pas encore
 * commencé afficherait « jour 1 », un mois passé « jour 31 », comme si on y
 * était. Les deux se disent en toutes lettres.
 *
 * C'est aussi la lecture accessible de l'anneau qui l'accompagne (DS §8) :
 * l'anneau ne porte donc pas de `srText`, qui la redirait mot pour mot.
 */
function progressLabel(ym: string, progress: number, days: number): string {
  const current = ymOf(today())
  if (ym > current) return fr.dashboard.monthAhead
  if (ym < current) return fr.dashboard.monthDone
  return tpl(fr.dashboard.progress, Math.round(progress * days), days)
}

/**
 * Solde du mois : entrées confirmées − sorties confirmées. C'est l'unique tuile
 * accentuée de l'écran, comme le veut le DS §6.
 *
 * Et c'est elle qui porte l'anneau du mois — la signature que le DS §1 annonce
 * (« un arc qui revient partout : progression dans le mois… ») et que la page
 * de présentation montre aux visiteurs sous le mot « comme sur le mois ». Le
 * vrai tableau de bord n'en avait pas : la progression s'y lisait en une phrase,
 * et la promesse faite à l'accueil désignait un écran qui n'existait pas.
 */
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
      {/* Un eyebrow, un chiffre, une lecture secondaire, une visualisation — le
          maximum exact qu'une tuile porte selon le DS §5, et l'anneau *est* la
          visualisation.
          Il se pose sur la phrase qu'il dessine, et non à côté du chiffre :
          mesuré, une 2×2 n'offre que 89px de large à 1024px une fois l'anneau
          du gabarit des donuts retiré, quand le chiffre héros à son plancher de
          32px en demande déjà cent pour un solde à deux chiffres. Il passait à
          la ligne et venait chevaucher l'anneau. La hauteur, elle, est libre :
          la tuile en a 148 sur téléphone et n'en consomme que 116. */}
      <div className="flex flex-col gap-1">
        <Amount value={totals.balance} size="hero-fit" className="min-w-0" />
        <div className="flex items-center gap-2">
          {/* 48, et pas un de plus : à 768px la 2×2 offre 140px de contenu, et
              l'eyebrow avec le chiffre héros — qui atteint là sa borne haute de
              56px — en prennent déjà 79. À 56 l'anneau se faisait trancher de
              trois pixels par le bas, ce qui l'aplatit sans qu'on sache
              pourquoi.
              Épaisseur 8 et non les 12 du DS §6 : ces douze pixels sont écrits
              pour l'anneau de 160, et `donut.ts` les ramène déjà à 10 pour
              celui de 80. À 48, douze ne laisseraient qu'un trou de 24 — un
              disque percé, plus un anneau. */}
          <Ring
            size={48}
            thickness={8}
            value={progress}
            label={fr.a11y.ringLabel}
            className="shrink-0"
          />
          <span className="t-label min-w-0">{hint}</span>
        </div>
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
        {/* Tant que la tuile est trop étroite pour la porter, la lecture
            secondaire reste lue par un lecteur d'écran mais ne s'affiche pas —
            et la feuille d'explication la porte alors, elle. Le seuil est celui
            de la tuile et non celui de l'écran (voir `.tile-hint`) : aux
            largeurs où cette tuile-ci vit, les deux disent la même chose. */}
        <span className="t-label tile-hint">{fr.dashboard.forecastHint}</span>
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
        <span className="t-label tile-hint">{hint}</span>
      </div>
    </Tile>
  )
}
