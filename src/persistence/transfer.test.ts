import { beforeEach, describe, expect, it } from 'vitest'
import { eur, makeCategory, makeData, makeEntry, makeRecurrence } from '@/domain/fixtures'
import type { Data } from '@/domain/types'
import { emptyData } from './defaults'
import { CURRENT_SCHEMA_VERSION, ImportError } from './schema'
import {
  EXPORT_REMINDER_DAYS,
  exportFilename,
  markExported,
  parseImport,
  readLastExport,
  serializeData,
  shouldRemindExport,
} from './transfer'

/** Un document qui exerce tous les champs du modèle, y compris les optionnels. */
function richData(): Data {
  return makeData({
    household: {
      name: 'Chez nous',
      members: [
        { id: 'm1', name: 'Alix', color: 'var(--cat-1)' },
        { id: 'm2', name: 'Camille', color: 'var(--cat-2)' },
      ],
    },
    categories: [
      makeCategory({ id: 'logement', label: 'Logement', direction: 'out' }),
      makeCategory({ id: 'salaire', label: 'Salaire', direction: 'in', archived: true }),
    ],
    recurrences: [
      makeRecurrence({
        id: 'loyer',
        label: 'Loyer',
        categoryId: 'logement',
        memberId: 'm1',
        amount: eur(95000),
        period: { unit: 'month', every: 1, anchorDay: 5 },
        startedOn: '2026-01-05',
        note: 'virement automatique',
      }),
      makeRecurrence({
        id: 'elec',
        label: 'Électricité',
        categoryId: 'logement',
        amount: null,
        period: { unit: 'month', every: 2, anchorDay: 31 },
        startedOn: '2025-11-30',
        endedOn: '2026-09-30',
      }),
    ],
    entries: [
      makeEntry({
        id: 'e1',
        recurrenceId: 'loyer',
        label: 'Loyer',
        categoryId: 'logement',
        memberId: 'm1',
        date: '2026-07-05',
        amount: eur(95000),
        status: 'confirmed',
        note: 'juillet',
      }),
      makeEntry({
        id: 'e2',
        label: 'Salaire',
        categoryId: 'salaire',
        direction: 'in',
        date: '2026-07-28',
        amount: eur(240000),
        status: 'planned',
      }),
      makeEntry({ id: 'e3', date: '2026-07-12', amount: eur(-1250) }),
    ],
    months: [
      { ym: '2026-07', openedAt: '2026-07-01', closed: false },
      { ym: '2026-06', openedAt: '2026-06-01', closed: true },
    ],
    settings: { theme: 'dark', currency: 'CHF', monthStartsOn: 1 },
  })
}

describe('aller-retour export / import', () => {
  it('restitue un état strictement identique', () => {
    const original = richData()
    const restored = parseImport(serializeData(original)).data
    expect(restored).toStrictEqual(original)
  })

  it('restitue à l’identique un document tout juste créé', () => {
    const original = emptyData()
    expect(parseImport(serializeData(original)).data).toStrictEqual(original)
  })

  it('reste stable sur un second aller-retour', () => {
    const once = parseImport(serializeData(richData())).data
    const twice = parseImport(serializeData(once)).data
    expect(twice).toStrictEqual(once)
    expect(serializeData(twice)).toBe(serializeData(once))
  })

  it('ne fabrique pas de champ optionnel absent', () => {
    const restored = parseImport(serializeData(richData())).data
    expect(restored.entries[1]).not.toHaveProperty('recurrenceId')
    expect(restored.entries[1]).not.toHaveProperty('memberId')
    expect(restored.entries[1]).not.toHaveProperty('note')
    expect(restored.recurrences[0]).not.toHaveProperty('endedOn')
  })

  it('conserve un montant variable à null, sans le confondre avec zéro', () => {
    const restored = parseImport(serializeData(richData())).data
    expect(restored.recurrences[1]?.amount).toBeNull()
  })

  it('emporte le schemaVersion', () => {
    const restored = parseImport(serializeData(richData())).data
    expect(restored.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })
})

describe('import — fichiers hostiles', () => {
  it('refuse ce qui n’est pas du JSON', () => {
    expect(() => parseImport('{ pas du json')).toThrow(ImportError)
  })

  it('refuse un JSON qui n’est pas un document', () => {
    expect(() => parseImport('[]')).toThrow(ImportError)
    expect(() => parseImport('"texte"')).toThrow(ImportError)
    expect(() => parseImport('null')).toThrow(ImportError)
  })

  it('refuse un schéma venu du futur, en disant quoi faire', () => {
    const future = JSON.stringify({ ...emptyData(), schemaVersion: 99 })
    expect(() => parseImport(future)).toThrow(/mets settled à jour/i)
  })

  it('écarte une entrée au montant fractionnaire plutôt que de l’arrondir', () => {
    const broken = JSON.stringify({
      schemaVersion: 1,
      entries: [{ id: 'x', date: '2026-07-01', amount: 12.5, direction: 'out' }],
    })
    expect(parseImport(broken).data.entries).toEqual([])
  })

  it('écarte une entrée dont la date n’existe pas', () => {
    const broken = JSON.stringify({
      schemaVersion: 1,
      entries: [{ id: 'x', date: '2026-02-30', amount: 1000, direction: 'out' }],
    })
    expect(parseImport(broken).data.entries).toEqual([])
  })

  it('remet les valeurs par défaut sur un document tronqué', () => {
    const data = parseImport('{}').data
    expect(data.household.name).toBe('Maison')
    expect(data.settings).toEqual({ theme: 'system', currency: 'EUR', monthStartsOn: 1 })
    expect(data.entries).toEqual([])
  })
})

describe('migrations', () => {
  it('migre un document sans schemaVersion et le signale', () => {
    const legacy = JSON.stringify({ household: { name: 'Maison' }, entries: [] })
    const result = parseImport(legacy)
    expect(result.from).toBe(0)
    expect(result.migrated).toBe(true)
    expect(result.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('ne signale aucune migration pour un document déjà à jour', () => {
    const result = parseImport(serializeData(emptyData()))
    expect(result.from).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.migrated).toBe(false)
  })
})

describe('nom de fichier', () => {
  it('est horodaté', () => {
    expect(exportFilename('2026-07-30')).toBe('settled-2026-07-30.json')
  })
})

describe('rappel d’export', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('ne rappelle rien tant qu’il n’y a pas de données', () => {
    expect(shouldRemindExport(null, '2026-07-30', false)).toBe(false)
  })

  it('rappelle si aucun export n’a jamais eu lieu', () => {
    expect(shouldRemindExport(null, '2026-07-30', true)).toBe(true)
  })

  it('rappelle passé trente jours, pas avant', () => {
    expect(shouldRemindExport('2026-07-01', '2026-07-31', true)).toBe(false)
    expect(shouldRemindExport('2026-07-01', '2026-08-01', true)).toBe(true)
    expect(EXPORT_REMINDER_DAYS).toBe(30)
  })

  it('relit la date qu’il a écrite', () => {
    markExported('2026-07-30')
    expect(readLastExport()).toBe('2026-07-30')
  })
})
