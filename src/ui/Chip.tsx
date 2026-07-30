import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Dot } from './Dot'

export type ChipProps = {
  children: ReactNode
  /** Pastille de couleur 8px. Omise pour un filtre sans couleur propre. */
  color?: string
  active?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Pilule pour catégories, membres et filtres. État actif : le fond passe de
 * --surface-2 à --accent, et le texte à --accent-fg (DS §6).
 */
export function Chip({ children, color, active = false, onClick, className }: ChipProps) {
  const classes = cn(
    'inline-flex min-h-9 items-center gap-2 rounded-chip px-3 text-[13px]',
    'transition-colors duration-[var(--dur)] ease-ds',
    active ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-text',
    className,
  )

  if (!onClick) {
    return (
      <span className={classes}>
        {color !== undefined && <Dot color={color} />}
        {children}
      </span>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={classes}>
      {color !== undefined && <Dot color={color} />}
      {children}
    </button>
  )
}
