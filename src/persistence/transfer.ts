/* ============================================================================
 * Export et import du fichier de données.
 *
 * L'export contient le document complet et son schemaVersion. Un import
 * remplace intégralement les données et passe par les migrations (cahier §4.8).
 * ==========================================================================*/

import { type ISODate, diffDays, today } from '@/domain/date'
import type { Data } from '@/domain/types'
import { download } from '@/lib/download'
import { ImportError, type MigrationResult, migrateDocument } from './schema'

export { ImportError }
export type { MigrationResult }

const EXPORT_MIME = 'application/json'

/** Nom de fichier horodaté : `tout-compte-fait-2026-07-30.json`. */
export function exportFilename(on: ISODate = today()): string {
  return `tout-compte-fait-${on}.json`
}

/**
 * Nom du fichier de secours, quand le document ne se lit pas. Il se distingue
 * d'un export à l'œil nu : personne ne doit croire l'avoir déjà réimporté.
 */
export function unreadableFilename(on: ISODate = today()): string {
  return `tout-compte-fait-illisible-${on}.json`
}

/** Le document sérialisé, indenté pour rester lisible et diffable. */
export function serializeData(data: Data): string {
  return `${JSON.stringify(data, null, 2)}\n`
}

export function toExportBlob(data: Data): Blob {
  return new Blob([serializeData(data)], { type: EXPORT_MIME })
}

/**
 * Le geste complet : le fichier part sur l'appareil, et la date du jour compte
 * comme dernier export. Trois écrans le demandent désormais — les réglages, le
 * bandeau d'échec d'écriture et l'écran de secours — et l'oubli de
 * `markExported` dans l'un des trois ferait revenir le rappel des trente jours
 * après un export qui a bien eu lieu.
 */
export function downloadExport(data: Data, on: ISODate = today()): void {
  download(toExportBlob(data), exportFilename(on))
  markExported(on)
}

/**
 * Les octets du disque, sans rien en comprendre — ni migration, ni validation.
 *
 * Le nom du fichier est laissé à l'appelant, parce que ce sont deux choses
 * différentes selon d'où l'on vient : un document qu'on n'a pas su lire est une
 * pièce à conviction (`unreadableFilename`), celui qu'on sauve d'un écran
 * blanc est un export ordinaire (`exportFilename`), réimportable tel quel.
 */
export function toRawBlob(raw: unknown): Blob {
  return new Blob([`${JSON.stringify(raw, null, 2)}\n`], { type: EXPORT_MIME })
}

/**
 * Lit un fichier exporté. Lève une `ImportError` dont le message dit ce qui
 * s'est passé et quoi faire — pas d'excuse, pas de détail technique.
 */
export function parseImport(text: string): MigrationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new ImportError(
      "Ce fichier n'est pas du JSON valide. Vérifie qu'il vient bien d'un export Tout compte fait.",
    )
  }
  return migrateDocument(parsed)
}

/* --- Rappel d'export ------------------------------------------------------*/

/**
 * Date du dernier export, gardée hors du document : elle décrit l'état de
 * sauvegarde de cet appareil, pas les finances du foyer. L'inclure à l'export
 * ferait qu'un fichier importé prétendrait avoir été sauvegardé à l'instant.
 */
export const LAST_EXPORT_KEY = 'tout-compte-fait.lastExport'

export const EXPORT_REMINDER_DAYS = 30

export function readLastExport(): ISODate | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY)
  } catch {
    return null
  }
}

/**
 * Date à laquelle le rappel a été écarté. Écarter est un choix, pas un
 * clignement : il survit au changement d'écran et au rechargement.
 */
export const REMINDER_DISMISSED_KEY = 'tout-compte-fait.reminderDismissed'

export function readReminderDismissed(): ISODate | null {
  try {
    return localStorage.getItem(REMINDER_DISMISSED_KEY)
  } catch {
    return null
  }
}

export function dismissReminder(on: ISODate = today()): void {
  try {
    localStorage.setItem(REMINDER_DISMISSED_KEY, on)
  } catch {
    // Sans miroir, la bannière reviendra au prochain écran : c'est le
    // comportement le moins mauvais, et il n'y a rien à en dire.
  }
}

/**
 * Vrai si le dernier export date de plus de 30 jours — ou n'a jamais eu lieu —
 * et que le rappel n'a pas été écarté depuis moins de 30 jours.
 *
 * L'écart n'est pas définitif : un refus vaut pour un cycle, pas pour toujours.
 * Sans quoi une seule croix, le premier jour, condamnerait au silence des
 * données qui ne sont sauvegardées nulle part.
 */
export function shouldRemindExport(
  last: ISODate | null,
  now: ISODate,
  hasData: boolean,
  dismissedOn: ISODate | null = null,
): boolean {
  if (!hasData) return false
  if (dismissedOn !== null && diffDays(dismissedOn, now) <= EXPORT_REMINDER_DAYS) return false
  if (last === null) return true
  return diffDays(last, now) > EXPORT_REMINDER_DAYS
}

/**
 * Oublie tout ce que cet appareil savait de ses sauvegardes.
 *
 * Les deux dates vivent hors du document, et c'est justement pour ça qu'elles
 * survivaient à `resetAll` : effacer IndexedDB ne les touche pas. L'app
 * repartait donc de zéro en annonçant « dernier export le 12 juin » — d'un
 * document qui n'existe plus, et dont le fichier ne sauvegarde plus rien de ce
 * qu'on saisira ensuite. Le refus du rappel part avec, pour la même raison : il
 * portait sur des données qui ne sont plus là.
 */
export function forgetExportMarks(): void {
  try {
    localStorage.removeItem(LAST_EXPORT_KEY)
    localStorage.removeItem(REMINDER_DISMISSED_KEY)
  } catch {
    // Pas de miroir, rien à oublier — et rien à en dire.
  }
}

export function markExported(on: ISODate = today()): void {
  try {
    localStorage.setItem(LAST_EXPORT_KEY, on)
    // Un export remet le compteur à zéro : le prochain rappel, dans trente
    // jours, ne doit pas être avalé par un refus qui date d'avant.
    localStorage.removeItem(REMINDER_DISMISSED_KEY)
  } catch {
    // Sans miroir, la bannière réapparaîtra : c'est le comportement le moins
    // mauvais, et il n'y a rien à dire à l'utilisateur là-dessus.
  }
}
