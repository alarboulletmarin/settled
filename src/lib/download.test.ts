import { afterEach, describe, expect, it, vi } from 'vitest'
import { download } from './download'

describe('download', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('pose l’ancre dans le document avant de cliquer, et la retire ensuite', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    let attachedAtClick = false
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function clickSpy(this: HTMLAnchorElement) {
        attachedAtClick = this.isConnected
      })

    download(new Blob(['{}']), 'export.json')

    expect(create).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    // Un `click()` sur une ancre détachée ne fait rien hors Chrome.
    expect(attachedAtClick).toBe(true)
    expect(document.querySelector('a[download]')).toBeNull()
  })

  it('ne révoque l’URL qu’après le tour de boucle, pour laisser prendre le contenu', () => {
    vi.useFakeTimers()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    download(new Blob(['{}']), 'export.json')
    // Révoquée dans la foulée, Safari rendait un fichier vide.
    expect(revoke).not.toHaveBeenCalled()

    vi.runAllTimers()
    expect(revoke).toHaveBeenCalledWith('blob:test')
  })
})
