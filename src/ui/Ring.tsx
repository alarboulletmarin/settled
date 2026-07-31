import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type RingSegment = {
  id: string
  /** Part du total, entre 0 et 1. */
  value: number
  color: string
  label: string
}

export type RingProps = {
  size?: number
  thickness?: number
  /** Jauge : une seule valeur entre 0 et 1. Ignoré si `segments` est fourni. */
  value?: number
  segments?: readonly RingSegment[]
  color?: string
  trackColor?: string
  /** Contenu central, typiquement un <Amount />. */
  children?: ReactNode
  /** Étiquette du graphique pour un lecteur d'écran. */
  label: string
  /** Lecture textuelle du graphique — exigée par le DS §8. */
  srText?: string
  className?: string
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

type PlacedArc = { segment: RingSegment; arc: number; offset: number }

/** Convertit les parts en longueurs d'arc cumulées, une seule fois par rendu. */
function layoutArcs(
  segments: readonly RingSegment[],
  scaleFactor: number,
  circumference: number,
): PlacedArc[] {
  const placed: PlacedArc[] = []
  let cursor = 0
  for (const segment of segments) {
    const arc = clamp01(Math.max(0, segment.value) * scaleFactor) * circumference
    placed.push({ segment, arc, offset: cursor })
    cursor += arc
  }
  return placed
}

/**
 * L'anneau signature : épaisseur 12px, extrémités arrondies, départ à midi,
 * sens horaire, piste en --surface-2 (DS §6). Progression du mois, jauge et
 * donut de répartition sont le même composant.
 */
export function Ring({
  size = 160,
  thickness = 12,
  value = 0,
  segments,
  color = 'var(--accent-2)',
  trackColor = 'var(--surface-2)',
  children,
  label,
  srText,
  className,
}: RingProps) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const drawn = segments ?? [{ id: 'value', value: clamp01(value), color, label }]
  const total = drawn.reduce((acc, s) => acc + Math.max(0, s.value), 0)
  const scaleFactor = total > 1 ? 1 / total : 1
  /* Les extrémités arrondies débordent de thickness/2 de chaque côté : on
     retire cette longueur pour que deux segments voisins ne se chevauchent pas. */
  const gap = drawn.length > 1 ? thickness : 0
  const arcs = layoutArcs(drawn, scaleFactor, circumference)

  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        className="ring-svg col-start-1 row-start-1"
        width={size}
        height={size}
        viewBox={`0 0 ${String(size)} ${String(size)}`}
        role="img"
        aria-label={label}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        {arcs.map(({ segment, arc, offset }) => {
          if (arc <= 0) return null
          const drawnLength = Math.max(arc - gap, 0.01)
          return (
            <circle
              key={segment.id}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${String(drawnLength)} ${String(circumference)}`}
              strokeDashoffset={-(offset + gap / 2)}
            />
          )
        })}
      </svg>
      {children !== undefined && (
        <div className="col-start-1 row-start-1 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
      {srText !== undefined && <p className="sr-only-text">{srText}</p>}
    </div>
  )
}
