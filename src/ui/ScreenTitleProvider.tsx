import { type ReactNode, useState } from 'react'
import { type ScreenTitle, ScreenTitleContext } from './screenTitle'

/**
 * La région qui dit à voix haute l'écran où l'on vient d'arriver.
 *
 * Changer d'URL dans une application d'une seule page ne recharge rien : le
 * navigateur n'annonce donc aucun nouveau document, et rien ne disait ce qui
 * venait de s'ouvrir. C'est le défaut classique du genre, et il se répare en
 * deux gestes qui vont ensemble — le focus part au contenu (`AppShell`), et le
 * titre se dit ici.
 *
 * **Elle vit hors du `<main>` porté par une clé d'écran.** Une région live
 * insérée en même temps que son contenu n'est pas annoncée — le navigateur ne
 * voit alors aucun changement, seulement une région qui apparaît déjà remplie.
 * Remontée à chaque navigation, elle n'aurait donc jamais rien dit. C'est la
 * même raison qui fait vivre celle des messages dans la coquille.
 *
 * Le titre change une fois par écran, et `children` est le même élément d'un
 * rendu à l'autre : React n'a donc rien à refaire sous cette région-là.
 */
export function ScreenTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('')
  /* Le setter est stable, et c'est ce qui compte : `useAnnounceScreen` le tient
     en dépendance d'effet, et un objet neuf à chaque rendu y relancerait
     l'annonce en boucle. */
  const [api] = useState<ScreenTitle>(() => ({ announce: setTitle }))

  return (
    <ScreenTitleContext value={api}>
      {children}
      {/* `role` et `aria-live` ensemble, comme la région des messages : le rôle
          seul n'est pas relu partout, et `aria-live` seul ne donne aucun rôle. */}
      <p role="status" aria-live="polite" className="sr-only-text">
        {title}
      </p>
    </ScreenTitleContext>
  )
}
