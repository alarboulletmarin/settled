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

/**
 * Le compteur de révision, dans le même store que le document et écrit dans la
 * même transaction — sinon il n'est la révision de rien.
 *
 * Hors du document, et non dedans : il décrit l'état de cet appareil, pas les
 * finances du foyer. C'est l'argument déjà retenu pour la date de dernier
 * export. Le mettre dans `Data` le ferait voyager dans chaque fichier exporté,
 * où il ne veut rien dire, et casserait le protocole : importer un export à la
 * révision 900 dans une base à la révision 3 ferait croire à l'onglet qu'il est
 * en avance sur ses voisins.
 */
const REV_KEY = 'rev'

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

/**
 * Les trois façons dont une connexion cesse de tenir. `idb` les expose depuis
 * toujours ; ne pas les poser revenait à ce qu'aucune ne se voie.
 */
export type DbEvent =
  /** Notre ouverture attend qu'un autre onglet rende la version précédente. */
  | 'blocked'
  /** Un autre onglet veut migrer, et c'est nous qui le retenons. */
  | 'blocking'
  /** Le navigateur a coupé : pression mémoire, données du site effacées. */
  | 'terminated'

let notifyDbEvent: (event: DbEvent) => void = () => {}

export function setDbEventHandler(handler: (event: DbEvent) => void): void {
  notifyDbEvent = handler
}

/** Ce que l'app fait de chaque incident. Exporté : la décision est ici. */
export function handleDbEvent(event: DbEvent): void {
  /* `blocking` : ne pas lâcher la connexion bloquerait l'autre onglet pour
     toujours. On ferme donc, sans chercher à vider la file d'abord — écrire
     voudrait ouvrir une transaction sur la connexion qu'on doit justement
     rendre — et le bandeau qui s'allume derrière dit exactement la vérité :
     dans cet onglet-ci, plus rien ne s'enregistre.
     `terminated` : oublier la connexion suffit, la prochaine écriture la
     rouvrira. Sans cet oubli, toutes les suivantes rejetaient jusqu'au
     rechargement de la page.
     `blocked` : c'est nous qui attendons, et la connexion n'existe pas encore.
     Il n'y a rien à fermer — la fermer perdrait la promesse d'ouverture, qui
     est précisément ce qui aboutira quand l'autre onglet partira. */
  if (event !== 'blocked') closeDb()
  notifyDbEvent(event)
}

function db(): Promise<IDBPDatabase<ToutCompteFaitDB>> {
  connection ??= openDB<ToutCompteFaitDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE)
      }
    },
    blocked() {
      handleDbEvent('blocked')
    },
    blocking() {
      handleDbEvent('blocking')
    },
    terminated() {
      handleDbEvent('terminated')
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

/** Le document et la révision à laquelle il a été écrit. */
export type LoadedDocument = { data: Data; rev: number }

/**
 * Lit le document et le fait passer par les migrations.
 * Renvoie null s'il n'y a rien de stocké — c'est le cas du premier lancement.
 *
 * Les deux clés se lisent dans une seule transaction : entre deux lectures
 * séparées, un autre onglet pourrait écrire, et on repartirait avec un document
 * d'une révision et un numéro d'une autre.
 */
export async function loadDocument(): Promise<LoadedDocument | null> {
  const tx = (await db()).transaction(STORE, 'readonly')
  const stored: unknown = await tx.store.get(KEY)
  const rev: unknown = await tx.store.get(REV_KEY)
  await tx.done
  if (stored === undefined || stored === null) return null
  return { data: migrateDocument(stored).data, rev: typeof rev === 'number' ? rev : 0 }
}

/** La révision seule. Zéro si la base est d'avant le compteur. */
export async function readRev(): Promise<number> {
  const rev: unknown = await (await db()).get(STORE, REV_KEY)
  return typeof rev === 'number' ? rev : 0
}

/**
 * Le contenu stocké, tel quel : ni migration, ni validation, ni promesse que ce
 * soit un document.
 *
 * C'est ce qui reste quand `loadDocument` a refusé. Un document que cette
 * version de l'app ne sait pas ouvrir — venu d'une version plus récente, ou
 * abîmé quelque part — n'est pas forcément un document perdu, et l'effacer sans
 * en avoir proposé une copie serait la seule perte vraiment irréparable.
 */
export async function loadRawDocument(): Promise<unknown> {
  return (await db()).get(STORE, KEY)
}

/**
 * Écrit le document et sa révision, en une transaction.
 *
 * La révision est fournie par l'appelant plutôt que relue ici : la relire
 * imposerait un aller-retour avant d'écrire, et cette écriture-là doit pouvoir
 * partir depuis un gestionnaire `pagehide`, où chaque tour de boucle
 * supplémentaire est un tour que le navigateur peut refuser de nous rendre.
 * Les deux `put` sont émis d'affilée, sans rien attendre entre eux.
 */
export function saveDocument(data: Data, rev: number): Promise<void> {
  const write = (database: IDBPDatabase<ToutCompteFaitDB>): Promise<void> => {
    const tx = database.transaction(STORE, 'readwrite')
    void tx.store.put(data, KEY)
    void tx.store.put(rev, REV_KEY)
    return tx.done
  }
  return ready !== null ? write(ready) : db().then(write)
}

export async function clearDocument(): Promise<void> {
  const tx = (await db()).transaction(STORE, 'readwrite')
  void tx.store.delete(KEY)
  void tx.store.delete(REV_KEY)
  await tx.done
}

