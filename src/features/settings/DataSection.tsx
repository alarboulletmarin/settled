import { type ReactNode, useState } from 'react'
import { today } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { formatDate, tpl } from '@/i18n/format'
import { downloadExport, readLastExport } from '@/persistence/transfer'
import { useStore } from '@/store/store'
import { Button } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Eyebrow } from '@/ui/Eyebrow'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'
import { ExampleControl } from './ExampleControl'
import { ImportControl } from './ImportControl'
import { SchemaControl } from './SchemaControl'

/**
 * Un bloc d'intention dans la tuile des données — un titre, ce qu'il faut
 * savoir, le geste.
 *
 * Un titre et un filet plutôt qu'une carte par ligne : quatre cartes auraient
 * donné le même poids à « exporter tout ce que j'ai » et à « télécharger le
 * schéma », et c'est exactement le nivellement que cette page corrige.
 */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h2 className="t-body font-medium">{title}</h2>
      {children}
    </section>
  )
}

/**
 * Les données qui entrent et qui sortent, rangées par intention.
 *
 * Cinq gestes y vivaient à la file, du plus courant au plus définitif, tous
 * sous la même forme : exporter, importer, copier le schéma, le télécharger,
 * charger l'exemple, tout effacer. On lisait six boutons sans savoir lequel
 * rendait un fichier et lequel n'était pas rattrapable.
 *
 * Ils se groupent maintenant par ce qu'on vient faire — sauvegarder, restaurer,
 * comprendre le format, essayer — et l'effacement sort de la liste : il a sa
 * zone, en bas, avec son titre et sa conséquence écrite.
 */
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
    <>
      <Tile className="gap-4">
        <Block title={fr.settings.backupGroup}>
          <p className="t-label">{fr.settings.exportHint}</p>
          <p className="t-label">
            {lastExport === null
              ? fr.settings.neverExported
              : tpl(fr.settings.lastExport, formatDate(lastExport))}
          </p>
          <Button onClick={doExport} className="w-fit">
            {fr.settings.export}
          </Button>
        </Block>

        {/* La conséquence reste écrite au-dessus du bouton, et pas seulement
            dans la question : « remplace intégralement » est ce qui décide si
            l'on clique, et l'apprendre une fois la boîte ouverte est trop
            tard pour qui l'ouvre par curiosité. */}
        <Block title={fr.settings.restoreGroup}>
          <p className="t-label">{fr.settings.importHint}</p>
          <ImportControl className="w-fit" />
        </Block>

        {/* Le schéma se lit juste sous l'import, parce que c'est l'import qu'il
            sert : il n'a d'autre usage que de faire exister le fichier qu'on
            déposera à la ligne du dessus. */}
        <Block title={fr.settings.schema}>
          <p className="t-label">{fr.settings.schemaHint}</p>
          <SchemaControl />
        </Block>

        <Block title={fr.settings.example}>
          <p className="t-label">{fr.settings.exampleHint}</p>
          <ExampleControl className="w-fit" />
        </Block>
      </Tile>

      {/* La zone sensible, à part et en dernier. Ce n'est pas la couleur qui
          prévient l'erreur — le DS §2.3 réserve le rouge aux dépassements et
          aux erreurs, et une tuile entière en rouge crierait sans rien dire :
          c'est la séparation, le titre qui nomme le geste, et la phrase qui en
          donne la portée. Le bouton, lui, prend la variante d'alerte : c'est
          celle de toutes les confirmations destructives de l'app.

          Triple confirmation : c'est le seul geste qui n'épargne rien, et rien
          n'est enregistré ailleurs que dans ce navigateur. */}
      <Tile className="gap-3">
        <Eyebrow>{fr.settings.sensitive}</Eyebrow>
        <h2 className="t-body font-medium">{fr.settings.resetTitle}</h2>
        <p className="t-label">{fr.settings.resetHint}</p>
        <Button
          variant="danger"
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
      </Tile>
    </>
  )
}
