/* ============================================================================
 * Détection des mises à jour au retour au premier plan.
 *
 * Le navigateur ne recompare `sw.js` qu'au chargement d'une page. Une PWA
 * installée qu'on reprend n'en charge aucune : sans ce guetteur, la bannière
 * n'apparaîtrait qu'à la vérification périodique du navigateur (~24 h) ou au
 * prochain vrai démarrage.
 *
 * Interroger le réseau ne déclenche jamais de rechargement : au mieux un
 * service worker de plus passe en attente, et `UpdatePrompt` propose.
 * ==========================================================================*/

/** Deux allers-retours d'affilée entre deux apps ne valent qu'une requête. */
export const UPDATE_CHECK_INTERVAL_MS = 60_000

/**
 * La part de `ServiceWorkerRegistration` qui nous intéresse. La valeur résolue
 * est laissée ouverte : le DOM la type tantôt `undefined`, tantôt la
 * registration elle-même, et on n'en fait rien.
 */
type Updatable = { update: () => Promise<unknown> }

/**
 * Redemande au navigateur de vérifier le service worker chaque fois que l'app
 * redevient visible. La registration est lue à la demande : elle n'existe pas
 * encore au moment où l'on s'abonne.
 *
 * Renvoie la fonction de désabonnement.
 */
export function watchForegroundUpdates(
  getRegistration: () => Updatable | null | undefined,
  now: () => number = Date.now,
): () => void {
  if (typeof document === 'undefined') return () => {}

  // Le chargement qui vient d'avoir lieu a déjà comparé `sw.js`.
  let lastCheck = now()

  const check = (): void => {
    if (document.visibilityState !== 'visible') return
    const at = now()
    if (at - lastCheck < UPDATE_CHECK_INTERVAL_MS) return
    lastCheck = at
    // Hors ligne, ou serveur injoignable : on retentera au prochain retour.
    void getRegistration()
      ?.update()
      .catch(() => {})
  }

  document.addEventListener('visibilitychange', check)
  return () => {
    document.removeEventListener('visibilitychange', check)
  }
}
