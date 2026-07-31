import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { IconComponent } from './Icons'

/**
 * L'étiquette d'une tuile — mono 11px majuscules dans une pilule. Une tuile
 * n'a pas de titre, elle a un eyebrow (DS §6). C'est lui qui donne le rythme.
 *
 * L'icône est un repère, pas un ornement : à onze pixels et en majuscules, un
 * libellé se relit plus qu'il ne se reconnaît, et c'est le glyphe qui permet
 * de retrouver la bonne tuile d'un coup d'œil dans la grille.
 */
export function Eyebrow({
  children,
  icon: Icon,
  className,
}: {
  children: ReactNode
  icon?: IconComponent
  className?: string
}) {
  return (
    <span
      className={cn(
        'eyebrow-pill t-eyebrow inline-flex w-fit items-center gap-1.5 rounded-chip px-2 py-1.5',
        className,
      )}
    >
      {Icon !== undefined && <Icon size={13} className="shrink-0" />}
      {children}
    </span>
  )
}
