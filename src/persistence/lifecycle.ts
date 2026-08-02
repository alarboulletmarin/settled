/* ============================================================================
 * Le dernier moment où l'on peut encore écrire.
 *
 * Le writer débounce à 400 ms : sans ce module, toute saisie faite dans les
 * 400 ms qui précèdent la fermeture de l'onglet était perdue, sans un mot.
 * ==========================================================================*/

/**
 * Pose les écouteurs de sortie et renvoie de quoi les retirer.
 *
 * Deux événements, et non un. `pagehide` est le seul qui parte de façon fiable
 * sur mobile — un onglet balayé, une app tuée par le système : `unload` n'y
 * arrive jamais. `visibilitychange: hidden` couvre le passage en arrière-plan
 * qui ne revient pas, celui d'un téléphone qu'on verrouille et qu'on repose.
 *
 * Pas de `beforeunload` : il n'est pas plus fiable que les deux autres sur
 * mobile, et il n'a rien à demander ici — on enregistre, on ne retient pas.
 */
export function onPageHidden(hide: () => void): () => void {
  const onPageHide = (): void => {
    hide()
  }
  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') hide()
  }

  window.addEventListener('pagehide', onPageHide)
  document.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    window.removeEventListener('pagehide', onPageHide)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
