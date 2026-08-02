import { today } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { downloadExport } from '@/persistence/transfer'
import { useStore } from '@/store/store'
import { Button } from '@/ui/Button'
import { toast } from '@/ui/toast'

/**
 * Ce qui manquait le plus : le seul signal qu'une écriture a échoué.
 *
 * Il ne s'écarte pas. `ExportReminder` porte une croix et un balayage parce
 * qu'il rappelle une bonne habitude ; ici la condition est en cours, et un
 * bandeau qu'on chasse laisserait quelqu'un continuer à saisir dans une app qui
 * n'enregistre plus. Il disparaît quand la première écriture repasse — c'est le
 * `onWritten` du writer qui l'éteint, jamais un clic.
 *
 * L'export part de la copie en mémoire, et c'est le point : c'est le disque qui
 * est en retard, l'écran est intact. L'écran de secours de l'`ErrorBoundary`
 * fait l'inverse, pour la raison inverse.
 */
export function StorageAlert() {
  const error = useStore((s) => s.error)
  const data = useStore((s) => s.data)

  if (error?.kind !== 'write') return null

  return (
    <div
      role="alert"
      aria-label={fr.storage.writeFailedLabel}
      className="tile mb-4 flex flex-col gap-3 border-danger p-4 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="t-body font-semibold text-danger-text">{error.message}</p>
        <p className="t-label">{fr.storage.writeFailedBody}</p>
      </div>
      <Button
        className="shrink-0 self-end sm:self-auto"
        onClick={() => {
          downloadExport(data, today())
          toast(fr.settings.exported)
        }}
      >
        {fr.storage.exportNow}
      </Button>
    </div>
  )
}
