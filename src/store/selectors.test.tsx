import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { makeData } from '@/domain/fixtures'
import { useMonthScope, useMonthTotals, useTrailingMonths } from './selectors'
import { useStore } from './store'

const initial = useStore.getState().data

describe('la portée du mois, mutualisée', () => {
  afterEach(() => {
    useStore.setState({ data: initial })
  })

  /* Une dizaine de hooks lisent cette portée, et le tableau de bord les appelle
     presque tous : chacun refaisait le balayage complet du document pour son
     compte. Le cache se voit à la référence — deux lectures d'une même passe
     rendent le même objet, ce que deux `useMemo` séparés ne feraient jamais. */
  it('rend le même objet à deux lectures de la même passe', () => {
    useStore.setState({ data: makeData() })

    const { result } = renderHook(() => [useMonthScope(), useMonthScope()] as const)
    const [first, second] = result.current

    expect(second).toBe(first)
    expect(second.entries).toBe(first.entries)
  })

  it('sert aussi les hooks qui la lisent sans la nommer', () => {
    useStore.setState({ data: makeData() })

    const { result } = renderHook(
      () => [useMonthScope(), useMonthTotals(), useTrailingMonths()] as const,
    )

    // Les deux dérivés ont bien été calculés sur quelque chose : ce qu'on
    // vérifie ici est qu'ils ne cassent pas en passant par le cache.
    expect(result.current[1]).toBeDefined()
    expect(result.current[2].length).toBeGreaterThan(0)
  })

  it('recalcule dès que le document change', () => {
    useStore.setState({ data: makeData() })
    const { result, rerender } = renderHook(() => useMonthScope())
    const before = result.current

    useStore.setState({ data: { ...makeData(), entries: [] } })
    rerender()

    expect(result.current).not.toBe(before)
    expect(result.current.entries).toEqual([])
  })

  it('recalcule dès que le filtre change', () => {
    useStore.setState({ data: makeData() })
    useStore.getState().setFilter({ kind: 'all' })
    const { result, rerender } = renderHook(() => useMonthScope())
    const before = result.current

    useStore.getState().setFilter({ kind: 'common' })
    rerender()

    expect(result.current).not.toBe(before)
  })
})
