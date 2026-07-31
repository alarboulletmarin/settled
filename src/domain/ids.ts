/**
 * Génération d'identifiants. Isolée ici pour que le domaine reste pur : toute
 * fonction qui crée des entités reçoit un `makeId` en paramètre.
 */

let counter = 0

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  counter += 1
  return `id-${String(counter)}-${Math.random().toString(36).slice(2, 10)}`
}
