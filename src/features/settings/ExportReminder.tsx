import { useState } from 'react'
import { Link } from 'react-router-dom'
import { today } from '@/domain/date'
import { fr } from '@/i18n/fr'
import {
  dismissReminder,
  readLastExport,
  readReminderDismissed,
  shouldRemindExport,
} from '@/persistence/transfer'
import { useHasAnyData } from '@/store/selectors'
import { IconButton } from '@/ui/Button'
import { Close } from '@/ui/Icons'
import { SwipeAway } from '@/ui/SwipeAway'

/**
 * Rappel d'export au-delà de trente jours (cahier §4.8). Écarté — à la croix
 * ou d'un balayage vers le haut — il ne revient pas avant le cycle suivant :
 * le choix est écrit sur l'appareil, pas seulement dans le rendu en cours. Ce
 * composant est remonté à chaque changement d'écran, un état local ne tiendrait
 * pas le temps d'aller au calendrier.
 */
export function ExportReminder() {
  const hasData = useHasAnyData()
  const [dismissedNow, setDismissedNow] = useState(false)
  const last = readLastExport()

  const hide = (): void => {
    dismissReminder()
    setDismissedNow(true)
  }

  if (dismissedNow) return null
  if (!shouldRemindExport(last, today(), hasData, readReminderDismissed())) return null

  return (
    <SwipeAway onDismiss={hide} label={fr.settings.reminderLabel} className="mb-4 block">
      {/* Le texte et ses boutons s'empilent tant que la ligne n'est pas tenable :
          en rangée, un bouton `shrink-0` écrase la phrase sous sa largeur
          min-content et la fait tomber en colonne d'un mot. */}
      <div className="tile flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Le jour où l'on n'a jamais exporté, parler d'un « dernier export »
              décrit quelque chose qui n'existe pas. */}
          <p className="t-body">
            {last === null ? fr.settings.reminderTitleNever : fr.settings.reminderTitle}
          </p>
          <p className="t-label">{fr.settings.reminderBody}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <Link
            to="/reglages"
            className="inline-flex h-11 items-center justify-center rounded-input bg-accent px-5 font-medium text-accent-fg"
          >
            {fr.settings.export}
          </Link>
          <IconButton label={fr.settings.reminderDismiss} onClick={hide}>
            <Close size={18} />
          </IconButton>
        </div>
      </div>
    </SwipeAway>
  )
}
