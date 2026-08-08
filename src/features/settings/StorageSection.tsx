import { useCallback, useEffect, useState } from 'react'
import type { ISODate } from '@/domain/date'
import type { Data } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatBytes, formatDate, tpl } from '@/i18n/format'
import { type StorageUsage, estimateStorage, isPersisted, requestPersistence } from '@/lib/storage'
import { type BackupEntry, listBackups, readBackup } from '@/persistence/backups'
import { useStore } from '@/store/store'
import { Button } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Eyebrow } from '@/ui/Eyebrow'
import { DeviceIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'

/** Ce qu'on relit après chaque geste : la vérité vient du navigateur. */
type DeviceState = {
  persisted: boolean
  usage: StorageUsage | null
  backups: BackupEntry[]
}

/** Une restauration validée : le document est relu **avant** qu'on demande. */
type PendingRestore = { on: ISODate; entry: BackupEntry; data: Data }

/**
 * Ce que ce navigateur promet, et ce qu'il garde.
 *
 * À part de « Exporter / importer », qui parle des fichiers qui sortent : ici on
 * parle de l'appareil. C'est aussi ici que la prose sur le fonctionnement du
 * navigateur a sa place — elle occupait une tuile de la page de réglages, où
 * personne ne vient pour lire comment un quota se négocie.
 *
 * Quatre niveaux de lecture, dans cet ordre : l'état, sa conséquence, le
 * chiffre, le geste. Les trois phrases avaient jusqu'ici la même lettre et la
 * même couleur, empilées comme un paragraphe — on ne pouvait pas savoir si le
 * navigateur s'était engagé sans les lire toutes.
 */
export function StorageSection() {
  const replaceData = useStore((s) => s.replaceData)
  const [state, setState] = useState<DeviceState>({
    persisted: false,
    usage: null,
    backups: [],
  })
  const [pending, setPending] = useState<PendingRestore | null>(null)

  const read = useCallback(async (): Promise<DeviceState> => {
    const [persisted, usage, backups] = await Promise.all([
      isPersisted(),
      estimateStorage(),
      listBackups(),
    ])
    return { persisted, usage, backups }
  }, [])

  useEffect(() => {
    let alive = true
    void read().then((next) => {
      if (alive) setState(next)
    })
    return () => {
      alive = false
    }
  }, [read])

  const refresh = (): void => {
    void read().then(setState)
  }

  const ask = async (): Promise<void> => {
    const granted = await requestPersistence()
    toast(granted ? fr.storage.persistGranted : fr.storage.persistRefused)
    refresh()
  }

  /* Le document est relu et migré avant la question, jamais après : on ne fait
     pas confirmer un remplacement par une sauvegarde qu'on ne saurait pas
     ouvrir. C'est le patron d'`ImportControl`, pour la même raison. */
  const stage = async (entry: BackupEntry): Promise<void> => {
    const data = await readBackup(entry.on)
    if (data === null) return
    setPending({ on: entry.on, entry, data })
  }

  return (
    <>
      <Tile className="gap-3">
        {/* Aucune étiquette ici : la vue porte déjà « Sur cet appareil » en
            titre, et le répéter en tête de la première tuile l'aurait dit deux
            fois à deux centimètres d'écart.

            L'état en premier et dans la lettre du texte courant : c'est la seule
            chose qu'on vient vérifier ici. L'explication suit, à sa place. */}
        <p className="t-body">{state.persisted ? fr.storage.stateKept : fr.storage.stateFragile}</p>
        <p className="t-label">{state.persisted ? fr.storage.persisted : fr.storage.notPersisted}</p>
        <p className="t-label tnum">
          {state.usage === null
            ? fr.storage.usageUnknown
            : tpl(fr.storage.usage, formatBytes(state.usage.usage), formatBytes(state.usage.quota))}
        </p>
        {!state.persisted && (
          <Button
            variant="secondary"
            className="w-fit"
            onClick={() => {
              void ask()
            }}
          >
            {fr.storage.persistAsk}
          </Button>
        )}
      </Tile>

      <Tile className="gap-3">
        <Eyebrow icon={DeviceIcon}>{fr.storage.backups}</Eyebrow>
        <p className="t-label">{fr.storage.backupsHint}</p>
        {state.backups.length === 0 ? (
          <p className="t-label">{fr.storage.backupsEmpty}</p>
        ) : (
          <ul className="flex flex-col">
            {state.backups.map((entry) => (
              <li
                key={entry.on}
                className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-t border-border py-2 first:border-t-0"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="t-body tnum">{formatDate(entry.on)}</span>
                  <span className="t-axis">
                    {tpl(fr.storage.backupContents, entry.entries, entry.recurrences)}
                  </span>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void stage(entry)
                  }}
                >
                  {fr.storage.backupRestore}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Tile>

      {/* Deux pas : une restauration remplace tout, exactement comme un import. */}
      <ConfirmDialog
        open={pending !== null}
        title={fr.storage.backupRestore}
        steps={[
          {
            question:
              pending === null
                ? ''
                : tpl(
                    fr.storage.backupConfirm1,
                    tpl(
                      fr.storage.backupContents,
                      pending.entry.entries,
                      pending.entry.recurrences,
                    ),
                    formatDate(pending.on),
                  ),
            action: fr.common.confirm,
          },
          { question: fr.storage.backupConfirm2, action: fr.storage.backupRestore },
        ]}
        onCancel={() => {
          setPending(null)
        }}
        onConfirm={() => {
          if (pending === null) return
          void replaceData(pending.data).then(() => {
            setPending(null)
            toast(fr.storage.backupRestored)
            refresh()
          })
        }}
      />
    </>
  )
}
