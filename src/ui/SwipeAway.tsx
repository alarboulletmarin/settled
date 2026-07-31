import { type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/** Au-delà, le doigt a dit « enlève-moi » ; en deçà, le bandeau revient. */
const THRESHOLD = 56

/**
 * Rend un bandeau balayable vers le haut, au doigt comme à la souris. Les
 * Pointer Events couvrent les deux sans code séparé.
 *
 * `touch-action: pan-x` est ce qui rend le geste possible : sans lui, le
 * navigateur préempte le mouvement vertical pour faire défiler la page et
 * n'envoie plus aucun `pointermove`. La contrepartie assumée est qu'on ne fait
 * pas défiler la page en partant du bandeau — mais on l'écarte, ce qui est
 * précisément ce qu'on voulait faire.
 */
export function SwipeAway({
  onDismiss,
  children,
  className,
  label,
}: {
  onDismiss: () => void
  children: ReactNode
  className?: string
  /** Nom accessible du bandeau, le geste n'étant pas annonçable. */
  label?: string
}) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef<number | null>(null)

  const end = (): void => {
    startY.current = null
    setDragging(false)
    if (offset <= -THRESHOLD) onDismiss()
    else setOffset(0)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>): void => {
    // Le geste ne part jamais d'un bouton : sinon viser la croix ou le lien
    // d'export déclencherait un micro-glissement au lieu d'un clic.
    if ((event.target as HTMLElement).closest('button, a, input, select')) return
    startY.current = event.clientY
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    if (startY.current === null) return
    // Vers le haut seulement : tirer vers le bas ne veut rien dire ici.
    setOffset(Math.min(0, event.clientY - startY.current))
  }

  const style: CSSProperties = {
    transform: offset === 0 ? undefined : `translateY(${String(offset)}px)`,
    opacity: offset === 0 ? undefined : Math.max(0.2, 1 + offset / (THRESHOLD * 2)),
    touchAction: 'pan-x',
  }

  return (
    <aside
      aria-label={label}
      className={cn(
        'relative select-none',
        // Pendant le glissement, suivre le doigt sans retard ; au relâchement,
        // le retour à zéro s'anime.
        !dragging && 'transition-[transform,opacity] duration-[var(--dur)] ease-ds',
        className,
      )}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {children}
    </aside>
  )
}
