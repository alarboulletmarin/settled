import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eur, makeData, makeEntry } from '@/domain/fixtures'
import { clearDocument, closeDb, createWriter, loadDocument, saveDocument } from './db'
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

describe('écriture en debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fusionne les mutations rapprochées en une seule écriture', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const writer = createWriter(write, 400)

    writer.schedule(makeData({ household: { name: 'a', members: [] } }))
    writer.schedule(makeData({ household: { name: 'b', members: [] } }))
    writer.schedule(makeData({ household: { name: 'c', members: [] } }))
    expect(write).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(400)
    expect(write).toHaveBeenCalledTimes(1)
    expect(write.mock.calls[0]?.[0]).toMatchObject({ household: { name: 'c' } })
  })

  it('écrit immédiatement quand on vide la file', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const writer = createWriter(write, 400)
    writer.schedule(emptyData())
    await writer.flush()
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('ne réécrit pas une seconde fois après un flush', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const writer = createWriter(write, 400)
    writer.schedule(emptyData())
    await writer.flush()
    await vi.advanceTimersByTimeAsync(1000)
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('abandonne une écriture en attente', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const writer = createWriter(write, 400)
    writer.schedule(emptyData())
    writer.cancel()
    await vi.advanceTimersByTimeAsync(1000)
    expect(write).not.toHaveBeenCalled()
  })

  it('ne fait rien quand il n’y a rien à vider', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    await createWriter(write, 400).flush()
    expect(write).not.toHaveBeenCalled()
  })
})
