/* ============================================================================
 * Ce que le navigateur veut bien dire de la place qu'il nous prête.
 *
 * Sans `persist()`, il a le droit d'évincer IndexedDB sous pression disque —
 * silencieusement, et sur une app dont c'est le seul endroit où vivent les
 * données. Rien ici ne lève : Safari en navigation privée et les navigateurs
 * anciens n'ont pas à faire tomber la création d'un foyer.
 * ==========================================================================*/

export type StorageUsage = { usage: number; quota: number }

/**
 * Ce que le navigateur répond sur la durabilité : oui, non, ou rien du tout.
 *
 * Trois valeurs et non deux, et c'est la correction principale de ce module.
 * `false` valait jusqu'ici pour deux situations qui n'ont rien à voir : un
 * navigateur qui *dit* ne pas s'engager, et un navigateur qui n'a pas l'API du
 * tout — donc qui n'a rien dit. Les confondre laissait écrire n'importe où
 * « ce navigateur n'a rien promis » sur la foi d'une absence de réponse, et
 * c'est exactement le raccourci qu'on refuse ailleurs : un `false` n'est pas
 * une preuve de navigation privée, et une API manquante n'est pas un refus.
 */
export type Persistence = boolean | 'unknown'

function api(): StorageManager | null {
  return typeof navigator !== 'undefined' && 'storage' in navigator ? navigator.storage : null
}

/** Ce que le navigateur garde déjà, sans rien lui demander. */
export async function persistedState(): Promise<Persistence> {
  const storage = api()
  if (storage === null || typeof storage.persisted !== 'function') return 'unknown'
  try {
    return await storage.persisted()
  } catch {
    return 'unknown'
  }
}

/**
 * Demande que la base ne soit pas évincée.
 *
 * La réponse ne s'annonce pas à l'utilisateur au moment où on la demande :
 * Firefox ouvre une invite, Chrome décide seul et en silence, Safari refuse
 * toujours. Annoncer une décision que personne ne contrôle est du bruit — la
 * vérité s'affiche dans les réglages, avec un bouton qui redemande, et c'est là
 * que l'invite de Firefox a un sens puisqu'elle suit un clic.
 *
 * Un `true` n'est d'ailleurs pas une garantie : il engage le navigateur contre
 * l'éviction sous pression disque, pas contre quelqu'un qui vide ses données de
 * site. Aucun écran ne doit en promettre davantage.
 */
export async function requestPersistence(): Promise<Persistence> {
  const storage = api()
  if (storage === null || typeof storage.persist !== 'function') return 'unknown'
  try {
    return await storage.persist()
  } catch {
    return 'unknown'
  }
}

export async function estimateStorage(): Promise<StorageUsage | null> {
  const storage = api()
  if (storage === null || typeof storage.estimate !== 'function') return null
  try {
    const { usage, quota } = await storage.estimate()
    if (usage === undefined || quota === undefined) return null
    return { usage, quota }
  } catch {
    return null
  }
}
