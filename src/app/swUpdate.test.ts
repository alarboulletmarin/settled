import { afterEach, describe, expect, it, vi } from 'vitest'
import { UPDATE_CHECK_INTERVAL_MS, watchForegroundUpdates } from './swUpdate'

/** jsdom ne pilote pas la visibilité : on la pose nous-mêmes. */
function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

/** Horloge injectée : le seuil se franchit sans attendre une minute. */
function clock(start = 0) {
  let time = start
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms
    },
  }
}

afterEach(() => {
  setVisibility('visible')
})

describe('vérification au retour au premier plan', () => {
  it('interroge le service worker quand l’app redevient visible', () => {
    const update = vi.fn(() => Promise.resolve())
    const time = clock()
    const stop = watchForegroundUpdates(() => ({ update }), time.now)

    setVisibility('hidden')
    time.advance(UPDATE_CHECK_INTERVAL_MS)
    setVisibility('visible')

    expect(update).toHaveBeenCalledTimes(1)
    stop()
  })

  it('ne fait rien quand l’app passe en arrière-plan', () => {
    const update = vi.fn(() => Promise.resolve())
    const time = clock()
    const stop = watchForegroundUpdates(() => ({ update }), time.now)

    time.advance(UPDATE_CHECK_INTERVAL_MS)
    setVisibility('hidden')

    expect(update).not.toHaveBeenCalled()
    stop()
  })

  it('ne redemande pas au réseau deux fois dans la même minute', () => {
    const update = vi.fn(() => Promise.resolve())
    const time = clock()
    const stop = watchForegroundUpdates(() => ({ update }), time.now)

    // Le chargement vient d'avoir lieu : ce premier retour ne compte pas.
    setVisibility('visible')
    expect(update).not.toHaveBeenCalled()

    time.advance(UPDATE_CHECK_INTERVAL_MS)
    setVisibility('visible')
    time.advance(UPDATE_CHECK_INTERVAL_MS - 1)
    setVisibility('visible')

    expect(update).toHaveBeenCalledTimes(1)
    stop()
  })

  it('tient si la registration n’est pas encore arrivée', () => {
    const time = clock()
    const stop = watchForegroundUpdates(() => null, time.now)

    time.advance(UPDATE_CHECK_INTERVAL_MS)
    expect(() => {
      setVisibility('visible')
    }).not.toThrow()
    stop()
  })

  it('avale un échec réseau sans rejet non capturé', async () => {
    const update = vi.fn(() => Promise.reject(new Error('hors ligne')))
    const time = clock()
    const stop = watchForegroundUpdates(() => ({ update }), time.now)

    time.advance(UPDATE_CHECK_INTERVAL_MS)
    setVisibility('visible')
    await Promise.resolve()

    expect(update).toHaveBeenCalledTimes(1)
    stop()
  })

  it('se tait une fois désabonné', () => {
    const update = vi.fn(() => Promise.resolve())
    const time = clock()
    const stop = watchForegroundUpdates(() => ({ update }), time.now)

    stop()
    time.advance(UPDATE_CHECK_INTERVAL_MS)
    setVisibility('visible')

    expect(update).not.toHaveBeenCalled()
  })
})
