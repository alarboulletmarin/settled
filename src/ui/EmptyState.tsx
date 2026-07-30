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
    <div
      className={cn('flex flex-col items-center gap-5 px-6 py-10 text-center', className)}
      role="status"
    >
      <Ring size={96} thickness={12} value={0} label={message} />
      <p className="t-body max-w-xs text-muted">{message}</p>
      {actionLabel !== undefined && onAction !== undefined && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
      {children}
    </div>
  )
}
