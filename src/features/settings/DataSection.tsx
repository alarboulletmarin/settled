import { useState } from 'react'
import { today } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { formatDate, tpl } from '@/i18n/format'
import { downloadExport, readLastExport } from '@/persistence/transfer'
import { useStore } from '@/store/store'
import { Button } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Eyebrow } from '@/ui/Eyebrow'
import { DataIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'
import { ExampleControl } from './ExampleControl'
import { ImportControl } from './ImportControl'
import { SchemaControl } from './SchemaControl'

export function DataSection() {
  const data = useStore((s) => s.data)
  const resetAll = useStore((s) => s.resetAll)
  const [lastExport, setLastExport] = useState(readLastExport)
  const [confirming, setConfirming] = useState(false)

  const doExport = (): void => {
    const on = today()
    downloadExport(data, on)
    setLastExport(on)
    toast(fr.settings.exported)
  }

  return (
    <Tile className="gap-4">
      <Eyebrow icon={DataIcon}>{fr.settings.data}</Eyebrow>

      <div className="flex flex-col gap-2">
        <p className="t-label">{fr.settings.exportHint}</p>
        <p className="t-label">
          {lastExport === null
            ? fr.settings.neverExported
            : tpl(fr.settings.lastExport, formatDate(lastExport))}
        </p>
        <Button onClick={doExport} className="w-fit">
          {fr.settings.export}
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="t-label">{fr.settings.importHint}</p>
        <ImportControl className="w-fit" />
      </div>

      {/* Le schéma se lit juste sous l'import, parce que c'est l'import qu'il
          sert : il n'a d'autre usage que de faire exister le fichier qu'on
          déposera à la ligne du dessus. */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="t-label">{fr.settings.schema}</p>
        <p className="t-label">{fr.settings.schemaHint}</p>
        <SchemaControl />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="t-label">{fr.settings.example}</p>
        <p className="t-label">{fr.settings.exampleHint}</p>
        <ExampleControl className="w-fit" />
      </div>

      {/* Triple confirmation : c'est le seul geste de l'app qui n'épargne rien,
          et rien n'est enregistré ailleurs que dans ce navigateur. */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="t-label">{fr.settings.resetHint}</p>
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => {
            setConfirming(true)
          }}
        >
          {fr.settings.reset}
        </Button>
        <ConfirmDialog
          open={confirming}
          title={fr.settings.reset}
          steps={[
            { question: fr.settings.resetConfirm1, action: fr.common.confirm },
            { question: fr.settings.resetConfirm2, action: fr.common.confirm },
            { question: fr.settings.resetConfirm3, action: fr.settings.reset },
          ]}
          onCancel={() => {
            setConfirming(false)
          }}
          onConfirm={() => {
            void resetAll()
              .then(() => {
                setConfirming(false)
                setLastExport(null)
                toast(fr.settings.resetDone)
              })
              // « Données effacées » sur un effacement qui n'a pas eu lieu est
              // le pire des messages : on croit reparti de zéro, et tout est
              // encore là.
              .catch(() => {
                setConfirming(false)
                toast(fr.settings.resetFailed, 'danger')
              })
          }}
        />
      </div>
    </Tile>
  )
}
