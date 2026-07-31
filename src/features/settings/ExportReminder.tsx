import { useState } from 'react'
import { Link } from 'react-router-dom'
import { today } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { readLastExport, shouldRemindExport } from '@/persistence/transfer'
import { useHasAnyData } from '@/store/selectors'
import { IconButton } from '@/ui/Button'
import { Close } from '@/ui/Icons'

/**
 * Rappel d'export au-delà de trente jours (cahier §4.8). Écarté, il ne revient
 * pas avant le prochain démarrage : les données vivent dans ce navigateur, mais
 * insister à chaque écran serait du harcèlement.
 */
export function ExportReminder() {
  const hasData = useHasAnyData()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !shouldRemindExport(readLastExport(), today(), hasData)) return null

  return (
    <aside className="tile mb-4 flex flex-wrap items-center gap-3 p-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="t-body">{fr.settings.reminderTitle}</p>
        <p className="t-label">{fr.settings.reminderBody}</p>
      </div>
      <Link
        to="/reglages"
        className="inline-flex h-11 items-center justify-center rounded-input bg-accent px-5 font-medium text-accent-fg"
      >
        {fr.settings.export}
      </Link>
      <IconButton
        label={fr.settings.reminderDismiss}
        onClick={() => {
          setDismissed(true)
        }}
      >
        <Close size={18} />
      </IconButton>
    </aside>
  )
}
