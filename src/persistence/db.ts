/* ============================================================================
 * Stockage IndexedDB — un seul enregistrement contenant tout le document.
 *
 * Pas d'index, pas de requêtes : le document est hydraté en mémoire au
 * démarrage, les statistiques se calculent à la volée, et la persistance se
 * fait en debounce sur mutation (cahier §5).
 * ==========================================================================*/

import { type DBSchema, type IDBPDatabase, openDB } from 'idb'
import type { Data } from '@/domain/types'
import { migrateDocument } from './schema'

const DB_NAME = 'tout-compte-fait'
const DB_VERSION = 1
const STORE = 'document'
const KEY = 'current'

interface ToutCompteFaitDB extends DBSchema {
  document: {
    key: string
    value: unknown
  }
}

let connection: Promise<IDBPDatabase<ToutCompteFaitDB>> | null = null

/**
 * La connexion déjà ouverte, sans promesse.
 *
 * `saveDocument` doit pouvoir émettre son `put` dans la tâche même de
 * `pagehide` : quand la page part, le navigateur n'a plus aucune obligation de
 * nous rendre la main, et un `await db()` sur une promesse déjà tenue rend
 * quand même la main. Une fois la base ouverte — c'est-à-dire toujours, passé
 * l'hydratation — le chemin d'écriture est donc synchrone jusqu'au `put`.
 */
let ready: IDBPDatabase<ToutCompteFaitDB> | null = null

function db(): Promise<IDBPDatabase<ToutCompteFaitDB>> {
  connection ??= openDB<ToutCompteFaitDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE)
      }
    },
  }).then((database) => {
    ready = database
    return database
  })
  return connection
}

/** Referme la connexion. Utile aux tests et à la réinitialisation. */
export function closeDb(): void {
  const pending = connection
  connection = null
  ready = null
  void pending?.then((database) => {
    database.close()
  })
}

/**
 * Lit le document et le fait passer par les migrations.
 * Renvoie null s'il n'y a rien de stocké — c'est le cas du premier lancement.
 */
export async function loadDocument(): Promise<Data | null> {
  const stored: unknown = await (await db()).get(STORE, KEY)
  if (stored === undefined || stored === null) return null
  return migrateDocument(stored).data
}

export function saveDocument(data: Data): Promise<void> {
  if (ready !== null) return ready.put(STORE, data, KEY).then(() => undefined)
  return db().then(async (database) => {
    await database.put(STORE, data, KEY)
  })
}

export async function clearDocument(): Promise<void> {
  await (await db()).delete(STORE, KEY)
}

