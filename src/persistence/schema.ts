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
import { defaultCategories, defaultFamilies, fallbackFamilyId } from './defaults'
import { normalizeData } from './validate'

export const CURRENT_SCHEMA_VERSION = 4

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

/**
 * Où atterrit chacune des neuf catégories du jeu d'origine, quand le document
 * est antérieur aux familles. Ce qui n'y figure pas — une catégorie créée par
 * l'utilisateur — tombe dans la famille d'accueil de son sens.
 */
const LEGACY_FAMILY: Record<string, string> = {
  housing: 'fam-housing',
  groceries: 'fam-daily',
  transport: 'fam-transport',
  health: 'fam-health',
  leisure: 'fam-leisure',
  subscriptions: 'fam-communication',
  misc: 'fam-leisure',
  salary: 'fam-resources',
  otherIncome: 'fam-resources',
}

/**
 * Introduction des familles, des natures et des crédits.
 *
 * Rien n'est effacé : chaque catégorie déjà présente est rangée sous une
 * famille et garde son identifiant, donc les entrées déjà saisies continuent
 * de la désigner. Le catalogue par défaut est ajouté à côté, pour que la
 * nouvelle arborescence soit utilisable sans avoir à la ressaisir — une
 * catégorie du catalogue dont l'identifiant existe déjà n'est pas dupliquée.
 */
function toVersion2(doc: RawDocument): RawDocument {
  const existing: unknown[] = Array.isArray(doc['categories']) ? doc['categories'] : []

  const adopted: RawDocument[] = []
  const known = new Set<string>()
  for (const raw of existing) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) continue
    const category = raw as RawDocument
    const id = typeof category['id'] === 'string' ? category['id'] : ''
    if (id !== '') known.add(id)
    const alreadyPlaced =
      typeof category['familyId'] === 'string' && category['familyId'].length > 0
    if (alreadyPlaced) {
      adopted.push(category)
      continue
    }
    const direction = category['direction'] === 'in' ? 'in' : 'out'
    adopted.push({ ...category, familyId: LEGACY_FAMILY[id] ?? fallbackFamilyId(direction) })
  }

  const families: unknown[] =
    Array.isArray(doc['families']) && doc['families'].length > 0 ? doc['families'] : defaultFamilies()

  return {
    ...doc,
    schemaVersion: 2,
    families,
    categories: [...adopted, ...defaultCategories().filter((c) => !known.has(c.id))],
    debts: Array.isArray(doc['debts']) ? (doc['debts'] as unknown[]) : [],
  }
}

/**
 * Répartition des charges entre membres : `shared` sur les entrées comme sur
 * les récurrences.
 *
 * Les deux champs sont facultatifs, et leur absence a un sens défini — une
 * entrée sans `shared` s'en remet à la règle, qui sait déjà la ranger. Un
 * document v2 est donc déjà un document v3
 * valide : la migration n'a que la version à inscrire. Elle existe quand même,
 * parce que le pipeline veut une étape par incrément et qu'une marche
 * manquante se paie la fois d'après.
 */
function toVersion3(doc: RawDocument): RawDocument {
  return { ...doc, schemaVersion: 3 }
}

/**
 * Le montant habituel d'un abonnement à montant variable — `Recurrence.estimate`.
 *
 * Facultatif, et son absence a le sens qu'elle avait déjà : l'abonnement vaut
 * ce que disent ses échéances, et rien tant qu'aucune n'est chiffrée. Un
 * document v3 est donc déjà un document v4 valide, et la migration n'a que la
 * version à inscrire — elle existe quand même, parce que le pipeline veut une
 * étape par incrément et qu'une marche manquante se paie la fois d'après.
 */
function toVersion4(doc: RawDocument): RawDocument {
  return { ...doc, schemaVersion: 4 }
}

export const MIGRATIONS: Migration[] = [
  { to: 1, migrate: toVersion1 },
  { to: 2, migrate: toVersion2 },
  { to: 3, migrate: toVersion3 },
  { to: 4, migrate: toVersion4 },
]

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
