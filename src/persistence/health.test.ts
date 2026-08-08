import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DURABILITY_ASKED_KEY,
  DURABILITY_DISMISSED_KEY,
  type StorageHealth,
  askDurability,
  dismissDurabilityNotice,
  isKnownFragile,
  noteWrite,
  noteWriteFailure,
  probeDurability,
  readDurabilityDismissed,
  shouldWarnDurability,
  useStorageHealth,
} from './health'

/** jsdom n'expose pas `navigator.storage` : on le pose et on le retire. */
function withStorage(value: Partial<StorageManager> | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(navigator, 'storage')
    return
  }
  Object.defineProperty(navigator, 'storage', { value, configurable: true })
}

const fresh = (): StorageHealth => ({
  durable: 'unknown',
  probed: false,
  asked: false,
  lastWriteAt: null,
  lastFailureAt: null,
})

beforeEach(() => {
  localStorage.clear()
  useStorageHealth.setState(fresh())
})

afterEach(() => {
  withStorage(undefined)
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('la durabilité qu’on relit', () => {
  it('retient un stockage déjà persistant', async () => {
    withStorage({ persisted: () => Promise.resolve(true) })
    await expect(probeDurability()).resolves.toBe(true)
    expect(useStorageHealth.getState()).toMatchObject({ durable: true, probed: true })
  })

  it('retient un refus sans le confondre avec un silence', async () => {
    withStorage({ persisted: () => Promise.resolve(false) })
    await probeDurability()
    expect(useStorageHealth.getState().durable).toBe(false)
  })

  it('reste sur « on ne sait pas » là où l’API n’existe pas', async () => {
    withStorage(undefined)
    await probeDurability()
    expect(useStorageHealth.getState()).toMatchObject({ durable: 'unknown', probed: true })
  })

  it('ne lève pas quand l’API rejette', async () => {
    withStorage({ persisted: () => Promise.reject(new Error('cassé')) })
    await expect(probeDurability()).resolves.toBe('unknown')
  })

  /* Relire n'est pas demander : c'est ce qui part à l'hydratation, et une
     invite Firefox devant quelqu'un qui vient d'ouvrir l'app serait exactement
     ce que le cahier §5 évite en plaçant la demande à deux moments précis. */
  it('ne demande rien en relisant', async () => {
    const persist = vi.fn(() => Promise.resolve(true))
    withStorage({ persisted: () => Promise.resolve(false), persist })
    await probeDurability()
    expect(persist).not.toHaveBeenCalled()
  })
})

describe('la durabilité qu’on demande', () => {
  it('l’obtient et la retient', async () => {
    withStorage({ persisted: () => Promise.resolve(false), persist: () => Promise.resolve(true) })
    await expect(askDurability()).resolves.toBe(true)
    expect(useStorageHealth.getState()).toMatchObject({ durable: true, asked: true })
    expect(localStorage.getItem(DURABILITY_ASKED_KEY)).not.toBeNull()
  })

  it('encaisse un refus, et se souvient d’avoir demandé', async () => {
    withStorage({ persisted: () => Promise.resolve(false), persist: () => Promise.resolve(false) })
    await expect(askDurability()).resolves.toBe(false)
    expect(useStorageHealth.getState()).toMatchObject({ durable: false, asked: true })
  })

  /* Là où l'API n'existe pas, personne n'a été interrogé : marquer la demande
     laisserait dire plus tard que ce navigateur a refusé, ce qu'il n'a jamais
     fait. */
  it('ne compte pas comme une demande là où il n’y a personne à qui demander', async () => {
    withStorage(undefined)
    await expect(askDurability()).resolves.toBe('unknown')
    expect(useStorageHealth.getState().asked).toBe(false)
    expect(localStorage.getItem(DURABILITY_ASKED_KEY)).toBeNull()
  })

  it('ne redemande pas ce qui est déjà accordé', async () => {
    const persist = vi.fn(() => Promise.resolve(true))
    withStorage({ persisted: () => Promise.resolve(true), persist })
    await askDurability()
    expect(persist).not.toHaveBeenCalled()
  })

  it('ne lève pas quand `persist()` rejette', async () => {
    withStorage({
      persisted: () => Promise.resolve(false),
      persist: () => Promise.reject(new Error('cassé')),
    })
    await expect(askDurability()).resolves.toBe('unknown')
  })
})

describe('l’état des écritures', () => {
  it('note l’écriture qui aboutit et celle qui rate', () => {
    noteWrite(1000)
    expect(useStorageHealth.getState()).toMatchObject({ lastWriteAt: 1000, lastFailureAt: null })

    noteWriteFailure(2000)
    expect(useStorageHealth.getState()).toMatchObject({ lastWriteAt: 1000, lastFailureAt: 2000 })

    /* Le retour à la normale ne fait pas oublier l'incident : la date de
       l'échec reste, c'est `store.error` qui décide de ce qui s'affiche. */
    noteWrite(3000)
    expect(useStorageHealth.getState()).toMatchObject({ lastWriteAt: 3000, lastFailureAt: 2000 })
  })
})

describe('faut-il signaler la conservation', () => {
  const now = '2026-08-08'

  it('se tait tant que rien n’a été relu', () => {
    expect(shouldWarnDurability({ ...fresh(), durable: false }, true, null, now)).toBe(false)
  })

  it('se tait sur un stockage durable', () => {
    expect(
      shouldWarnDurability({ ...fresh(), probed: true, durable: true }, true, null, now),
    ).toBe(false)
  })

  it('se tait tant qu’il n’y a rien à perdre', () => {
    expect(
      shouldWarnDurability({ ...fresh(), probed: true, durable: false }, false, null, now),
    ).toBe(false)
  })

  it('parle sur un refus comme sur un silence', () => {
    expect(shouldWarnDurability({ ...fresh(), probed: true, durable: false }, true, null, now)).toBe(
      true,
    )
    expect(
      shouldWarnDurability({ ...fresh(), probed: true, durable: 'unknown' }, true, null, now),
    ).toBe(true)
  })

  it('respecte un écart pendant un cycle, puis revient', () => {
    const health = { ...fresh(), probed: true, durable: false as const }
    expect(shouldWarnDurability(health, true, '2026-07-20', now)).toBe(false)
    expect(shouldWarnDurability(health, true, '2026-07-08', now)).toBe(true)
  })

  it('écrit l’écart sur l’appareil', () => {
    dismissDurabilityNotice('2026-08-08')
    expect(readDurabilityDismissed()).toBe('2026-08-08')
    expect(localStorage.getItem(DURABILITY_DISMISSED_KEY)).toBe('2026-08-08')
  })
})

describe('« ce navigateur ne garantit pas »', () => {
  /* L'affirmation demande une réponse, pas une absence de réponse : c'est elle
     qui décide si l'onboarding durcit sa phrase. */
  it('ne s’affirme qu’après un refus explicite', () => {
    expect(isKnownFragile({ ...fresh(), probed: true, durable: false, asked: true })).toBe(true)
    expect(isKnownFragile({ ...fresh(), probed: true, durable: false, asked: false })).toBe(false)
    expect(isKnownFragile({ ...fresh(), probed: true, durable: 'unknown', asked: true })).toBe(false)
    expect(isKnownFragile({ ...fresh(), durable: false, asked: true })).toBe(false)
  })
})
