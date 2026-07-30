import { useRef, useState } from 'react'
import { today } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { formatDate, tpl } from '@/i18n/format'
import {
  ImportError,
  type MigrationResult,
  exportFilename,
  markExported,
  parseImport,
  readLastExport,
  serializeData,
} from '@/persistence/transfer'
import { useStore } from '@/store/store'
import { Button } from '@/ui/Button'
import { Eyebrow } from '@/ui/Eyebrow'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'

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
  const replaceData = useStore((s) => s.replaceData)
  const resetAll = useStore((s) => s.resetAll)
  const fileInput = useRef<HTMLInputElement>(null)
  const [lastExport, setLastExport] = useState(readLastExport)
  const [resetStep, setResetStep] = useState(0)
  const [pending, setPending] = useState<MigrationResult | null>(null)

  const doExport = (): void => {
    const on = today()
    download(serializeData(data), exportFilename(on))
    markExported(on)
    setLastExport(on)
    toast(fr.settings.exported)
  }

  /** Le fichier est lu et validé d'abord ; on ne confirme qu'un import viable. */
  const stageImport = async (file: File): Promise<void> => {
    try {
      setPending(parseImport(await file.text()))
    } catch (error) {
      toast(error instanceof ImportError ? error.message : fr.settings.importHint, 'danger')
    }
  }

  const applyImport = (result: MigrationResult): void => {
    void replaceData(result.data).then(() => {
      setPending(null)
      toast(result.migrated ? fr.settings.importMigrated : fr.settings.imported)
    })
  }

  return (
    <Tile className="gap-4">
      <Eyebrow>{fr.settings.data}</Eyebrow>

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
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void stageImport(file)
          }}
        />
        {pending === null ? (
          <Button
            variant="secondary"
            className="w-fit"
            onClick={() => {
              fileInput.current?.click()
            }}
          >
            {fr.settings.import}
          </Button>
        ) : (
          <div className="flex flex-col gap-2 rounded-inner bg-surface-2 p-3">
            <p className="t-body">{fr.settings.importConfirm}</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPending(null)
                }}
              >
                {fr.common.cancel}
              </Button>
              <Button
                onClick={() => {
                  applyImport(pending)
                }}
              >
                {fr.common.confirm}
              </Button>
            </div>
          </div>
        )}
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
