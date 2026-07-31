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
        'surface m-0 w-full bg-transparent p-0 text-text backdrop:bg-black/40',
        // La feuille de style du navigateur pose `max-width` et `max-height:
        // calc(100% - 6px - 2em)` sur tout dialog modal — bordure et padding
        // par défaut comptés en dur, que `p-0` ne retire pas du calcul. Comme
        // `max-width` l'emporte sur `width`, `w-full` seul laisse 38px de vide
        // au bord. Les neutraliser rend la taille à nos classes : la largeur
        // ici, la hauteur au `max-h-[90dvh]` du contenu.
        'max-h-none max-w-none',
        'mt-auto sm:m-auto sm:max-w-lg',
      )}
    >
      <div
        className={cn(
          'flex max-h-[90dvh] flex-col bg-surface text-text',
          'rounded-t-tile sm:rounded-tile',
        )}
      >
        {/* La poignée dit qu'on est sur une feuille montante, et donne au pouce
            un repère au bord de l'écran. Sans objet sur une boîte centrée. */}
        <div
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-chip bg-surface-2 sm:hidden"
        />

        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="t-section min-w-0 truncate">{title}</h2>
          <IconButton label={fr.common.close} onClick={onClose}>
            <Close />
          </IconButton>
        </header>

        {/* Sans pied de feuille, c'est le contenu qui doit passer au-dessus de
            l'indicateur d'accueil : il colle sinon au bord bas de l'écran, où
            le système le recouvre. */}
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto px-5',
            footer === undefined ? 'pb-[max(1.5rem,env(safe-area-inset-bottom))]' : 'pb-5',
          )}
        >
          {children}
        </div>

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
