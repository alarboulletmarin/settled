/* ============================================================================
 * L'anneau de sauvegardes locales.
 *
 * Le document vit sous une clé unique, réécrite à chaque frappe : un bug de
 * migration ou de normalisation le détruisait sans recours. Cinq instantanés
 * ne remplacent pas un export — ils vivent dans le même navigateur, et
 * disparaîtraient avec lui — mais ils rattrapent le seul accident contre lequel
 * un export mensuel ne peut rien : celui d'aujourd'hui.
 * ==========================================================================*/

import { type ISODate, today } from '@/domain/date'
import type { Data } from '@/domain/types'
import { BACKUP_STORE, connect } from './db'
import { migrateDocument } from './schema'

export const BACKUP_KEEP = 5

export type BackupEntry = {
  on: ISODate
  entries: number
  recurrences: number
}

/**
 * Écrit l'instantané du jour s'il manque, puis rogne l'anneau.
 *
 * La clé est la date : la première écriture du jour pose l'instantané, les
 * suivantes trouvent la clé et passent leur chemin. Et comme une date ISO se
 * trie comme elle se lit, l'ordre lexicographique des clés *est* l'ordre
 * chronologique — le rognage tient en une ligne.
 */
export async function backupDaily(data: Data, on: ISODate = today()): Promise<void> {
  const tx = (await connect()).transaction(BACKUP_STORE, 'readwrite')
  const keys = await tx.store.getAllKeys()
  if (keys.includes(on)) {
    await tx.done
    return
  }
  void tx.store.put(data, on)
  const kept = [...keys, on].sort()
  for (const stale of kept.slice(0, Math.max(0, kept.length - BACKUP_KEEP))) {
    void tx.store.delete(stale)
  }
  await tx.done
}

/** Les instantanés, du plus récent au plus ancien, avec de quoi les choisir. */
export async function listBackups(): Promise<BackupEntry[]> {
  const tx = (await connect()).transaction(BACKUP_STORE, 'readonly')
  const keys = (await tx.store.getAllKeys()).sort().reverse()
  const entries: BackupEntry[] = []
  for (const key of keys) {
    const stored: unknown = await tx.store.get(key)
    try {
      const { data } = migrateDocument(stored)
      entries.push({ on: key, entries: data.entries.length, recurrences: data.recurrences.length })
    } catch {
      // Un instantané qu'on ne sait plus lire ne se propose pas : le restaurer
      // ne ferait que reproduire l'écran qu'on est venu quitter.
    }
  }
  await tx.done
  return entries
}

/** Relit un instantané, migrations comprises — il peut dater de plusieurs mois. */
export async function readBackup(on: ISODate): Promise<Data | null> {
  const stored: unknown = await (await connect()).get(BACKUP_STORE, on)
  if (stored === undefined || stored === null) return null
  return migrateDocument(stored).data
}

/**
 * « Tout effacer » efface aussi l'anneau. Sans ça, la triple confirmation
 * mentirait : elle annonce qu'il ne reste rien.
 */
export async function clearBackups(): Promise<void> {
  await (await connect()).clear(BACKUP_STORE)
}
