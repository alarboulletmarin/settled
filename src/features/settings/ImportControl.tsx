import { useRef, useState } from 'react'
import { fr } from '@/i18n/fr'
import { ImportError, type MigrationResult, parseImport } from '@/persistence/transfer'
import { useStore } from '@/store/store'
import { Button, type ButtonVariant } from '@/ui/Button'
import { toast } from '@/ui/toast'

/**
 * Choisir un fichier, le relire, puis confirmer — le geste du cahier §4.8.
 *
 * Le composant vit à part pour être posé aussi bien dans les réglages qu'au
 * premier lancement : quelqu'un qui restaure une sauvegarde sur un nouvel
 * appareil arrive sur l'onboarding, et devait jusqu'ici inventer un foyer
 * avant de pouvoir remplacer ce qu'il venait de créer.
 *
 * Le fichier est lu et validé d'abord : on ne demande de confirmer qu'un import
 * viable, jamais un fichier qui échouera ensuite.
 */
export function ImportControl({
  variant = 'secondary',
  className,
}: {
  variant?: ButtonVariant
  className?: string
}) {
  const replaceData = useStore((s) => s.replaceData)
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<MigrationResult | null>(null)

  const stage = async (file: File): Promise<void> => {
    try {
      setPending(parseImport(await file.text()))
    } catch (error) {
      toast(error instanceof ImportError ? error.message : fr.settings.importHint, 'danger')
    }
  }

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void stage(file)
        }}
      />
      {pending === null ? (
        <Button
          variant={variant}
          {...(className === undefined ? {} : { className })}
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
                void replaceData(pending.data).then(() => {
                  setPending(null)
                  toast(pending.migrated ? fr.settings.importMigrated : fr.settings.imported)
                })
              }}
            >
              {fr.common.confirm}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
