import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { ChevronDown } from './Icons'

export type DisclosureProps = {
  /** Ce que porte l'en-tête, à gauche du chevron replié. */
  title: ReactNode
  /** Une lecture de droite : un total, un compte. Visible même replié. */
  trailing?: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  className?: string
}

/**
 * Section repliable, sur `<details>` natif.
 *
 * Le natif plutôt qu'un bouton et un `aria-expanded` posés à la main : il
 * porte déjà l'état pour un lecteur d'écran, répond à l'espace et à l'entrée,
 * et la recherche dans la page du navigateur sait ouvrir ce qui est replié.
 *
 * Piloté depuis le parent — c'est ce qui permet un « tout replier » qui vaut
 * pour toutes les sections d'un coup. `onToggle` reflète l'état réel du DOM,
 * y compris quand c'est le navigateur qui l'a ouvert.
 */
export function Disclosure({
  title,
  trailing,
  open,
  onOpenChange,
  children,
  className,
}: DisclosureProps) {
  return (
    <details
      open={open}
      onToggle={(event) => {
        onOpenChange(event.currentTarget.open)
      }}
      className={cn('flex flex-col', className)}
    >
      <summary
        className={cn(
          'flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-inner px-3',
          'transition-colors duration-[var(--dur)] ease-ds hover:bg-surface-2',
          // Safari garde son triangle sans ce pseudo-élément.
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 transition-transform duration-[var(--dur)] ease-ds',
            !open && '-rotate-90',
          )}
        />
        <span className="min-w-0 flex-1">{title}</span>
        {trailing !== undefined && <span className="shrink-0">{trailing}</span>}
      </summary>
      {children}
    </details>
  )
}
