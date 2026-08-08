import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { fr } from '@/i18n/fr'
import { hasReadNotice, markNoticeRead } from '@/lib/notice'
import { Button } from '@/ui/Button'
import { Checkbox } from '@/ui/Field'
import { Sheet } from '@/ui/Sheet'
import { LINK } from './AppFooter'
import { PRIVACY_PATH } from './routes'

/**
 * La promesse de ne rien collecter, devant qui n'a pas l'intention de la lire.
 *
 * Elle est écrite quatre fois ailleurs — sur la présentation, à la dernière
 * étape de l'onboarding, sur « à propos », et en détail sur
 * `/confidentialite`. Toutes se lisent, et c'est précisément le problème :
 * quelqu'un qui arrive méfiant devant une app de finances saisit ses revenus
 * sans en avoir croisé une ligne. La promesse était partout sauf devant lui.
 *
 * **C'est un bandeau cookies retourné**, et la forme est empruntée exprès. Là
 * où l'un fait accepter ce qui est pris, celle-ci dit ce qui n'est pas pris.
 * Elle bloque pour la seule raison qui rend un bandeau cookies efficace : c'est
 * la forme qu'on ne peut pas ne pas voir. Ni croix, ni Échap, ni clic sur le
 * fond — un seul bouton, nommé.
 *
 * **La case est là pour qu'on lise, pas pour qu'on réponde.** Rien n'est
 * enregistré de ce qu'elle vaut : elle allume le bouton, et c'est tout ce
 * qu'elle fait. C'est ce qui distingue cette modale d'une question, et ce qui
 * la réconcilie avec le « rien à configurer pour démarrer » du cahier §1 — elle
 * ne configure rien et ne demande aucune information sur qui la lit. Le nom du
 * foyer, lui, reste supprimé pour la raison inverse : il exigeait une réponse
 * *sur soi* pour une décoration (§4.1).
 *
 * **Échap inerte n'est pas un piège au sens de WCAG 2.1.2.** Le piège de focus
 * reste celui du navigateur, la case répond à la barre d'espace et le bouton à
 * Entrée : la sortie existe au clavier, elle est simplement nommée. Et le texte
 * est désigné en `aria-describedby` — sans quoi `showModal()` poserait le focus
 * sur le premier lien du corps, et un lecteur d'écran annoncerait le titre puis
 * « Confidentialité, lien », sans un mot des quatre lignes entre les deux.
 *
 * **Le drapeau se lit au premier rendu**, pas dans un effet : le document vit en
 * IndexedDB (asynchrone), la notice doit répondre avant lui, et `localStorage`
 * est synchrone. Elle s'affiche donc aussi chez qui utilise déjà l'app, une
 * fois, ce qui est le comportement voulu — la position de l'app vaut d'être
 * annoncée à ceux qui s'en servent déjà.
 */
export function PrivacyNotice() {
  /* Un initialiseur et non une valeur : `hasReadNotice()` toucherait
     `localStorage` à chaque rendu, et un rendu de plus est tout ce qu'il faut
     pour rouvrir une modale qu'on vient de fermer. */
  const [open, setOpen] = useState(() => !hasReadNotice())
  const [read, setRead] = useState(false)
  const bodyId = useId()

  if (!open) return null

  return (
    <Sheet
      open
      /* Elle ne se referme pas, donc `onClose` n'a rien à faire — mais la prop
         est requise, et lui donner le bouton reviendrait à écrire une sortie que
         `dismissible={false}` vient justement de retirer. */
      onClose={() => {}}
      dismissible={false}
      describedBy={bodyId}
      title={fr.notice.title}
      footerLead={
        <Checkbox
          checked={read}
          onChange={setRead}
          label={fr.notice.check}
          /* L'aide reste affichée après la coche : le DS §6 le demande de ce qui
             informe de ce qui va se passer, et la faire disparaître au moment où
             l'on comprend enfin le lien entre la case et le bouton reviendrait à
             effacer l'explication au profit de qui n'en a plus besoin. */
          hint={fr.notice.checkHint}
        />
      }
      footer={
        <Button
          full
          disabled={!read}
          onClick={() => {
            markNoticeRead()
            setOpen(false)
          }}
        >
          {fr.notice.action}
        </Button>
      }
    >
      <div id={bodyId} className="flex flex-col gap-4">
        <p className="t-body">{fr.notice.lead}</p>

        {/* Une vraie liste, et non quatre paragraphes : c'est un décompte —
            quatre choses qui n'existent pas —, et un lecteur d'écran doit
            pouvoir l'annoncer comme tel plutôt que comme de la prose. Les
            puces sont retirées au profit du filet de gauche : quatre lignes qui
            commencent toutes par « Aucun » n'ont pas besoin qu'on répète le
            marqueur devant. */}
        <ul className="flex list-none flex-col gap-2 border-l border-border pl-4">
          {[
            fr.notice.noAccount,
            fr.notice.noTracking,
            fr.notice.noServer,
            fr.notice.noReader,
          ].map((claim) => (
            <li key={claim} className="t-body">
              {claim}
            </li>
          ))}
        </ul>

        {/* La ligne qui rend les quatre autres vérifiables, et son lien. Sans
            elle, la notice demande de la croire sur parole — ce qu'elle existe
            précisément pour éviter. Le détail de ce qui est enregistré vit sur
            la page, y compris la seule trace qui existe vraiment : les journaux
            de l'hébergeur, qu'aucune des quatre lignes ne prétend nier. */}
        <div className="flex flex-col gap-1">
          <p className="t-label">{fr.notice.verify}</p>
          <Link to={PRIVACY_PATH} className={LINK}>
            {fr.legal.privacy}
          </Link>
        </div>
      </div>
    </Sheet>
  )
}
