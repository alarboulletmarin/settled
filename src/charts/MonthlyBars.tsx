/* Entrées, sorties et solde sur douze mois. Les flux sont des barres — le DS
 * réserve lime et violet au remplissage, et un trait de 2px dans ces teintes
 * serait illisible sur fond clair. Le solde, lui, est la courbe. */

import { useState } from 'react'
import type { MonthPoint } from '@/domain/history'
import type { Money } from '@/domain/money'
import { parseYm } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { NO_VALUE, formatMoney, formatYearMonth, monthNameShort, tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import { Amount } from '@/ui/Amount'
import { useCurrency } from '@/ui/currency'
import { ChartAxis, type AxisTick } from './ChartAxis'
import { ChartCursor } from './ChartCursor'
import { type Point, isolatedPoints, polylinePath } from './path'

const HEIGHT = 120
const SLOT = 24
const BAR = 8
const GAP = 3
/* Le tracé garde six unités de marge en haut et en bas : sans elles, la barre
   du pic et l'extrémité de la courbe se feraient couper par le bord. C'est
   aussi ce qui pose les graduations extrêmes à 5 % et 95 % plutôt qu'aux bords,
   où un libellé centré déborderait de moitié. */
const PAD = 6

/** Ce que la lecture montre, et ce que la légende nommait auparavant. */
const SERIES = [
  { key: 'in' as const, label: fr.history.legendIn, color: 'var(--flow-in)', line: false },
  { key: 'out' as const, label: fr.history.legendOut, color: 'var(--flow-out)', line: false },
  { key: 'balance' as const, label: fr.history.legendBalance, color: 'var(--text)', line: true },
]

export type MonthlyBarsProps = {
  points: readonly MonthPoint[]
  label: string
  srText: string
  className?: string
}

/**
 * Douze mois de flux, et de quoi les lire un par un.
 *
 * Le graphique était muet : ni valeur au survol, ni valeur au focus, ni axe des
 * ordonnées. Connaître un mois se faisait en devinant la hauteur d'une barre,
 * et la seule lecture exacte — `srText` — n'existait que pour les lecteurs
 * d'écran. Le curseur la rend à tout le monde, et le DS §8 y gagne : la lecture
 * accessible n'est plus une compensation, c'est le même geste pour tous.
 */
export function MonthlyBars({ points, label, srText, className }: MonthlyBarsProps) {
  const currency = useCurrency()
  const [active, setActive] = useState<number | null>(null)

  const width = points.length * SLOT
  const peak = points.reduce((max, p) => Math.max(max, p.in, p.out, Math.abs(p.balance)), 0)
  const scale = peak === 0 ? 0 : (HEIGHT / 2 - PAD) / peak
  const zero = HEIGHT / 2

  // Un mois sans donnée n'est pas un solde à zéro : le trait s'y coupe.
  const balance: Point[] = points.map((p, i) =>
    p.hasData ? { x: i * SLOT + SLOT / 2, y: zero - p.balance * scale } : null,
  )

  /* À défaut de désignation, le dernier mois qui porte des données — le plus
     récent qu'on ait quelque chose à dire. `active` est borné au rendu : la
     série peut raccourcir sous un curseur posé plus loin. */
  const lastWithData = points.reduce((last, p, i) => (p.hasData ? i : last), 0)
  const shown = Math.min(active ?? lastWithData, Math.max(points.length - 1, 0))
  const point = points[shown]

  /* Le nom accessible d'un mois porte ses trois chiffres : c'est lui la
     lecture, la ligne visible au-dessus n'en est que le double à l'œil. Un mois
     sans donnée se dit, il ne se chiffre pas (cahier §4.7). */
  const labels = points.map((p) =>
    p.hasData
      ? tpl(
          fr.history.srMonthRead,
          formatYearMonth(p.ym),
          formatMoney(p.in, currency, false),
          formatMoney(p.out, currency, false),
          formatMoney(p.balance, currency, false),
        )
      : tpl(fr.history.srMonthNoData, formatYearMonth(p.ym)),
  )

  const money = formatMoney
  const ticks: AxisTick[] =
    peak === 0
      ? [{ pct: 50, text: money(0 as Money, currency, false) }]
      : [
          { pct: (PAD / HEIGHT) * 100, text: money(peak as Money, currency, false) },
          { pct: 50, text: money(0 as Money, currency, false) },
          { pct: ((HEIGHT - PAD) / HEIGHT) * 100, text: money(-peak as Money, currency, false) },
        ]

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* La lecture au-dessus du tracé, et non dessous. Dessous, la bande des
          mois doit rester collée au tracé dont elle est l'axe : la lecture s'y
          retrouverait à deux blocs de ce qu'elle décrit — et sous le pouce
          pendant qu'on la fait défiler. Au-dessus, elle se lit comme le chiffre
          d'une tuile, ce qui est le rythme de tout le reste.
          Elle a repris la légende plutôt que de s'ajouter à elle : les deux
          disaient les trois mêmes mots, l'une avec des valeurs et l'autre sans.
          `aria-hidden` — chaque mois porte déjà sa lecture complète sur le
          curseur, l'annoncer une seconde fois doublerait chaque flèche. */}
      <div aria-hidden="true" className="flex flex-col gap-1">
        <span className="t-eyebrow text-muted">{formatYearMonth(point?.ym ?? '')}</span>
        <div className="grid grid-cols-3 gap-2">
          {SERIES.map((serie) => (
            <div key={serie.key} className="flex min-w-0 flex-col gap-0.5">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className={cn('shrink-0', serie.line ? 'h-0.5 w-4 rounded-chip' : 'h-2.5 w-2.5 rounded-[3px]')}
                  style={{ backgroundColor: serie.color }}
                />
                <span className="t-label min-w-0 truncate">{serie.label}</span>
              </span>
              {point?.hasData === true ? (
                <Amount
                  value={point[serie.key]}
                  size="label"
                  {...(serie.key === 'balance' ? {} : { direction: serie.key })}
                  withCents={false}
                />
              ) : (
                /* Un cadratin, jamais un zéro : le mois n'a pas de donnée, il
                   n'en a pas pour zéro euro. */
                <span className="t-num-label tnum">{NO_VALUE}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <ChartAxis ticks={ticks} height="h-40" />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="relative">
            <svg
              viewBox={`0 0 ${String(width)} ${String(HEIGHT)}`}
              role="img"
              aria-label={label}
              className="h-40 w-full"
              preserveAspectRatio="none"
            >
              {/* La bande du mois lu, derrière les barres. */}
              <rect
                x={shown * SLOT}
                y={0}
                width={SLOT}
                height={HEIGHT}
                fill="var(--surface-2)"
              />
              {/* Les lignes de repère, pleines et non pointillées : un tiret
                  posé dans une échelle non uniforme s'étire avec elle, et la
                  ligne de zéro d'à côté est déjà un trait plein d'un pixel. */}
              {ticks.map((tick) => (
                <line
                  key={tick.pct}
                  x1={0}
                  y1={(tick.pct / 100) * HEIGHT}
                  x2={width}
                  y2={(tick.pct / 100) * HEIGHT}
                  stroke="var(--border)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {points.map((p, index) => {
                const x = index * SLOT + SLOT / 2
                return (
                  <g key={p.ym}>
                    <rect
                      x={x - BAR - GAP / 2}
                      y={zero - p.in * scale}
                      width={BAR}
                      height={Math.max(p.in * scale, 0)}
                      fill="var(--flow-in)"
                    />
                    <rect
                      x={x + GAP / 2}
                      y={zero}
                      width={BAR}
                      height={Math.max(p.out * scale, 0)}
                      fill="var(--flow-out)"
                    />
                  </g>
                )
              })}
              <path
                d={polylinePath(balance)}
                fill="none"
                stroke="var(--text)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {isolatedPoints(balance).map((p) => (
                <circle key={p.x} cx={p.x} cy={p.y} r={2} fill="var(--text)" />
              ))}
            </svg>

            <ChartCursor
              labels={labels}
              shown={shown}
              onShow={setActive}
              label={fr.a11y.chartCursor}
            />
          </div>

          <div className="chart-months flex" aria-hidden="true">
            {points.map((p) => (
              <span key={p.ym} className="t-axis min-w-0 flex-1 text-center">
                <span className="chart-month-short">
                  {monthNameShort(parseYm(p.ym).m).slice(0, 1).toUpperCase()}
                </span>
                <span className="chart-month-long">{monthNameShort(parseYm(p.ym).m)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* La série entière d'un coup, que douze noms accessibles ne remplacent
          pas : c'est la vue d'ensemble, eux sont la lecture point par point. */}
      <p className="sr-only-text">{srText}</p>
    </div>
  )
}
