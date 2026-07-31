import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * L'étiquette d'une tuile — mono 11px majuscules dans une pilule. Une tuile
 * n'a pas de titre, elle a un eyebrow (DS §6). C'est lui qui donne le rythme.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'eyebrow-pill t-eyebrow inline-flex w-fit items-center rounded-chip px-2 py-1.5',
        className,
      )}
    >
      {children}
    </span>
  )
}
