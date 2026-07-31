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

const DB_NAME = 'settled'
const DB_VERSION = 1
const STORE = 'document'
const KEY = 'current'

interface SettledDB extends DBSchema {
  document: {
    key: string
    value: unknown
  }
}

let connection: Promise<IDBPDatabase<SettledDB>> | null = null

function db(): Promise<IDBPDatabase<SettledDB>> {
  connection ??= openDB<SettledDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE)
      }
    },
  })
  return connection
}

/** Referme la connexion. Utile aux tests et à la réinitialisation. */
export function closeDb(): void {
  const pending = connection
  connection = null
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

export async function saveDocument(data: Data): Promise<void> {
  await (await db()).put(STORE, data, KEY)
}

export async function clearDocument(): Promise<void> {
  await (await db()).delete(STORE, KEY)
}

/* --- Écriture en debounce -------------------------------------------------*/

export type Writer = {
  /** Programme une écriture. Les appels rapprochés sont fusionnés. */
  schedule: (data: Data) => void
  /** Écrit immédiatement ce qui est en attente. */
  flush: () => Promise<void>
  cancel: () => void
}

export const WRITE_DELAY_MS = 400

/**
 * Regroupe les écritures. Une saisie au clavier produit une mutation par
 * frappe : sans ce regroupement, chaque frappe déclencherait une transaction.
 */
export function createWriter(
  write: (data: Data) => Promise<void> = saveDocument,
  delay: number = WRITE_DELAY_MS,
): Writer {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: Data | null = null
  let inFlight: Promise<void> = Promise.resolve()

  const run = (): void => {
    const data = pending
    pending = null
    timer = null
    if (data === null) return
    inFlight = write(data)
  }

  return {
    schedule(data) {
      pending = data
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(run, delay)
    },
    async flush() {
      if (timer !== null) {
        clearTimeout(timer)
        run()
      }
      await inFlight
    },
    cancel() {
      if (timer !== null) clearTimeout(timer)
      timer = null
      pending = null
    },
  }
}
