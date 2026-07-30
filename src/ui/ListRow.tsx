import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Dot } from './Dot'

export type ListRowProps = {
  color: string
  label: string
  /** Sous-libellé en mono : une date, une périodicité. */
  meta?: string
  /** Typiquement un <Amount />. */
  trailing?: ReactNode
  /** Une échéance prévue s'affiche à 60% d'opacité, pastille en pointillés. */
  planned?: boolean
  onClick?: () => void
  /** Rendu entre la pastille et le libellé — une case à cocher, par exemple. */
  leading?: ReactNode
  className?: string
}

/** Ligne de liste — hauteur 56px, DS §6. */
export function ListRow({
  color,
  label,
  meta,
  trailing,
  planned = false,
  onClick,
  leading,
  className,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <Dot color={color} outlined={planned} />
      <span className="flex min-w-0 flex-col">
        <span className="t-body truncate">{label}</span>
        {meta !== undefined && <span className="t-axis truncate">{meta}</span>}
      </span>
      {trailing !== undefined && <span className="ml-auto shrink-0 pl-3">{trailing}</span>}
    </>
  )

  const classes = cn(
    'flex h-14 w-full items-center gap-3 rounded-inner px-3 text-left',
    planned && 'opacity-60',
    onClick && 'transition-colors duration-[var(--dur)] ease-ds hover:bg-surface-2',
    className,
  )

  if (!onClick) return <div className={classes}>{content}</div>

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  )
}
