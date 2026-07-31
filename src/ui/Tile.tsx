import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Formats autorisés par le DS §5. Rien d'autre, sinon la grille se délite. */
export type TileSpan = '2x1' | '2x2' | '4x1' | '4x2' | '6x2'

export type TileVariant = 'default' | 'accent' | 'accent-2'

export type TileProps = {
  children: ReactNode
  variant?: TileVariant
  /** Omis, la tuile n'est pas posée dans une grille bento et occupe son flux. */
  span?: TileSpan
  className?: string
  /** Rend la tuile actionnable. La cible tactile fait alors toute la tuile. */
  onClick?: () => void
  label?: string
}

const VARIANT_CLASS: Record<TileVariant, string> = {
  default: '',
  accent: 'tile--accent',
  'accent-2': 'tile--accent-2',
}

const PADDING = 'p-5 md:p-6'

/**
 * Une tuile d'une seule rangée fait 88px de haut : à 20px de cadre il ne reste
 * que 48px, et l'eyebrow avec le chiffre en demandent 57. Elle resserre donc
 * son cadre — sans quoi la lecture secondaire, puis le chiffre lui-même, se
 * coupent au bord. Le chiffre s'y réduit aussi, dans `base.css`.
 */
const PADDING_FLAT = 'p-4'
const FLAT: readonly TileSpan[] = ['2x1', '4x1']

export function Tile({ children, variant = 'default', span, className, onClick, label }: TileProps) {
  const classes = cn(
    'tile flex min-w-0 flex-col overflow-hidden',
    span !== undefined && FLAT.includes(span) ? PADDING_FLAT : PADDING,
    VARIANT_CLASS[variant],
    span && `span-${span}`,
    className,
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          classes,
          'text-left transition-[transform,box-shadow] duration-[var(--dur)] ease-ds',
          'hover:-translate-y-px active:translate-y-0',
        )}
      >
        {children}
      </button>
    )
  }

  return (
    <section className={classes} aria-label={label}>
      {children}
    </section>
  )
}

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('bento', className)}>{children}</div>
}
