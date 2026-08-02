/**
 * Génération d'identifiants. Isolée ici pour que le domaine reste pur : toute
 * fonction qui crée des entités reçoit un `makeId` en paramètre.
 */

/**
 * Le repli, quand `crypto.randomUUID` manque — c'est-à-dire hors contexte
 * sécurisé : tester l'app sur son téléphone via `http://192.168.x.x` suffit.
 *
 * Le compteur seul repartait de 1 à chaque rechargement, et deux sessions
 * successives sur le même appareil se remettaient donc à distribuer `id-1`,
 * `id-2`… La graine, tirée une fois par session, rend la collision improbable
 * là où le compteur seul la rendait seulement peu fréquente — et elle ne coûte
 * rien : le compteur reste ce qui garantit l'unicité *dans* la session, la
 * graine ce qui la garantit d'une session à l'autre.
 */
const seed = Math.random().toString(36).slice(2, 10)
let counter = 0

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  counter += 1
  return `id-${seed}-${String(counter)}`
}
