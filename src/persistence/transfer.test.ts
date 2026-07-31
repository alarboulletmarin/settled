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
  dismissReminder,
  readReminderDismissed,
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
        shared: true,
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
        shared: false,
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

  it('se tait tant que l’écart tient, puis rappelle de nouveau', () => {
    expect(shouldRemindExport(null, '2026-07-30', true, '2026-07-30')).toBe(false)
    expect(shouldRemindExport(null, '2026-08-29', true, '2026-07-30')).toBe(false)
    expect(shouldRemindExport(null, '2026-08-30', true, '2026-07-30')).toBe(true)
  })

  it('garde l’écart d’un rendu à l’autre', () => {
    dismissReminder('2026-07-30')
    expect(readReminderDismissed()).toBe('2026-07-30')
  })

  it('oublie l’écart dès qu’un export a lieu', () => {
    dismissReminder('2026-07-30')
    markExported('2026-07-31')
    expect(readReminderDismissed()).toBeNull()
  })
})

describe('migration vers les familles', () => {
  /** Un document tel qu'écrit avant l'introduction des familles. */
  function legacy() {
    return JSON.stringify({
      schemaVersion: 1,
      household: { name: 'Maison', members: [] },
      categories: [
        { id: 'housing', label: 'Logement', icon: '', color: 'c', direction: 'out', archived: false },
        { id: 'groceries', label: 'Courses', icon: '', color: 'c', direction: 'out', archived: false },
        { id: 'salary', label: 'Salaire', icon: '', color: 'c', direction: 'in', archived: false },
        { id: 'perso', label: 'Ma catégorie', icon: '', color: 'c', direction: 'out', archived: false },
      ],
      entries: [
        { id: 'e1', label: 'Loyer', categoryId: 'housing', direction: 'out', amount: 85000, date: '2026-06-05', status: 'confirmed' },
      ],
      recurrences: [],
      months: [],
      settings: { theme: 'dark', currency: 'EUR', monthStartsOn: 1 },
    })
  }

  it('signale la migration et atteint la version courante', () => {
    const result = parseImport(legacy())
    expect(result.from).toBe(1)
    expect(result.migrated).toBe(true)
    expect(result.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('range chaque catégorie connue sous sa famille', () => {
    const { categories } = parseImport(legacy()).data
    const familyOf = (id: string) => categories.find((c) => c.id === id)?.familyId
    expect(familyOf('housing')).toBe('fam-housing')
    expect(familyOf('groceries')).toBe('fam-daily')
    expect(familyOf('salary')).toBe('fam-resources')
  })

  it('accueille une catégorie inconnue selon son sens', () => {
    const { categories } = parseImport(legacy()).data
    expect(categories.find((c) => c.id === 'perso')?.familyId).toBe('fam-leisure')
  })

  it('conserve les catégories existantes et leurs entrées', () => {
    const { categories, entries } = parseImport(legacy()).data
    expect(categories.find((c) => c.id === 'housing')?.label).toBe('Logement')
    expect(entries[0]?.categoryId).toBe('housing')
  })

  it('ajoute le catalogue par défaut à côté, sans doublon d’identifiant', () => {
    const { categories, families } = parseImport(legacy()).data
    expect(families.length).toBeGreaterThan(4)
    expect(categories.filter((c) => c.id === 'groceries')).toHaveLength(1)
    // Le catalogue est bien venu s'ajouter : des catégories qui n'existaient pas.
    expect(categories.some((c) => c.id === 'mortgage')).toBe(true)
    expect(categories.some((c) => c.id === 'passbook')).toBe(true)
  })

  it('n’écrase pas des familles déjà présentes', () => {
    const already = JSON.stringify({
      schemaVersion: 1,
      families: [{ id: 'f1', label: 'La mienne', kind: 'charge' }],
      categories: [],
    })
    expect(parseImport(already).data.families).toEqual([
      { id: 'f1', label: 'La mienne', kind: 'charge' },
    ])
  })

  it('donne une nature lisible à chaque famille du catalogue', () => {
    const { families } = parseImport(legacy()).data
    const kinds = new Set(families.map((f) => f.kind))
    expect(kinds).toEqual(new Set(['resource', 'charge', 'debt', 'saving']))
  })
})

describe('migration vers la répartition entre membres', () => {
  /** Un document tel qu'écrit avant les revenus et le partage. */
  function v2() {
    return JSON.stringify({
      schemaVersion: 2,
      household: { name: 'Maison', members: [{ id: 'm1', name: 'Alix', color: 'c' }] },
      families: [{ id: 'fam-housing', label: 'Logement', kind: 'charge' }],
      categories: [
        { id: 'housing', label: 'Loyer', familyId: 'fam-housing', icon: '', color: 'c', direction: 'out', archived: false },
      ],
      recurrences: [],
      entries: [
        { id: 'e1', label: 'Loyer', categoryId: 'housing', direction: 'out', amount: 85000, date: '2026-06-05', status: 'confirmed' },
      ],
      debts: [],
      months: [],
      settings: { theme: 'dark', currency: 'EUR', monthStartsOn: 1 },
    })
  }

  it('atteint la version courante sans rien perdre', () => {
    const result = parseImport(v2())
    expect(result.from).toBe(2)
    expect(result.migrated).toBe(true)
    expect(result.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.data.entries).toHaveLength(1)
    expect(result.data.household.members[0]?.name).toBe('Alix')
  })

  it('laisse `shared` absent, pour que la règle tranche', () => {
    const { data } = parseImport(v2())
    expect(data.entries[0]).not.toHaveProperty('shared')
  })

  it('écarte un `shared` illisible plutôt que de l’interpréter', () => {
    const bogus = JSON.stringify({
      schemaVersion: 3,
      household: { name: 'Maison', members: [] },
      categories: [],
      entries: [
        { id: 'e1', label: 'A', categoryId: 'c', direction: 'out', amount: 100, date: '2026-07-01', status: 'confirmed', shared: 'oui' },
        { id: 'e2', label: 'B', categoryId: 'c', direction: 'out', amount: 100, date: '2026-07-02', status: 'confirmed', shared: false },
      ],
    })
    const { entries } = parseImport(bogus).data
    expect(entries[0]).not.toHaveProperty('shared')
    // `false` est une exception explicite, elle survit.
    expect(entries[1]?.shared).toBe(false)
  })
})

describe('montant habituel d’une récurrence variable (v4)', () => {
  const doc = (recurrence: Record<string, unknown>) =>
    JSON.stringify({
      schemaVersion: 4,
      household: { name: 'Maison', members: [] },
      categories: [],
      recurrences: [
        {
          id: 'r1', label: 'Salaire', categoryId: 'salary', direction: 'in',
          period: { unit: 'month', every: 1, anchorDay: 27 }, startedOn: '2026-01-27',
          ...recurrence,
        },
      ],
    })

  it('survit à l’aller-retour sur un montant variable', () => {
    const { recurrences } = parseImport(doc({ amount: null, estimate: 250_000 })).data
    expect(recurrences[0]?.estimate).toBe(250_000)
  })

  it('n’a rien à faire sur un montant fixe : il n’y a rien à estimer', () => {
    const { recurrences } = parseImport(doc({ amount: 1099, estimate: 250_000 })).data
    expect(recurrences[0]).not.toHaveProperty('estimate')
  })

  it('écarte une estimation illisible ou nulle plutôt que de l’interpréter', () => {
    expect(parseImport(doc({ amount: null, estimate: 'beaucoup' })).data.recurrences[0])
      .not.toHaveProperty('estimate')
    expect(parseImport(doc({ amount: null, estimate: 0 })).data.recurrences[0])
      .not.toHaveProperty('estimate')
  })

  it('un document v3 reste lisible, simplement sans montant habituel', () => {
    const v3 = doc({ amount: null }).replace('"schemaVersion":4', '"schemaVersion":3')
    const result = parseImport(v3)
    expect(result.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.data.recurrences[0]).not.toHaveProperty('estimate')
  })
})

describe('avances (v5)', () => {
  const doc = (advances: unknown) =>
    JSON.stringify({
      schemaVersion: 5,
      household: { name: 'Maison', members: [{ id: 'm1', name: 'Alix', color: 'var(--cat-1)' }] },
      categories: [],
      advances,
    })

  const complete = {
    id: 'av1',
    label: 'Assurance auto',
    categoryId: 'car-insurance',
    memberId: 'm1',
    amount: 60_000,
    paidOn: '2026-01-15',
    from: '2026-01',
    to: '2026-12',
    recurrenceId: 'r1',
  }

  it('survit à l’aller-retour', () => {
    expect(parseImport(doc([complete])).data.advances[0]).toEqual(complete)
  })

  /* Le montant est le seul chiffre qu'une avance apporte : sans lui, il n'y a
     rien à reconstituer, et la ligne ne dirait rien de juste. */
  it('écarte une avance sans montant lisible', () => {
    expect(parseImport(doc([{ ...complete, amount: 'six cents' }])).data.advances).toEqual([])
  })

  /* Une épargne est toujours à quelqu'un : sans porteur, la mensualité ne
     reviendrait sur le livret de personne. */
  it('écarte une avance que personne ne porte', () => {
    const { memberId: _, ...orphan } = complete
    expect(parseImport(doc([orphan])).data.advances).toEqual([])
  })

  it('replie une période illisible sur le mois du paiement', () => {
    const vague = { ...complete, from: 'plus tard', to: 'jamais' }
    const advance = parseImport(doc([vague])).data.advances[0]
    expect(advance?.from).toBe('2026-01')
    expect(advance?.to).toBe('2026-01')
  })

  it('un document v4 reste lisible, simplement sans avance', () => {
    const v4 = doc([complete]).replace('"schemaVersion":5', '"schemaVersion":4')
    const result = parseImport(v4)
    expect(result.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.data.advances).toEqual([])
  })
})
