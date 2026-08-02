/* ============================================================================
 * Ce que le navigateur veut bien dire de la place qu'il nous prête.
 *
 * Sans `persist()`, il a le droit d'évincer IndexedDB sous pression disque —
 * silencieusement, et sur une app dont c'est le seul endroit où vivent les
 * données. Rien ici ne lève : Safari en navigation privée et les navigateurs
 * anciens n'ont pas à faire tomber la création d'un foyer.
 * ==========================================================================*/

export type StorageUsage = { usage: number; quota: number }

function api(): StorageManager | null {
  return typeof navigator !== 'undefined' && 'storage' in navigator ? navigator.storage : null
}

export async function isPersisted(): Promise<boolean> {
  const storage = api()
  if (storage === null || typeof storage.persisted !== 'function') return false
  try {
    return await storage.persisted()
  } catch {
    return false
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
 */
export async function requestPersistence(): Promise<boolean> {
  const storage = api()
  if (storage === null || typeof storage.persist !== 'function') return false
  try {
    return await storage.persist()
  } catch {
    return false
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
