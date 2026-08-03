import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { Ring } from './Ring'

export type EmptyStateProps = {
  /** Une invitation, pas un constat (DS §7). */
  message: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
  className?: string
}

/** Un anneau vide, une phrase qui dit quoi faire, un bouton. Rien d'autre. */
export function EmptyState({
  message,
  actionLabel,
  onAction,
  children,
  className,
}: EmptyStateProps) {
  return (
    /* Sans `role="status"` : c'était une région live posée en permanence sur un
       texte qui ne change jamais. Une région live sert à annoncer ce qui arrive
       après coup — un état vide, lui, est déjà là quand l'écran s'annonce, et
       il se lit dans le flux comme le reste. */
    <div className={cn('flex flex-col items-center gap-5 px-6 py-10 text-center', className)}>
      <Ring size={96} thickness={12} value={0} label={message} />
      <p className="t-body max-w-xs text-muted">{message}</p>
      {actionLabel !== undefined && onAction !== undefined && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
      {children}
    </div>
  )
}
