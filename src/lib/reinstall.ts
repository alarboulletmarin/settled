/**
 * Ce qu'il faut pour sortir d'un écran blanc qui se reproduit à l'identique.
 *
 * Le service worker sert l'app depuis le cache : une version cassée y reste, et
 * recharger la ressert. Vider les caches et désenregistrer le worker est le
 * seul geste qui fasse retélécharger l'app.
 *
 * Il ne touche **pas** à IndexedDB — c'est ce que le libellé promet, et c'est
 * la seule raison pour laquelle on ose le proposer à quelqu'un qui vient de
 * voir l'app casser.
 */
export async function clearAppCaches(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }
  if ('caches' in globalThis) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
}

/** Sans service worker, il n'y a rien à réinstaller : on ne propose rien. */
export function canClearAppCaches(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}
