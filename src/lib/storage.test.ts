import { afterEach, describe, expect, it, vi } from 'vitest'
import { estimateStorage, persistedState, requestPersistence } from './storage'

/** jsdom n'expose pas `navigator.storage` : on le pose et on le retire. */
function withStorage(value: Partial<StorageManager> | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(navigator, 'storage')
    return
  }
  Object.defineProperty(navigator, 'storage', { value, configurable: true })
}

describe('place sur l’appareil', () => {
  afterEach(() => {
    withStorage(undefined)
    vi.restoreAllMocks()
  })

  /* « Rien » et « non » ne se disent pas pareil, et c'est tout l'objet des trois
     premiers cas : une API absente ou qui lève n'a pas refusé, elle n'a pas
     répondu. Le confondre avec un refus laissait affirmer que ce navigateur ne
     s'engage pas — une affirmation sur la foi d'un silence. */
  it('ne lève rien là où l’API n’existe pas, et ne conclut rien', async () => {
    // Safari en navigation privée, et tout navigateur assez ancien. La création
    // d'un foyer n'a pas à tomber pour ça.
    withStorage(undefined)
    await expect(persistedState()).resolves.toBe('unknown')
    await expect(requestPersistence()).resolves.toBe('unknown')
    await expect(estimateStorage()).resolves.toBeNull()
  })

  it('ne lève rien non plus quand l’API rejette', async () => {
    withStorage({
      persisted: () => Promise.reject(new Error('refusé')),
      persist: () => Promise.reject(new Error('refusé')),
      estimate: () => Promise.reject(new Error('refusé')),
    })
    await expect(persistedState()).resolves.toBe('unknown')
    await expect(requestPersistence()).resolves.toBe('unknown')
    await expect(estimateStorage()).resolves.toBeNull()
  })

  it('rapporte un refus comme un refus', async () => {
    withStorage({ persisted: () => Promise.resolve(false), persist: () => Promise.resolve(false) })
    await expect(persistedState()).resolves.toBe(false)
    await expect(requestPersistence()).resolves.toBe(false)
  })

  it('rapporte ce que le navigateur répond', async () => {
    withStorage({
      persisted: () => Promise.resolve(true),
      persist: () => Promise.resolve(true),
      estimate: () => Promise.resolve({ usage: 1_500_000, quota: 50_000_000 }),
    })
    await expect(persistedState()).resolves.toBe(true)
    await expect(requestPersistence()).resolves.toBe(true)
    await expect(estimateStorage()).resolves.toStrictEqual({ usage: 1_500_000, quota: 50_000_000 })
  })

  it('se tait plutôt que d’inventer un chiffre incomplet', async () => {
    withStorage({ estimate: () => Promise.resolve({ usage: 1000 }) })
    await expect(estimateStorage()).resolves.toBeNull()
  })
})
