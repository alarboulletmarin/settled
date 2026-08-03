/* Deux courbes cumulées, année N contre année N−1. Un trait a besoin d'un
 * contraste de 3:1 : ni lime ni violet-500 n'y arrivent sur fond clair, d'où
 * --accent-2 et --text-muted, qui passent dans les deux thèmes. */

import { useState } from 'react'
import type { Money } from '@/domain/money'
import { fr } from '@/i18n/fr'
import { NO_VALUE, formatMoney, monthName, tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import { useCurrency } from '@/ui/currency'
import { ChartAxis, type AxisTick } from './ChartAxis'
import { ChartCursor } from './ChartCursor'
import { type Point, isolatedPoints, polylinePath } from './path'

const HEIGHT = 120
const WIDTH = 240
/* Comme sur les barres : sans marge, le point du maximum tombe exactement sur
   le bord et son trait de deux pixels s'y coupe en deux. Elle pose aussi les
   graduations extrêmes à 5 % et 95 %, où leur libellé tient en entier. */
const PAD = 6

export type Serie = {
  id: string
  label: string
  /** Un point par mois, en centimes. `null` = mois sans donnée, non tracé. */
  values: (number | null)[]
  color: string
  dashed?: boolean
}

/**
 * Un mois est une période, pas un instant : son point tombe au milieu de sa
 * tranche.
 *
 * Le tracé partait auparavant du bord gauche pour arriver au bord droit —
 * `WIDTH / (length - 1)` —, quand la bande des mois sous lui, et désormais les
 * douze périodes du curseur, découpent la largeur en douze parts égales. Les
 * deux ne parlaient pas des mêmes abscisses, et l'écart atteignait une
 * demi-tranche aux extrémités : le point de janvier se lisait à gauche de la
 * lettre qui le nomme.
 */
function toPoints(values: readonly (number | null)[], min: number, span: number): Point[] {
  const slot = WIDTH / values.length
  return values.map((value, index) =>
    value === null
      ? null
      : {
          x: index * slot + slot / 2,
          y: PAD + (1 - (value - min) / span) * (HEIGHT - 2 * PAD),
        },
  )
}

/**
 * Le cumul du solde, mois après mois, sur une année ou deux.
 *
 * Comme les barres des douze derniers mois, il était muet : aucune valeur au
 * survol ni au focus, aucun élément focusable, pas d'axe des ordonnées. Le
 * curseur et l'axe lui rendent la parole ; voir `ChartCursor` pour pourquoi ils
 * sont en HTML par-dessus le SVG plutôt que dedans.
 */
export function CumulativeLines({
  series,
  label,
  srText,
  className,
}: {
  series: readonly Serie[]
  label: string
  srText: string
  className?: string
}) {
  const currency = useCurrency()
  const [active, setActive] = useState<number | null>(null)

  const all = series.flatMap((serie) => serie.values).filter((v): v is number => v !== null)
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  const span = max - min || 1
  const yOf = (value: number): number => PAD + (1 - (value - min) / span) * (HEIGHT - 2 * PAD)

  const months = series[0]?.values.length ?? fr.calendarNames.monthsShort.length
  const valueAt = (serie: Serie, index: number): number | null => serie.values[index] ?? null

  /* Le dernier mois que sait chiffrer l'**année choisie**, et non n'importe
     laquelle des deux. Une année en cours s'arrête au mois courant quand celle
     d'avant va jusqu'à décembre : la lecture s'ouvrait alors sur un décembre où
     l'année qu'on regarde n'a rien, et son premier mot était un tiret. À défaut
     — une année choisie encore vide —, on retombe sur ce que la comparaison
     sait dire. */
  const lastIn = (kept: readonly Serie[]): number =>
    Array.from({ length: months }, (_, i) => i).reduce(
      (last, index) => (kept.some((serie) => valueAt(serie, index) !== null) ? index : last),
      0,
    )
  const first = series[0]
  const lastWithData = first === undefined ? 0 : lastIn([first]) || lastIn(series)
  const shown = Math.min(active ?? lastWithData, Math.max(months - 1, 0))

  const read = (index: number): string =>
    series
      .map((serie) => {
        const value = valueAt(serie, index)
        return `${serie.label} ${value === null ? NO_VALUE : formatMoney(value as Money, currency, false)}`
      })
      .join(', ')
  const labels = Array.from({ length: months }, (_, index) =>
    tpl(fr.history.srCumulativeRead, monthName(index + 1), read(index)),
  )

  /* Trois graduations, dont deux peuvent tomber sur la même valeur : `min` est
     borné à zéro par le haut et `max` par le bas, donc une année qui ne passe
     jamais en négatif a son minimum *à* zéro. On ne l'écrit pas deux fois. */
  const ticks: AxisTick[] = []
  for (const value of [max, 0, min]) {
    if (ticks.some((tick) => tick.text === formatMoney(value as Money, currency, false))) continue
    ticks.push({
      pct: (yOf(value) / HEIGHT) * 100,
      text: formatMoney(value as Money, currency, false),
    })
  }

  const slot = WIDTH / months

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* La lecture au-dessus du tracé, qui a repris la légende — voir
          `MonthlyBars` pour le raisonnement, qui vaut mot pour mot ici. */}
      <div aria-hidden="true" className="flex flex-col gap-1">
        <span className="t-eyebrow text-muted">{monthName(shown + 1)}</span>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {series.map((serie) => {
            const value = valueAt(serie, shown)
            return (
              <div key={serie.id} className="flex min-w-0 flex-col gap-0.5">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-0.5 w-4 shrink-0 rounded-chip"
                    style={{
                      backgroundColor: serie.color,
                      opacity: serie.dashed === true ? 0.7 : 1,
                    }}
                  />
                  <span className="t-label tnum min-w-0 truncate">{serie.label}</span>
                </span>
                <span className="t-num-label tnum">
                  {value === null ? NO_VALUE : formatMoney(value as Money, currency, false)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <ChartAxis ticks={ticks} height="h-40" />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="relative">
            <svg
              viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
              role="img"
              aria-label={label}
              className="h-40 w-full"
              preserveAspectRatio="none"
            >
              <rect x={shown * slot} y={0} width={slot} height={HEIGHT} fill="var(--surface-2)" />
              {ticks.map((tick) => (
                <line
                  key={tick.pct}
                  x1={0}
                  y1={(tick.pct / 100) * HEIGHT}
                  x2={WIDTH}
                  y2={(tick.pct / 100) * HEIGHT}
                  stroke="var(--border)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {series.map((serie) => (
                <path
                  key={serie.id}
                  d={polylinePath(toPoints(serie.values, min, span))}
                  fill="none"
                  stroke={serie.color}
                  strokeWidth={2}
                  strokeDasharray={serie.dashed === true ? '4 4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {series.flatMap((serie) =>
                isolatedPoints(toPoints(serie.values, min, span)).map((point) => (
                  <circle
                    key={`${serie.id}-${String(point.x)}`}
                    cx={point.x}
                    cy={point.y}
                    r={2.5}
                    fill={serie.color}
                  />
                )),
              )}
            </svg>

            <ChartCursor
              labels={labels}
              shown={shown}
              onShow={setActive}
              label={fr.a11y.chartCursor}
            />
          </div>

          <div className="chart-months flex" aria-hidden="true">
            {fr.calendarNames.monthsShort.slice(0, months).map((name) => (
              <span key={name} className="t-axis min-w-0 flex-1 text-center">
                <span className="chart-month-short">{name.slice(0, 1).toUpperCase()}</span>
                <span className="chart-month-long">{name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only-text">{srText}</p>
    </div>
  )
}
