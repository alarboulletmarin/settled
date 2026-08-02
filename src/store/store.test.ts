import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeData } from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import type { Data } from '@/domain/types'
import type * as dbModule from '@/persistence/db'
import { clearDocument, closeDb, loadRawDocument, saveDocument } from '@/persistence/db'
import { HYDRATION_TIMEOUT_MS } from './store'
import type { useStore as UseStore } from './store'

/**
 * Le store tient son writer au niveau du module : chaque test en reprend un
 * neuf, sinon la file d'écriture d'un cas déborde sur le suivant. C'est aussi
 * ce qui permet de lui glisser une écriture qui échoue — le seul moyen de
 * provoquer un quota plein sans quota.
 */
async function freshStore(
  write?: (data: Data) => Promise<void>,
  read?: () => Promise<Data | null>,
): Promise<typeof UseStore> {
  vi.resetModules()
  if (write === undefined && read === undefined) {
    vi.doUnmock('@/persistence/db')
  } else {
    vi.doMock('@/persistence/db', async () => ({
      ...(await vi.importActual<typeof dbModule>('@/persistence/db')),
      ...(write === undefined ? {} : { saveDocument: write }),
      ...(read === undefined ? {} : { loadDocument: read }),
    }))
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

  it('n’écrase pas un document illisible en créant un foyer', async () => {
    // Le scénario de perte le plus complet : la base contient quelque chose,
    // l'app ne sait pas l'ouvrir, et la première question la réécrivait.
    await saveDocument({ schemaVersion: 99 } as never)
    const store = await freshStore()
    await store.getState().hydrate()

    store.getState().finishOnboarding()
    await store.getState().flush()

    expect(store.getState().status).toBe('onboarding')
    await expect(loadRawDocument()).resolves.toStrictEqual({ schemaVersion: 99 })
  })

  it('libère l’onboarding une fois l’illisible effacé, et pas avant', async () => {
    await saveDocument({ schemaVersion: 99 } as never)
    const store = await freshStore()
    await store.getState().hydrate()

    await store.getState().discardUnreadable()

    expect(store.getState().error).toBeNull()
    await expect(loadRawDocument()).resolves.toBeUndefined()

    store.getState().finishOnboarding()
    await store.getState().flush()
    expect(store.getState().status).toBe('ready')
  })

  it('cesse d’attendre une base qui ne répond pas', async () => {
    // Une ouverture bloquée par un onglet resté sur la version précédente ne
    // résout jamais sa promesse : `BootScreen` tournait pour toujours.
    vi.useFakeTimers()
    try {
      let settle = (value: Data | null): void => void value
      const never = new Promise<Data | null>((resolve) => {
        settle = resolve
      })
      const store = await freshStore(undefined, () => never)

      const hydrating = store.getState().hydrate()
      await vi.advanceTimersByTimeAsync(HYDRATION_TIMEOUT_MS)
      await hydrating

      expect(store.getState().status).toBe('onboarding')
      expect(store.getState().error).toStrictEqual({
        kind: 'read',
        message: fr.storage.readTimeout,
      })

      // Le délai gagne définitivement : une lecture tardive ne bascule rien.
      settle(makeData({ household: { name: 'Trop tard', members: [] } }))
      await vi.advanceTimersByTimeAsync(0)
      expect(store.getState().data.household.name).not.toBe('Trop tard')
    } finally {
      vi.useRealTimers()
    }
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
