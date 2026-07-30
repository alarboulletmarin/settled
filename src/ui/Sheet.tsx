import { type ReactNode, useEffect, useRef } from 'react'
import { fr } from '@/i18n/fr'
import { cn } from '@/lib/cn'
import { IconButton } from './Button'
import { Close } from './Icons'

export type SheetProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Zone d'actions collée en bas, hors du défilement. */
  footer?: ReactNode
}

/**
 * Feuille modale. S'appuie sur <dialog> natif : le piège de focus, la touche
 * Échap et l'inertie de l'arrière-plan sont fournis par le navigateur, donc
 * corrects. Feuille montante sur mobile, boîte centrée au-delà.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Un clic sur le fond ferme ; un clic dans la feuille ne remonte pas.
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        'surface m-0 max-h-dvh w-full bg-transparent p-0 text-text backdrop:bg-black/40',
        'mt-auto sm:m-auto sm:max-w-lg',
      )}
    >
      <div
        className={cn(
          'flex max-h-[90dvh] flex-col bg-surface text-text',
          'rounded-t-tile sm:rounded-tile',
        )}
      >
        <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="t-section min-w-0 truncate">{title}</h2>
          <IconButton label={fr.common.close} onClick={onClose}>
            <Close />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>

        {/* Les actions se partagent la largeur à parts égales : `w-full` sur
            chacune les ferait déborder du pied de feuille. */}
        {footer !== undefined && (
          <footer className="flex gap-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-0">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  )
}
