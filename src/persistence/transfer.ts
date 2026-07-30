/* ============================================================================
 * Export et import du fichier de données.
 *
 * L'export contient le document complet et son schemaVersion. Un import
 * remplace intégralement les données et passe par les migrations (cahier §4.8).
 * ==========================================================================*/

import { type ISODate, diffDays, today } from '@/domain/date'
import type { Data } from '@/domain/types'
import { ImportError, type MigrationResult, migrateDocument } from './schema'

export { ImportError }

const EXPORT_MIME = 'application/json'

/** Nom de fichier horodaté : `settled-2026-07-30.json`. */
export function exportFilename(on: ISODate = today()): string {
  return `settled-${on}.json`
}

/** Le document sérialisé, indenté pour rester lisible et diffable. */
export function serializeData(data: Data): string {
  return `${JSON.stringify(data, null, 2)}\n`
}

export function toExportBlob(data: Data): Blob {
  return new Blob([serializeData(data)], { type: EXPORT_MIME })
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
    throw new ImportError("Ce fichier n'est pas du JSON valide. Vérifie qu'il vient bien d'un export Settled.")
  }
  return migrateDocument(parsed)
}

/* --- Rappel d'export ------------------------------------------------------*/

/**
 * Date du dernier export, gardée hors du document : elle décrit l'état de
 * sauvegarde de cet appareil, pas les finances du foyer. L'inclure à l'export
 * ferait qu'un fichier importé prétendrait avoir été sauvegardé à l'instant.
 */
export const LAST_EXPORT_KEY = 'settled.lastExport'

export const EXPORT_REMINDER_DAYS = 30

export function readLastExport(): ISODate | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY)
  } catch {
    return null
  }
}

/** Vrai si le dernier export date de plus de 30 jours — ou n'a jamais eu lieu. */
export function shouldRemindExport(
  last: ISODate | null,
  now: ISODate,
  hasData: boolean,
): boolean {
  if (!hasData) return false
  if (last === null) return true
  return diffDays(last, now) > EXPORT_REMINDER_DAYS
}

export function markExported(on: ISODate = today()): void {
  try {
    localStorage.setItem(LAST_EXPORT_KEY, on)
  } catch {
    // Sans miroir, la bannière réapparaîtra : c'est le comportement le moins
    // mauvais, et il n'y a rien à dire à l'utilisateur là-dessus.
  }
}
