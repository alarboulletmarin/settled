import { afterEach, describe, expect, it, vi } from 'vitest'
import { onPageHidden } from './lifecycle'

/** jsdom ne pilote pas la visibilité : on la pose à la main. */
function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

describe('flush à la sortie de page', () => {
  afterEach(() => {
    setVisibility('visible')
  })

  it('part sur pagehide', () => {
    const hide = vi.fn()
    const stop = onPageHidden(hide)
    window.dispatchEvent(new Event('pagehide'))
    expect(hide).toHaveBeenCalledTimes(1)
    stop()
  })

  it('part quand la page passe en arrière-plan', () => {
    const hide = vi.fn()
    const stop = onPageHidden(hide)
    setVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(hide).toHaveBeenCalledTimes(1)
    stop()
  })

  it('ne part pas quand la page revient au premier plan', () => {
    const hide = vi.fn()
    const stop = onPageHidden(hide)
    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(hide).not.toHaveBeenCalled()
    stop()
  })

  it('décroche les deux écouteurs', () => {
    const hide = vi.fn()
    onPageHidden(hide)()
    window.dispatchEvent(new Event('pagehide'))
    setVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(hide).not.toHaveBeenCalled()
  })
})
