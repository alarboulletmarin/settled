/* ============================================================================
 * La santé du stockage, telle qu'on peut l'observer.
 *
 * Ce module décrit **ce navigateur-ci**, jamais le foyer : la durabilité qu'il
 * accorde, le fait qu'on la lui ait demandée, et la date des dernières écritures
 * — celle qui a abouti et celle qui a raté. Rien de tout cela n'a de sens dans
 * un fichier exporté, donc rien de tout cela ne vit dans `Data`. C'est
 * l'argument déjà retenu pour la révision et pour la date de dernier export.
 *
 * Il ne dit pas si l'on est en navigation privée, et il n'essaiera pas : aucun
 * navigateur ne l'expose, les détours qu'on lit ailleurs se démentent d'une
 * version à l'autre, et une app qui affirme « mode privé détecté » a tort tôt ou
 * tard devant quelqu'un qui ne peut pas la contredire. Ce qu'on sait se dit en
 * termes de conservation — accordée, refusée, inconnue — et d'écritures qui
 * passent ou non. C'est moins spectaculaire et c'est vrai.
 *
 * L'échec d'écriture lui-même n'est pas ici : il vit dans `store.error`, où il
 * était déjà, parce qu'il ne sert pas qu'à un bandeau — c'est lui qui empêche
 * `finishOnboarding` d'écraser un document illisible. Le dupliquer ici aurait
 * créé deux vérités pour un seul fait. Ce module en garde la trace horaire, qui
 * est une autre question : « quand » plutôt que « quoi ».
 * ==========================================================================*/

import { create } from 'zustand'
import { type ISODate, diffDays, today } from '@/domain/date'
import { type Persistence, persistedState, requestPersistence } from '@/lib/storage'

/**
 * Le fait d'avoir posé la question au navigateur, gardé sur l'appareil.
 *
 * En mémoire seule, il repartait à faux à chaque rechargement, et l'app ne
 * pouvait plus distinguer « on n'a jamais demandé » de « on a demandé, il a
 * refusé ». Ce sont deux phrases différentes : la première ne permet d'affirmer
 * rien du tout.
 */
export const DURABILITY_ASKED_KEY = 'tout-compte-fait.durabilityAsked'

/** La date à laquelle l'avis de conservation a été écarté. */
export const DURABILITY_DISMISSED_KEY = 'tout-compte-fait.durabilityDismissed'

/**
 * Le cycle de l'avis de conservation, en jours. Le même que celui du rappel
 * d'export, et volontairement : ce sont deux façons de dire « garde une copie »,
 * et deux cadences différentes auraient fini par se croiser une semaine sur
 * deux — ce qui est exactement le bruit qu'on cherche à éviter.
 */
export const DURABILITY_NOTICE_DAYS = 30

export type StorageHealth = {
  /** Ce que le navigateur répond à `persisted()`. */
  durable: Persistence
  /**
   * Vrai dès que la question lui a été posée une fois dans cette session.
   * Avant, `durable` vaut sa valeur de départ et ne décrit rien : sans ce
   * drapeau, un avis « conservation non garantie » s'allumait le temps d'un
   * rendu chez quelqu'un dont le stockage est parfaitement durable.
   */
  probed: boolean
  /** La durabilité a été demandée à ce navigateur, et il a tranché. */
  asked: boolean
  /** Horodatage de la dernière écriture qui a abouti. */
  lastWriteAt: number | null
  /** Horodatage du dernier échec d'écriture. */
  lastFailureAt: number | null
}

function readAsked(): boolean {
  try {
    return localStorage.getItem(DURABILITY_ASKED_KEY) !== null
  } catch {
    return false
  }
}

function markAsked(on: ISODate = today()): void {
  try {
    localStorage.setItem(DURABILITY_ASKED_KEY, on)
  } catch {
    /* Sans miroir, on redemandera : c'est le comportement le moins mauvais. */
  }
}

/**
 * L'état, en lecture seule pour les composants. Aucune action dessus : ce sont
 * les fonctions de ce module qui l'écrivent, et elles seules — un composant qui
 * poserait `durable` à la main affirmerait quelque chose que le navigateur n'a
 * pas dit.
 */
export const useStorageHealth = create<StorageHealth>()(() => ({
  durable: 'unknown',
  probed: false,
  asked: readAsked(),
  lastWriteAt: null,
  lastFailureAt: null,
}))

/**
 * Relit la durabilité sans rien demander.
 *
 * C'est ce qui part à l'hydratation : une lecture, jamais une demande. Demander
 * au démarrage ouvrirait une invite Firefox devant quelqu'un qui n'a rien
 * cliqué, et le cahier §5 place la demande à deux moments précis — la création
 * du document et l'import.
 */
export async function probeDurability(): Promise<Persistence> {
  const durable = await persistedState()
  useStorageHealth.setState({ durable, probed: true })
  return durable
}

/**
 * Demande la durabilité. **Le seul appel à `persist()` de l'app** : trois
 * chemins la demandaient chacun de leur côté, et aucun n'en gardait le résultat.
 *
 * On relit d'abord : redemander ce qui est déjà accordé ne change rien et coûte
 * une invite sur les navigateurs qui en ouvrent une.
 */
export async function askDurability(): Promise<Persistence> {
  const current = await persistedState()
  if (current === true) {
    useStorageHealth.setState({ durable: true, probed: true })
    return true
  }

  const answer = await requestPersistence()
  /* « Demandé » ne vaut que si quelqu'un a répondu. Là où l'API n'existe pas,
     il n'y a pas eu de question : le marquer laisserait dire plus tard que ce
     navigateur a refusé, ce qu'il n'a jamais fait. */
  if (answer !== 'unknown') {
    markAsked()
    useStorageHealth.setState({ asked: true })
  }
  useStorageHealth.setState({ durable: answer, probed: true })
  return answer
}

/**
 * Ce que le writer rapporte, horodaté.
 *
 * Une mutation n'est pas sécurisée parce que l'écran a changé : elle l'est
 * quand la transaction a commis. Ces deux marques sont le seul endroit où cette
 * différence est écrite.
 */
export function noteWrite(at: number = Date.now()): void {
  useStorageHealth.setState({ lastWriteAt: at })
}

export function noteWriteFailure(at: number = Date.now()): void {
  useStorageHealth.setState({ lastFailureAt: at })
}

export function readDurabilityDismissed(): ISODate | null {
  try {
    return localStorage.getItem(DURABILITY_DISMISSED_KEY)
  } catch {
    return null
  }
}

export function dismissDurabilityNotice(on: ISODate = today()): void {
  try {
    localStorage.setItem(DURABILITY_DISMISSED_KEY, on)
  } catch {
    /* L'avis reviendra au prochain écran : rien à en dire. */
  }
}

/**
 * Vrai s'il faut signaler que la conservation n'est pas garantie.
 *
 * Quatre conditions, et chacune retire du bruit. Tant que la durabilité n'a pas
 * été relue, on ne sait rien. Un stockage durable n'a rien à signaler. Un foyer
 * vide non plus — il n'y a rien à perdre, et ouvrir l'app sur un avertissement
 * est la pire des premières impressions pour une app qui, justement, ne demande
 * rien pour démarrer. Et l'avis écarté vaut pour un cycle, comme le rappel
 * d'export : un refus n'est pas un bâillon définitif sur des données dont
 * personne ne garantit la conservation.
 */
export function shouldWarnDurability(
  /* Les deux seuls champs qui décident, et non l'état entier : c'est ce qui
     permet à la coquille de ne s'abonner qu'à eux. S'abonner à tout la ferait
     rendre à chaque écriture, c'est-à-dire toutes les 400 ms de frappe, pour un
     bandeau qui ne changerait pas. */
  health: Pick<StorageHealth, 'probed' | 'durable'>,
  hasData: boolean,
  dismissedOn: ISODate | null,
  now: ISODate,
): boolean {
  if (!health.probed) return false
  if (health.durable === true) return false
  if (!hasData) return false
  if (dismissedOn !== null && diffDays(dismissedOn, now) <= DURABILITY_NOTICE_DAYS) return false
  return true
}

/**
 * Vrai quand le navigateur a été interrogé et ne s'engage pas.
 *
 * À distinguer de `durable !== true`, qui englobe aussi « on ne sait pas ».
 * C'est cette distinction qui décide si l'on peut écrire « ce navigateur ne
 * garantit pas » — une affirmation — plutôt que la formule d'attente.
 */
export function isKnownFragile(health: Pick<StorageHealth, 'probed' | 'asked' | 'durable'>): boolean {
  return health.probed && health.asked && health.durable === false
}
