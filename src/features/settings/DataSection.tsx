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
  const [resetStep, setResetStep] = useState(0)

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

      {/* Double confirmation, comme l'exige le cahier §4.8. */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="t-label">{fr.settings.resetHint}</p>
        {resetStep === 0 && (
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => {
              setResetStep(1)
            }}
          >
            {fr.settings.reset}
          </Button>
        )}
        {resetStep > 0 && (
          <div className="flex flex-col gap-2 rounded-inner bg-surface-2 p-3">
            <p className="t-body">
              {resetStep === 1 ? fr.settings.resetConfirm1 : fr.settings.resetConfirm2}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setResetStep(0)
                }}
              >
                {fr.common.cancel}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (resetStep === 1) {
                    setResetStep(2)
                    return
                  }
                  void resetAll().then(() => {
                    setResetStep(0)
                    toast(fr.settings.resetDone)
                  })
                }}
              >
                {resetStep === 1 ? fr.common.confirm : fr.settings.reset}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Tile>
  )
}
