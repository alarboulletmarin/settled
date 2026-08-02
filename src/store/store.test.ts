import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeData } from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import type { Data } from '@/domain/types'
import type * as dbModule from '@/persistence/db'
import { clearDocument, closeDb, saveDocument } from '@/persistence/db'
import type { useStore as UseStore } from './store'

/**
 * Le store tient son writer au niveau du module : chaque test en reprend un
 * neuf, sinon la file d'écriture d'un cas déborde sur le suivant. C'est aussi
 * ce qui permet de lui glisser une écriture qui échoue — le seul moyen de
 * provoquer un quota plein sans quota.
 */
async function freshStore(write?: (data: Data) => Promise<void>): Promise<typeof UseStore> {
  vi.resetModules()
  if (write !== undefined) {
    vi.doMock('@/persistence/db', async () => ({
      ...(await vi.importActual<typeof dbModule>('@/persistence/db')),
      saveDocument: write,
    }))
  } else {
    vi.doUnmock('@/persistence/db')
  }
  return (await import('./store')).useStore
}

describe('store — échecs de persistance', () => {
  beforeEach(async () => {
    await clearDocument()
  })

  afterEach(() => {
    vi.doUnmock('@/persistence/db')
    closeDb()
  })

  it('signale une écriture qui échoue', async () => {
    const store = await freshStore(() => Promise.reject(new Error('quota dépassé')))

    store.getState().finishOnboarding()
    await store.getState().flush()

    expect(store.getState().error).toStrictEqual({
      kind: 'write',
      message: fr.storage.writeFailed,
    })
  })

  it('efface le bandeau dès que l’écriture repasse', async () => {
    const write = vi
      .fn<(data: Data) => Promise<void>>()
      .mockRejectedValueOnce(new Error('quota dépassé'))
      .mockResolvedValue(undefined)
    const store = await freshStore(write)

    store.getState().finishOnboarding()
    await store.getState().flush()
    expect(store.getState().error?.kind).toBe('write')

    store.getState().mutate((data) => ({ ...data, household: { ...data.household, name: 'ok' } }))
    await store.getState().flush()
    expect(store.getState().error).toBeNull()
  })

  it('n’efface pas un échec de lecture par une écriture réussie', async () => {
    // Rien de ce qu'on écrit ne rend lisible ce qui ne l'était pas.
    const store = await freshStore()
    store.getState().setError({ kind: 'read', message: fr.storage.readFailed })

    store.getState().finishOnboarding()
    await store.getState().flush()

    expect(store.getState().error).toStrictEqual({
      kind: 'read',
      message: fr.storage.readFailed,
    })
  })

  it('signale un document illisible plutôt que d’ouvrir sur du vide', async () => {
    // Un document venu d'une version plus récente : `migrateDocument` refuse.
    await saveDocument({ schemaVersion: 99 } as never)
    const store = await freshStore()

    await store.getState().hydrate()

    expect(store.getState().status).toBe('onboarding')
    expect(store.getState().error).toStrictEqual({
      kind: 'read',
      message: fr.storage.readFailed,
    })
  })

  it('relit sans erreur un document valide', async () => {
    await saveDocument(makeData({ household: { name: 'Chez nous', members: [] } }))
    const store = await freshStore()

    await store.getState().hydrate()

    expect(store.getState().status).toBe('ready')
    expect(store.getState().error).toBeNull()
    expect(store.getState().data.household.name).toBe('Chez nous')
  })
})
