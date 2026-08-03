import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHotkeys } from './useHotkeys'

function press(key: string, options: { from?: Element; modifier?: 'ctrlKey' | 'metaKey' } = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...(options.modifier === undefined ? {} : { [options.modifier]: true }),
  })
  ;(options.from ?? window).dispatchEvent(event)
  return event
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useHotkeys', () => {
  it('déclenche le geste de la touche liée, et lui seul', () => {
    const next = vi.fn()
    renderHook(() => {
      useHotkeys({ ArrowRight: next })
    })

    press('ArrowRight')
    press('ArrowLeft')

    expect(next).toHaveBeenCalledOnce()
  })

  it('empêche le comportement par défaut de la touche qu’il prend', () => {
    renderHook(() => {
      useHotkeys({ n: () => undefined })
    })

    expect(press('n').defaultPrevented).toBe(true)
    expect(press('z').defaultPrevented).toBe(false)
  })

  it('se tait pendant qu’on tape', () => {
    const create = vi.fn()
    const input = document.createElement('input')
    document.body.append(input)
    renderHook(() => {
      useHotkeys({ n: create })
    })

    // Sans ce garde, taper « nouveau » dans un libellé partirait créer une
    // dépense à la première lettre.
    press('n', { from: input })

    expect(create).not.toHaveBeenCalled()
  })

  it('se tait quand un modificateur est enfoncé', () => {
    const create = vi.fn()
    renderHook(() => {
      useHotkeys({ n: create })
    })

    // `Ctrl+N` ouvre une fenêtre, `⌘←` remonte dans l'historique : ces gestes
    // ne nous appartiennent pas.
    press('n', { modifier: 'ctrlKey' })
    press('n', { modifier: 'metaKey' })

    expect(create).not.toHaveBeenCalled()
  })

  it('se tait quand une feuille est ouverte', () => {
    const create = vi.fn()
    const dialog = document.createElement('dialog')
    dialog.setAttribute('open', '')
    document.body.append(dialog)
    renderHook(() => {
      useHotkeys({ n: create })
    })

    /* Un `<dialog>` modal capte le focus mais pas les écouteurs de `window` :
       sans ce garde, « n » posé pendant une question de confirmation partirait
       créer une dépense derrière la boîte, restée ouverte sur un autre écran. */
    press('n')

    expect(create).not.toHaveBeenCalled()
  })

  it('appelle le geste du dernier rendu, pas celui du premier', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(
      ({ run }: { run: () => void }) => {
        useHotkeys({ n: run })
      },
      { initialProps: { run: first } },
    )

    rerender({ run: second })
    press('n')

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })

  it('ne laisse pas son écouteur derrière lui', () => {
    const create = vi.fn()
    const { unmount } = renderHook(() => {
      useHotkeys({ n: create })
    })

    unmount()
    press('n')

    expect(create).not.toHaveBeenCalled()
  })
})
