/* ============================================================================
 * L'état du réseau, pour la seule app qui a de bonnes nouvelles à en donner.
 *
 * `navigator.onLine` est une réponse pessimiste : vrai veut seulement dire
 * « une interface réseau est active », pas « le réseau répond ». Faux, en
 * revanche, est fiable — et c'est le seul des deux dont on se serve ici. Rien
 * n'est affiché tant qu'on est en ligne : il n'y aurait rien à dire.
 * ==========================================================================*/

export function subscribeOnline(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

/**
 * Vrai quand le navigateur se sait hors ligne.
 *
 * L'absence de réponse vaut « en ligne » : un navigateur qui ne connaît pas
 * `onLine` ne doit pas faire afficher un avertissement permanent.
 */
export function isOffline(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.onLine === false
}
