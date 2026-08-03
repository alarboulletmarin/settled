import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useLeaveGuard } from './useLeaveGuard'

const DRAFT = { label: 'Loyer', amountText: '850,00', shared: undefined as boolean | undefined }

describe('useLeaveGuard', () => {
  it('laisse partir sans un mot tant que rien n’a bougé', () => {
    const leave = vi.fn()
    const { result } = renderHook(() => useLeaveGuard(DRAFT, leave))

    act(() => {
      result.current.request()
    })

    /* Ouvrir un formulaire, le regarder et repartir est un geste courant : le
       ponctuer d'une question apprendrait à cliquer sans lire. */
    expect(leave).toHaveBeenCalledOnce()
    expect(result.current.dialog.open).toBe(false)
  })

  it('demande avant de jeter une saisie modifiée', () => {
    const leave = vi.fn()
    const { result, rerender } = renderHook(({ draft }) => useLeaveGuard(draft, leave), {
      initialProps: { draft: DRAFT },
    })

    rerender({ draft: { ...DRAFT, amountText: '900,00' } })
    act(() => {
      result.current.request()
    })

    expect(leave).not.toHaveBeenCalled()
    expect(result.current.dialog.open).toBe(true)
  })

  it('reste sur le formulaire quand on renonce à partir', () => {
    const leave = vi.fn()
    const { result, rerender } = renderHook(({ draft }) => useLeaveGuard(draft, leave), {
      initialProps: { draft: DRAFT },
    })

    rerender({ draft: { ...DRAFT, label: 'Loyer et charges' } })
    act(() => {
      result.current.request()
    })
    act(() => {
      result.current.dialog.onCancel()
    })

    expect(leave).not.toHaveBeenCalled()
    expect(result.current.dialog.open).toBe(false)
  })

  it('part pour de bon quand on abandonne', () => {
    const leave = vi.fn()
    const { result, rerender } = renderHook(({ draft }) => useLeaveGuard(draft, leave), {
      initialProps: { draft: DRAFT },
    })

    rerender({ draft: { ...DRAFT, label: 'Loyer et charges' } })
    act(() => {
      result.current.request()
    })
    act(() => {
      result.current.dialog.onConfirm()
    })

    expect(leave).toHaveBeenCalledOnce()
  })

  /* Corriger un montant puis le retaper à l'identique ne modifie rien : c'est
     ce que la ligne valait à l'ouverture qui fait référence, pas le fait
     d'avoir touché au clavier. */
  it('ne retient pas un aller-retour qui revient au point de départ', () => {
    const leave = vi.fn()
    const { result, rerender } = renderHook(({ draft }) => useLeaveGuard(draft, leave), {
      initialProps: { draft: DRAFT },
    })

    rerender({ draft: { ...DRAFT, amountText: '9' } })
    expect(result.current.dirty).toBe(true)
    rerender({ draft: { ...DRAFT, amountText: '850,00' } })

    expect(result.current.dirty).toBe(false)
  })

  /* Une case laissée à `undefined` — la règle de partage tranche — n'est pas la
     même chose qu'une case décochée : la comparaison parcourt l'union des clés
     des deux brouillons, sans quoi une clé apparue en cours de saisie
     passerait inaperçue. */
  it('voit une clé qui n’existait pas à l’ouverture', () => {
    const leave = vi.fn()
    const initialProps: { draft: Record<string, unknown> } = { draft: { label: 'Loyer' } }
    const { result, rerender } = renderHook(
      ({ draft }: { draft: Record<string, unknown> }) => useLeaveGuard(draft, leave),
      { initialProps },
    )

    rerender({ draft: { label: 'Loyer', shared: false } })

    expect(result.current.dirty).toBe(true)
  })
})
