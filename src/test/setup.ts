import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom n'implémente pas matchMedia : le module de thème s'en sert au boot.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
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
