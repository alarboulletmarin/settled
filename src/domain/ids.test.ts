import { afterEach, describe, expect, it, vi } from 'vitest'

/** Une session neuve du module, en contexte non sécurisé — sans `randomUUID`. */
async function idsWithoutCrypto(): Promise<() => string> {
  vi.resetModules()
  vi.stubGlobal('crypto', {})
  const module = await import('./ids')
  return module.makeId
}

describe('makeId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('ne se répète pas dans une même session', async () => {
    const makeId = await idsWithoutCrypto()
    const ids = new Set([makeId(), makeId(), makeId()])
    expect(ids.size).toBe(3)
  })

  it('ne redistribue pas les mêmes identifiants au rechargement suivant', async () => {
    const first = await idsWithoutCrypto()
    const before = [first(), first(), first()]

    /* Le compteur seul repartait de 1 : deux sessions sur le même appareil —
       le cas réel est un téléphone qui ouvre l'app en `http://192.168.x.x` —
       redistribuaient `id-1`, `id-2`, `id-3`. */
    const second = await idsWithoutCrypto()
    const after = [second(), second(), second()]

    expect(after).not.toEqual(before)
  })

  it('préfère `randomUUID` quand le contexte est sécurisé', async () => {
    vi.resetModules()
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-fixe' })
    const { makeId } = await import('./ids')
    expect(makeId()).toBe('uuid-fixe')
  })
})
