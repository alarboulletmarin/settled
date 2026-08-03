import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDraftField } from './useDraftField'

/** Un `ChangeEvent` réduit à ce que le hook en lit. */
const typing = (value: string) =>
  ({ target: { value } }) as Parameters<ReturnType<typeof useDraftField>['onChange']>[0]

describe('useDraftField', () => {
  it('n’enregistre rien pendant la frappe', () => {
    const commit = vi.fn()
    const { result } = renderHook(() => useDraftField('Loyer', commit))

    act(() => {
      result.current.onChange(typing('Loye'))
    })
    act(() => {
      result.current.onChange(typing('Loyer et charges'))
    })

    expect(commit).not.toHaveBeenCalled()
    expect(result.current.value).toBe('Loyer et charges')
  })

  it('enregistre une fois à la sortie du champ', () => {
    const commit = vi.fn()
    const { result } = renderHook(() => useDraftField('Loyer', commit))

    act(() => {
      result.current.onChange(typing('Loyer et charges'))
    })
    act(() => {
      result.current.onBlur()
    })

    expect(commit).toHaveBeenCalledExactlyOnceWith('Loyer et charges')
  })

  it('n’enregistre pas un texte inchangé', () => {
    const commit = vi.fn()
    const { result } = renderHook(() => useDraftField('Loyer', commit))

    act(() => {
      result.current.onBlur()
    })

    expect(commit).not.toHaveBeenCalled()
  })

  /* Rognés à la frappe, l'espace de « Jean Paul » ne pourrait jamais être tapé.
     Ils le sont donc à la sortie, et le champ montre ce qui a été enregistré. */
  it('rogne les espaces à la sortie, jamais à la frappe', () => {
    const commit = vi.fn()
    const { result } = renderHook(() => useDraftField('Alix', commit))

    act(() => {
      result.current.onChange(typing('Jean Paul '))
    })
    expect(result.current.value).toBe('Jean Paul ')

    act(() => {
      result.current.onBlur()
    })
    expect(commit).toHaveBeenCalledExactlyOnceWith('Jean Paul')
    expect(result.current.value).toBe('Jean Paul')
  })

  it('laisse vider pour retaper, mais n’enregistre jamais le vide quand il est refusé', () => {
    const commit = vi.fn()
    const { result } = renderHook(() => useDraftField('Alix', commit, { allowEmpty: false }))

    act(() => {
      result.current.onChange(typing(''))
    })
    expect(result.current.value).toBe('')

    act(() => {
      result.current.onBlur()
    })

    expect(commit).not.toHaveBeenCalled()
    // Le champ remet à l'écran le dernier nom valide : une ligne blanche ne
    // dirait plus de qui elle parle.
    expect(result.current.value).toBe('Alix')
  })

  it('reprend un texte changé ailleurs — un import, un onglet voisin', () => {
    const commit = vi.fn()
    const { result, rerender } = renderHook(({ value }) => useDraftField(value, commit), {
      initialProps: { value: 'Loyer' },
    })

    act(() => {
      result.current.onChange(typing('Loye'))
    })
    rerender({ value: 'Loyer et charges' })

    expect(result.current.value).toBe('Loyer et charges')
  })

  it('sort du champ sur Entrée, pour qui ne quitte pas le clavier', () => {
    const commit = vi.fn()
    const { result } = renderHook(() => useDraftField('Loyer', commit))
    const blur = vi.fn()
    const preventDefault = vi.fn()

    act(() => {
      result.current.onKeyDown({
        key: 'Enter',
        preventDefault,
        currentTarget: { blur },
      } as unknown as Parameters<ReturnType<typeof useDraftField>['onKeyDown']>[0])
    })

    expect(preventDefault).toHaveBeenCalled()
    expect(blur).toHaveBeenCalled()
  })
})
