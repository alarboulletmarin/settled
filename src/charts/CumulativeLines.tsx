/* Deux courbes cumulées, année N contre année N−1. Un trait a besoin d'un
 * contraste de 3:1 : ni lime ni violet-500 n'y arrivent sur fond clair, d'où
 * --accent-2 et --text-muted, qui passent dans les deux thèmes. */

import { cn } from '@/lib/cn'
import { fr } from '@/i18n/fr'
import { type Point, isolatedPoints, polylinePath } from './path'

const HEIGHT = 120
const WIDTH = 240

export type Serie = {
  id: string
  label: string
  /** Un point par mois, en centimes. `null` = mois sans donnée, non tracé. */
  values: (number | null)[]
  color: string
  dashed?: boolean
}

function toPoints(values: readonly (number | null)[], min: number, span: number): Point[] {
  const step = values.length > 1 ? WIDTH / (values.length - 1) : WIDTH
  return values.map((value, index) =>
    value === null
      ? null
      : { x: index * step, y: HEIGHT - ((value - min) / span) * HEIGHT },
  )
}

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
  const all = series.flatMap((serie) => serie.values).filter((v): v is number => v !== null)
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  const span = max - min || 1
  const zeroY = HEIGHT - ((0 - min) / span) * HEIGHT

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <svg
        viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
        role="img"
        aria-label={label}
        className="h-40 w-full"
        preserveAspectRatio="none"
      >
        <line x1={0} y1={zeroY} x2={WIDTH} y2={zeroY} stroke="var(--border)" strokeWidth={1} />
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

      <div className="flex" aria-hidden="true">
        {fr.calendarNames.monthsShort.map((name) => (
          <span key={name} className="t-axis flex-1 text-center">
            {name.slice(0, 1).toUpperCase()}
          </span>
        ))}
      </div>

      <p className="sr-only-text">{srText}</p>
    </div>
  )
}
