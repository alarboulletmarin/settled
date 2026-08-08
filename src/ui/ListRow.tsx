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
        <span className={cn('t-body truncate', planned && 'text-muted')}>{label}</span>
        {meta !== undefined && <span className="t-axis truncate">{meta}</span>}
      </span>
      {trailing !== undefined && <span className="ml-auto shrink-0 pl-3">{trailing}</span>}
    </>
  )

  /* Le DS pose 60 % d'opacité sur une échéance prévue. Appliquée au texte, elle
     le fait tomber sous le 4,5:1 que le même DS exige : le signal passe donc par
     la pastille en pointillés et par la couleur de texte secondaire. */
  const classes = cn(
    'flex h-14 w-full items-center gap-3 rounded-inner px-3 text-left',
    /* Le pressé autant que le survol : le DS §6 le demande sur tout ce qu'on
       peut actionner, et une ligne de liste est ce qu'on vise le plus au doigt. */
    onClick &&
      'transition-colors duration-[var(--dur)] ease-ds hover:bg-surface-2 active:bg-surface-2',
    className,
  )

  if (!onClick) return <div className={classes}>{content}</div>

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  )
}
