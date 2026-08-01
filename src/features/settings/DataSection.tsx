import { useState } from 'react'
import { today } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { formatDate, tpl } from '@/i18n/format'
import {
  exportFilename,
  markExported,
  readLastExport,
  serializeData,
} from '@/persistence/transfer'
import { useStore } from '@/store/store'
import { Button } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Eyebrow } from '@/ui/Eyebrow'
import { DataIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'
import { ImportControl } from './ImportControl'

/** Déclenche le téléchargement du document, sans passer par un serveur. */
function download(content: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function DataSection() {
  const data = useStore((s) => s.data)
  const resetAll = useStore((s) => s.resetAll)
  const [lastExport, setLastExport] = useState(readLastExport)
  const [confirming, setConfirming] = useState(false)

  const doExport = (): void => {
    const on = today()
    download(serializeData(data), exportFilename(on))
    markExported(on)
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
            void resetAll().then(() => {
              setConfirming(false)
              toast(fr.settings.resetDone)
            })
          }}
        />
      </div>
    </Tile>
  )
}
