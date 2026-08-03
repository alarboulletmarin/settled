import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

/* jsdom n'implémente pas matchMedia : le module de thème s'en sert au boot.
 *
 * Une seule requête répond vrai, et c'est délibéré : l'environnement de test
 * déclare `prefers-reduced-motion: reduce`. jsdom n'a pas de compositeur, donc
 * pas d'images à composer — une assertion posée sur un montant à la moitié de
 * son comptage ne teste pas le comptage, elle teste le hasard de la première
 * frame. Les tests lisent donc partout la valeur d'arrivée, qui est ce dont ils
 * parlent ; le comptage lui-même a son test, qui rétablit la préférence chez
 * lui pour l'exercer pour de bon. */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

/* jsdom pose l'élément `<dialog>` mais pas ses méthodes. `Sheet` s'appuie
   dessus pour tout ce qui rend une feuille correcte — piège de focus, Échap,
   clic sur le fond — et c'est justement pour ne pas le réécrire qu'on l'a
   choisi : le combler ici plutôt que de tester une feuille qui n'est pas celle
   de l'app. L'attribut `open` suffit, c'est lui que `Sheet` lit. */
if (typeof HTMLDialogElement === 'function' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
