import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeData } from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import type { Data } from '@/domain/types'
import type * as dbModule from '@/persistence/db'
import type { LoadedDocument } from '@/persistence/db'
import type * as tabsModule from '@/persistence/tabs'
import type { TabMessage } from '@/persistence/tabs'
import { backupDaily, clearBackups, listBackups, readBackup } from '@/persistence/backups'
import { clearDocument, closeDb, loadDocument, loadRawDocument, saveDocument } from '@/persistence/db'
import { HYDRATION_TIMEOUT_MS } from './store'
import type { useStore as UseStore } from './store'

/**
 * Le store tient son writer et son canal au niveau du module : chaque test en
 * reprend des neufs, sinon la file d'écriture d'un cas déborde sur le suivant
 * et les canaux des tests précédents écoutent encore. C'est aussi ce qui permet
 * de lui glisser une écriture qui échoue — le seul moyen de provoquer un quota
 * plein sans quota.
 *
 * Le canal est toujours remplacé : le transport se teste seul dans
 * `tabs.test.ts`, et ce qui compte ici est la politique, qu'on appelle
 * directement par `onTabMessage`.
 */
async function freshStore(options: {
  write?: (data: Data, rev: number) => Promise<void>
  read?: () => Promise<LoadedDocument | null>
} = {}): Promise<{ store: typeof UseStore; posted: TabMessage[] }> {
  vi.resetModules()
  const { write, read } = options

  if (write === undefined && read === undefined) {
    vi.doUnmock('@/persistence/db')
  } else {
    vi.doMock('@/persistence/db', async () => ({
      ...(await vi.importActual<typeof dbModule>('@/persistence/db')),
      ...(write === undefined ? {} : { saveDocument: write }),
      ...(read === undefined ? {} : { loadDocument: read }),
    }))
  }

  const posted: TabMessage[] = []
  vi.doMock('@/persistence/tabs', async () => ({
    ...(await vi.importActual<typeof tabsModule>('@/persistence/tabs')),
    openTabChannel: () => ({
      post: (message: TabMessage) => posted.push(message),
      close: () => {},
    }),
  }))

  return { store: (await import('./store')).useStore, posted }
}

describe('store — échecs de persistance', () => {
  beforeEach(async () => {
    await clearDocument()
  })

  afterEach(() => {
    vi.doUnmock('@/persistence/db')
    vi.doUnmock('@/persistence/tabs')
    closeDb()
  })

  it('signale une écriture qui échoue', async () => {
    const { store } = await freshStore({ write: () => Promise.reject(new Error('quota dépassé')) })

    store.getState().finishOnboarding()
    await store.getState().flush()

    expect(store.getState().error).toStrictEqual({
      kind: 'write',
      message: fr.storage.writeFailed,
    })
  })

  it('efface le bandeau dès que l’écriture repasse', async () => {
    const write = vi
      .fn<(data: Data, rev: number) => Promise<void>>()
      .mockRejectedValueOnce(new Error('quota dépassé'))
      .mockResolvedValue(undefined)
    const { store } = await freshStore({ write })

    store.getState().finishOnboarding()
    await store.getState().flush()
    expect(store.getState().error?.kind).toBe('write')

    store.getState().mutate((data) => ({ ...data, household: { ...data.household, name: 'ok' } }))
    await store.getState().flush()
    expect(store.getState().error).toBeNull()
  })

  it('n’efface pas un échec de lecture par une écriture réussie', async () => {
    // Rien de ce qu'on écrit ne rend lisible ce qui ne l'était pas.
    const { store } = await freshStore()
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
    await saveDocument({ schemaVersion: 99 } as never, 1)
    const { store } = await freshStore()

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
    await saveDocument({ schemaVersion: 99 } as never, 1)
    const { store } = await freshStore()
    await store.getState().hydrate()

    store.getState().finishOnboarding()
    await store.getState().flush()

    expect(store.getState().status).toBe('onboarding')
    await expect(loadRawDocument()).resolves.toStrictEqual({ schemaVersion: 99 })
  })

  it('libère l’onboarding une fois l’illisible effacé, et pas avant', async () => {
    await saveDocument({ schemaVersion: 99 } as never, 1)
    const { store } = await freshStore()
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
      let settle = (value: LoadedDocument | null): void => void value
      const never = new Promise<LoadedDocument | null>((resolve) => {
        settle = resolve
      })
      const { store } = await freshStore({ read: () => never })

      const hydrating = store.getState().hydrate()
      await vi.advanceTimersByTimeAsync(HYDRATION_TIMEOUT_MS)
      await hydrating

      expect(store.getState().status).toBe('onboarding')
      expect(store.getState().error).toStrictEqual({
        kind: 'read',
        message: fr.storage.readTimeout,
      })

      // Le délai gagne définitivement : une lecture tardive ne bascule rien.
      settle({ data: makeData({ household: { name: 'Trop tard', members: [] } }), rev: 1 })
      await vi.advanceTimersByTimeAsync(0)
      expect(store.getState().data.household.name).not.toBe('Trop tard')
    } finally {
      vi.useRealTimers()
    }
  })

  it('recharge au lieu d’écraser quand un autre onglet est plus récent', async () => {
    // Deux onglets : celui-ci a une saisie en attente, l'autre vient d'écrire.
    const { store } = await freshStore()
    await store.getState().hydrate()
    store.getState().finishOnboarding()
    await store.getState().flush()

    const write = vi.spyOn(await import('@/persistence/db'), 'saveDocument')
    await saveDocument(makeData({ household: { name: 'Écrit ailleurs', members: [] } }), 9)
    store.getState().mutate((data) => ({
      ...data,
      household: { ...data.household, name: 'Saisie perdue' },
    }))

    await store.getState().onTabMessage({ type: 'saved', rev: 9 })

    expect(store.getState().data.household.name).toBe('Écrit ailleurs')
    expect(store.getState().rev).toBe(9)
    // L'écriture en attente a été annulée : c'est elle qui aurait écrasé.
    await store.getState().flush()
    expect(write).not.toHaveBeenCalled()
    await expect(loadDocument()).resolves.toMatchObject({
      data: { household: { name: 'Écrit ailleurs' } },
      rev: 9,
    })
  })

  it('annonce chaque écriture aux autres onglets, une seule fois', async () => {
    const { store, posted } = await freshStore()
    await store.getState().hydrate()

    store.getState().finishOnboarding()
    await store.getState().flush()
    store.getState().mutate((data) => ({ ...data, household: { ...data.household, name: 'ok' } }))
    await store.getState().flush()

    // Les révisions se suivent, et c'est ce qui permet à un onglet en retard de
    // savoir qu'il l'est.
    expect(posted).toStrictEqual([
      { type: 'saved', rev: 1 },
      { type: 'saved', rev: 2 },
    ])
  })

  it('ignore une révision qu’il connaît déjà', async () => {
    // Son propre écho, ou un message en retard : cet onglet est à jour.
    const { store } = await freshStore()
    await store.getState().hydrate()
    store.getState().finishOnboarding()
    await store.getState().flush()
    const rev = store.getState().rev

    store.getState().mutate((data) => ({ ...data, household: { ...data.household, name: 'À moi' } }))
    await store.getState().onTabMessage({ type: 'saved', rev })

    expect(store.getState().data.household.name).toBe('À moi')
  })

  it('suit un effacement fait ailleurs', async () => {
    const { store } = await freshStore()
    await store.getState().hydrate()
    store.getState().finishOnboarding()
    await store.getState().flush()

    await store.getState().onTabMessage({ type: 'cleared' })

    expect(store.getState().status).toBe('onboarding')
    expect(store.getState().rev).toBe(0)
  })

  it('archive l’état du démarrage, pas celui qu’il vient d’écrire', async () => {
    // Un point de retour sert à revenir avant ce qui a cassé, et ce qui casse
    // est la session en cours.
    await clearBackups()
    await saveDocument(makeData({ household: { name: 'Au démarrage', members: [] } }), 1)
    const { store } = await freshStore()
    await store.getState().hydrate()

    store.getState().mutate((data) => ({
      ...data,
      household: { ...data.household, name: 'Après coup' },
    }))
    await store.getState().flush()

    const [entry] = await listBackups()
    expect(entry).toBeDefined()
    await expect(readBackup(entry?.on ?? '2000-01-01')).resolves.toMatchObject({
      household: { name: 'Au démarrage' },
    })
  })

  it('n’archive rien après un onboarding : il n’y avait rien avant', async () => {
    await clearBackups()
    const { store } = await freshStore()
    await store.getState().hydrate()

    store.getState().finishOnboarding()
    await store.getState().flush()

    await expect(listBackups()).resolves.toStrictEqual([])
  })

  it('emporte l’anneau quand on efface tout', async () => {
    // La triple confirmation annonce qu'il ne reste rien.
    await backupDaily(makeData({ household: { name: 'hier', members: [] } }), '2026-08-01')
    const { store } = await freshStore()

    await store.getState().resetAll()

    await expect(listBackups()).resolves.toStrictEqual([])
  })

  it('relit sans erreur un document valide', async () => {
    await saveDocument(makeData({ household: { name: 'Chez nous', members: [] } }), 4)
    const { store } = await freshStore()

    await store.getState().hydrate()

    expect(store.getState().status).toBe('ready')
    expect(store.getState().error).toBeNull()
    expect(store.getState().data.household.name).toBe('Chez nous')
  })
})
