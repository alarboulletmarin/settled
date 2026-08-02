import { afterEach, describe, expect, it, vi } from 'vitest'
import { estimateStorage, isPersisted, requestPersistence } from './storage'

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

  it('ne lève rien là où l’API n’existe pas', async () => {
    // Safari en navigation privée, et tout navigateur assez ancien. La création
    // d'un foyer n'a pas à tomber pour ça.
    withStorage(undefined)
    await expect(isPersisted()).resolves.toBe(false)
    await expect(requestPersistence()).resolves.toBe(false)
    await expect(estimateStorage()).resolves.toBeNull()
  })

  it('ne lève rien non plus quand l’API refuse', async () => {
    withStorage({
      persisted: () => Promise.reject(new Error('refusé')),
      persist: () => Promise.reject(new Error('refusé')),
      estimate: () => Promise.reject(new Error('refusé')),
    })
    await expect(isPersisted()).resolves.toBe(false)
    await expect(requestPersistence()).resolves.toBe(false)
    await expect(estimateStorage()).resolves.toBeNull()
  })

  it('rapporte ce que le navigateur répond', async () => {
    withStorage({
      persisted: () => Promise.resolve(true),
      persist: () => Promise.resolve(true),
      estimate: () => Promise.resolve({ usage: 1_500_000, quota: 50_000_000 }),
    })
    await expect(isPersisted()).resolves.toBe(true)
    await expect(requestPersistence()).resolves.toBe(true)
    await expect(estimateStorage()).resolves.toStrictEqual({ usage: 1_500_000, quota: 50_000_000 })
  })

  it('se tait plutôt que d’inventer un chiffre incomplet', async () => {
    withStorage({ estimate: () => Promise.resolve({ usage: 1000 }) })
    await expect(estimateStorage()).resolves.toBeNull()
  })
})
