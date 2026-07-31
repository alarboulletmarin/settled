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
  const last = readLastExport()
  if (dismissed || !shouldRemindExport(last, today(), hasData)) return null

  return (
    // Le texte et ses boutons s'empilent tant que la ligne n'est pas tenable :
    // en rangée, un bouton `shrink-0` écrase la phrase sous sa largeur
    // min-content et la fait tomber en colonne d'un mot.
    <aside className="tile mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
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
        <IconButton
          label={fr.settings.reminderDismiss}
          onClick={() => {
            setDismissed(true)
          }}
        >
          <Close size={18} />
        </IconButton>
      </div>
    </aside>
  )
}
