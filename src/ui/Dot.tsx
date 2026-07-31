import { cn } from '@/lib/cn'

export type DotProps = {
  color: string
  size?: number
  /** Un `planned` porte un contour en pointillés (DS §6). */
  outlined?: boolean
  className?: string
}

/** La pastille de couleur — catégorie ou membre. Jamais porteuse de sens seule. */
export function Dot({ color, size = 8, outlined = false, className }: DotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 rounded-chip', className)}
      style={{
        width: size,
        height: size,
        backgroundColor: outlined ? 'transparent' : color,
        border: outlined ? `1.5px dashed ${color}` : undefined,
      }}
    />
  )
}
