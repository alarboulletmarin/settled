import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { eur, makeData, makeEntry } from '@/domain/fixtures'
import {
  type DbEvent,
  clearDocument,
  closeDb,
  handleDbEvent,
  loadDocument,
  loadRawDocument,
  saveDocument,
  setDbEventHandler,
} from './db'
import { emptyData } from './defaults'
import { CURRENT_SCHEMA_VERSION } from './schema'

describe('document IndexedDB', () => {
  beforeEach(async () => {
    await clearDocument()
  })

  afterEach(() => {
    closeDb()
  })

  it('ne renvoie rien au premier lancement', async () => {
    await expect(loadDocument()).resolves.toBeNull()
  })

  it('relit exactement ce qu’il a écrit', async () => {
    const data = makeData({
      household: { name: 'Chez nous', members: [{ id: 'm1', name: 'Alix', color: 'c' }] },
      entries: [makeEntry({ date: '2026-07-05', amount: eur(95000) })],
    })
    await saveDocument(data)
    await expect(loadDocument()).resolves.toStrictEqual(data)
  })

  it('remplace le document au lieu d’en accumuler', async () => {
    await saveDocument(emptyData())
    await saveDocument(makeData({ household: { name: 'Deuxième', members: [] } }))
    const loaded = await loadDocument()
    expect(loaded?.household.name).toBe('Deuxième')
  })

  it('fait passer le document stocké par les migrations à la relecture', async () => {
    // Un document écrit par une version antérieure, sans schemaVersion.
    await saveDocument({ household: { name: 'Ancien' } } as never)
    const loaded = await loadDocument()
    expect(loaded?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(loaded?.household.name).toBe('Ancien')
  })

  it('efface tout', async () => {
    await saveDocument(emptyData())
    await clearDocument()
    await expect(loadDocument()).resolves.toBeNull()
  })

  it('rend les octets stockés sans les faire passer par les migrations', async () => {
    // `loadDocument` refuserait ce document ; c'est justement le cas où il faut
    // pouvoir en proposer une copie plutôt que de l'effacer.
    await saveDocument({ schemaVersion: 99 } as never)
    await expect(loadRawDocument()).resolves.toStrictEqual({ schemaVersion: 99 })
    await expect(loadDocument()).rejects.toThrow()
  })
})

describe('incidents de connexion', () => {
  afterEach(() => {
    setDbEventHandler(() => {})
    closeDb()
  })

  it('lâche la connexion quand un autre onglet veut migrer', async () => {
    const seen: DbEvent[] = []
    setDbEventHandler((event) => seen.push(event))
    await saveDocument(emptyData())

    handleDbEvent('blocking')

    expect(seen).toStrictEqual(['blocking'])
    // La connexion rouverte relit le même document : rien n'est perdu à fermer.
    await expect(loadDocument()).resolves.not.toBeNull()
  })

  it('oublie une connexion coupée pour que la suivante rouvre', async () => {
    const seen: DbEvent[] = []
    setDbEventHandler((event) => seen.push(event))
    await saveDocument(emptyData())

    handleDbEvent('terminated')

    expect(seen).toStrictEqual(['terminated'])
    await expect(loadDocument()).resolves.not.toBeNull()
  })

  it('ne ferme rien quand c’est nous qui attendons', async () => {
    // `blocked` tombe pendant l'ouverture : fermer perdrait la promesse qui
    // aboutira quand l'autre onglet partira.
    const seen: DbEvent[] = []
    setDbEventHandler((event) => seen.push(event))
    await saveDocument(emptyData())

    handleDbEvent('blocked')

    expect(seen).toStrictEqual(['blocked'])
    await expect(loadDocument()).resolves.not.toBeNull()
  })
})
