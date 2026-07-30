/* ============================================================================
 * Version du document et pipeline de migrations.
 *
 * Chaque changement de forme incrémente CURRENT_SCHEMA_VERSION et ajoute une
 * entrée dans MIGRATIONS. Le pipeline existe dès la v1, y compris pour la
 * version 1 → 1 : un document déjà à jour traverse quand même l'étape de
 * normalisation, ce qui garantit qu'un fichier tronqué ou bricolé à la main
 * ressort exploitable plutôt qu'à moitié valide.
 * ==========================================================================*/

import type { Data } from '@/domain/types'
import { normalizeData } from './validate'

export const CURRENT_SCHEMA_VERSION = 1

/** Un document venu du disque, avant toute validation. */
export type RawDocument = Record<string, unknown>

export type Migration = {
  /** Version atteinte une fois la migration appliquée. */
  to: number
  migrate: (doc: RawDocument) => RawDocument
}

/**
 * Migration d'un document antérieur au versionnement — ou sans `schemaVersion`.
 * Elle ne fait qu'inscrire la version : la mise en forme est le travail de
 * `normalizeData`, appliqué ensuite dans tous les cas.
 */
function toVersion1(doc: RawDocument): RawDocument {
  return { ...doc, schemaVersion: 1 }
}

export const MIGRATIONS: Migration[] = [{ to: 1, migrate: toVersion1 }]

export class ImportError extends Error {
  override name = 'ImportError'
}

function readVersion(doc: RawDocument): number {
  const raw = doc['schemaVersion']
  return typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 ? raw : 0
}

export type MigrationResult = {
  data: Data
  /** Version d'origine du document, avant migration. */
  from: number
  /** Vrai si au moins une migration a été appliquée. */
  migrated: boolean
}

/**
 * Amène un document quelconque à la version courante, puis le valide.
 * Lève une `ImportError` si le document est inexploitable.
 */
export function migrateDocument(raw: unknown): MigrationResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ImportError('Le fichier ne contient pas un document Settled.')
  }

  let doc = raw as RawDocument
  const from = readVersion(doc)

  if (from > CURRENT_SCHEMA_VERSION) {
    throw new ImportError(
      `Ce fichier vient d'une version plus récente de l'app (schéma ${String(from)}). Mets Settled à jour avant de l'importer.`,
    )
  }

  const applied = MIGRATIONS.filter((m) => m.to > from).sort((a, b) => a.to - b.to)
  for (const migration of applied) doc = migration.migrate(doc)

  return { data: normalizeData(doc), from, migrated: applied.length > 0 }
}
