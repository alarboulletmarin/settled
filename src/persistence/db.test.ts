import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { eur, makeData, makeEntry } from '@/domain/fixtures'
import { clearDocument, closeDb, loadDocument, saveDocument } from './db'
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
})
