import { afterEach, describe, expect, it, vi } from 'vitest'
import { isOffline, subscribeOnline } from './online'

/* `navigator.onLine` est en lecture seule : jsdom le laisse redéfinir, ce qui
   est le seul moyen d'exercer les deux états. */
function setOnLine(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

describe('online — l’état du réseau', () => {
  afterEach(() => {
    setOnLine(true)
  })

  it('ne se dit hors ligne que sur un « non » franc du navigateur', () => {
    setOnLine(true)
    expect(isOffline()).toBe(false)

    setOnLine(false)
    expect(isOffline()).toBe(true)
  })

  it('prévient sur les deux bascules, et se tait une fois désabonné', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeOnline(listener)

    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    window.dispatchEvent(new Event('offline'))
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
