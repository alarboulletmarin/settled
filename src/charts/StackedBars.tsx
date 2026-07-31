/* Barres empilées par catégorie, un jour par barre. SVG maison : aucune
 * librairie de graphiques, comme le veut la stack. */

import type { DayTotals } from '@/domain/stats'
import { cn } from '@/lib/cn'

const BAR = 8
const GAP = 4
const HEIGHT = 100

export type StackedBarsProps = {
  days: readonly DayTotals[]
  colorOf: (categoryId: string) => string
  label: string
  srText: string
  className?: string
}

/** Repères d'axe : le 1er, puis tous les 5 jours, puis le dernier. */
function ticks(count: number): number[] {
  const marks = new Set<number>([1, count])
  for (let day = 5; day < count; day += 5) marks.add(day)
  return [...marks].sort((a, b) => a - b)
}

export function StackedBars({ days, colorOf, label, srText, className }: StackedBarsProps) {
  const width = days.length * (BAR + GAP) - GAP
  const peak = days.reduce((max, day) => Math.max(max, day.total), 0)
  const scale = peak === 0 ? 0 : HEIGHT / peak

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-1', className)}>
      {/* Le viewBox est étiré en largeur pour occuper la tuile : tout rayon de
          coin deviendrait une ellipse, les barres restent donc franches. */}
      <svg
        viewBox={`0 0 ${String(width)} ${String(HEIGHT)}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="h-full w-full"
      >
        {days.map((day, index) => {
          const x = index * (BAR + GAP)
          let cursor = HEIGHT
          return (
            <g key={day.date}>
              {day.slices.map((slice) => {
                const height = slice.total * scale
                cursor -= height
                if (height <= 0) return null
                return (
                  <rect
                    key={slice.categoryId}
                    x={x}
                    y={cursor}
                    width={BAR}
                    height={height}
                    fill={colorOf(slice.categoryId)}
                  />
                )
              })}
              {day.total === 0 && (
                <rect x={x} y={HEIGHT - 1} width={BAR} height={1} fill="var(--surface-2)" />
              )}
            </g>
          )
        })}
      </svg>

      <div className="flex justify-between" aria-hidden="true">
        {ticks(days.length).map((day) => (
          <span key={day} className="t-axis tnum">
            {day}
          </span>
        ))}
      </div>

      <p className="sr-only-text">{srText}</p>
    </div>
  )
}
