import { fr } from '@/i18n/fr'
import { cn } from '@/lib/cn'
import { IconButton } from './Button'
import { Close } from './Icons'
import { useToasts } from './toast'

/**
 * Les confirmations d'action. Le nom d'une action ne change pas dans le flux :
 * le bouton dit « Confirmer le mois », le toast dit « Mois confirmé » (DS §7).
 */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-16 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className={cn(
            'surface pointer-events-auto flex max-w-md items-center gap-2 rounded-chip py-2 pr-2 pl-4',
            'border border-border shadow-tile',
            item.tone === 'danger' ? 'bg-danger text-danger-fg' : 'bg-surface text-text',
          )}
        >
          <span className="t-body">{item.message}</span>
          <IconButton
            label={fr.common.close}
            onClick={() => {
              dismiss(item.id)
            }}
          >
            <Close size={16} />
          </IconButton>
        </div>
      ))}
    </div>
  )
}
