/* Entrées, sorties et solde sur douze mois. Les flux sont des barres — le DS
 * réserve lime et violet au remplissage, et un trait de 2px dans ces teintes
 * serait illisible sur fond clair. Le solde, lui, est la courbe. */

import type { MonthPoint } from '@/domain/history'
import { parseYm } from '@/domain/date'
import { monthNameShort } from '@/i18n/format'
import { cn } from '@/lib/cn'
import { type Point, isolatedPoints, polylinePath } from './path'

const HEIGHT = 120
const SLOT = 24
const BAR = 8
const GAP = 3

export type MonthlyBarsProps = {
  points: readonly MonthPoint[]
  label: string
  srText: string
  className?: string
}

export function MonthlyBars({ points, label, srText, className }: MonthlyBarsProps) {
  const width = points.length * SLOT
  const peak = points.reduce((max, p) => Math.max(max, p.in, p.out, Math.abs(p.balance)), 0)
  const scale = peak === 0 ? 0 : (HEIGHT / 2 - 6) / peak
  const zero = HEIGHT / 2

  // Un mois sans donnée n'est pas un solde à zéro : le trait s'y coupe.
  const balance: Point[] = points.map((p, i) =>
    p.hasData ? { x: i * SLOT + SLOT / 2, y: zero - p.balance * scale } : null,
  )

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <svg
        viewBox={`0 0 ${String(width)} ${String(HEIGHT)}`}
        role="img"
        aria-label={label}
        className="h-40 w-full"
        preserveAspectRatio="none"
      >
        <line x1={0} y1={zero} x2={width} y2={zero} stroke="var(--border)" strokeWidth={1} />
        {points.map((point, index) => {
          const x = index * SLOT + SLOT / 2
          return (
            <g key={point.ym}>
              <rect
                x={x - BAR - GAP / 2}
                y={zero - point.in * scale}
                width={BAR}
                height={Math.max(point.in * scale, 0)}
                fill="var(--flow-in)"
              />
              <rect
                x={x + GAP / 2}
                y={zero}
                width={BAR}
                height={Math.max(point.out * scale, 0)}
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
        {isolatedPoints(balance).map((point) => (
          <circle key={point.x} cx={point.x} cy={point.y} r={2} fill="var(--text)" />
        ))}
      </svg>

      <div className="flex" aria-hidden="true">
        {points.map((point) => (
          <span key={point.ym} className="t-axis flex-1 text-center">
            {monthNameShort(parseYm(point.ym).m)}
          </span>
        ))}
      </div>

      <p className="sr-only-text">{srText}</p>
    </div>
  )
}
