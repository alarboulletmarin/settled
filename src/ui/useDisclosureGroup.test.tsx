import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDisclosureGroup } from './useDisclosureGroup'

const KEYS = ['a', 'b', 'c']

describe('useDisclosureGroup', () => {
  it('part du défaut tant que personne n’a rien touché', () => {
    const { result } = renderHook(() => useDisclosureGroup(KEYS, true))
    expect(KEYS.every((key) => result.current.isOpen(key))).toBe(true)
    expect(result.current.anyOpen).toBe(true)
  })

  it('garde les deux ouvertures émises dans le même tour', () => {
    const { result } = renderHook(() => useDisclosureGroup(KEYS, false))

    /* Deux `<details>` qui émettent `toggle` dans le même tick : partis du même
       Set capturé au rendu, le second recouvrait le premier et une section sur
       deux restait fermée sans qu'aucun clic ne l'explique. */
    act(() => {
      result.current.setOpen('a', true)
      result.current.setOpen('b', true)
    })

    expect(result.current.isOpen('a')).toBe(true)
    expect(result.current.isOpen('b')).toBe(true)
    expect(result.current.isOpen('c')).toBe(false)
  })

  it('garde les fermetures émises dans le même tour', () => {
    const { result } = renderHook(() => useDisclosureGroup(KEYS, true))

    act(() => {
      result.current.setOpen('a', false)
      result.current.setOpen('b', false)
    })

    expect(result.current.isOpen('a')).toBe(false)
    expect(result.current.isOpen('b')).toBe(false)
    expect(result.current.isOpen('c')).toBe(true)
  })

  it('revient au défaut sans mémoire de ce qui a été ouvert', () => {
    const { result } = renderHook(() => useDisclosureGroup(KEYS, false))

    act(() => {
      result.current.setOpen('a', true)
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.anyOpen).toBe(false)
  })

  /* Le défaut de la liste du mois : ni tout, ni rien — le jour qu'on vient
     lire, et lui seul. */
  it('accepte la liste de ce qui s’ouvre', () => {
    const { result } = renderHook(() => useDisclosureGroup(KEYS, ['b']))

    expect(result.current.isOpen('a')).toBe(false)
    expect(result.current.isOpen('b')).toBe(true)
    expect(result.current.anyOpen).toBe(true)
  })

  it('y revient après un « tout replier » puis un reset', () => {
    const open = ['b']
    const { result } = renderHook(() => useDisclosureGroup(KEYS, open))

    act(() => {
      result.current.toggleAll()
    })
    expect(result.current.anyOpen).toBe(false)

    act(() => {
      result.current.reset()
    })
    expect(result.current.isOpen('b')).toBe(true)
  })
})
