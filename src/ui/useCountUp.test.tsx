import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountUp } from './useCountUp'

/* `src/test/setup.ts` déclare `prefers-reduced-motion: reduce` pour toute la
   suite — c'est ce qui laisse les autres tests lire une valeur d'arrivée. Ici
   on veut justement la branche animée, donc on rend la préférence à faux le
   temps de ce fichier. */
function setReducedMotion(reduce: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') && reduce,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

/* jsdom pose `requestAnimationFrame` sur une vraie horloge de 16ms : on le
   remplace par une file qu'on vide à la main, pour que « une image plus tard »
   soit une instruction et non une attente. */
let frames: FrameRequestCallback[] = []
let clock = 0

function paint(elapsed: number): void {
  clock += elapsed
  const due = frames
  frames = []
  act(() => {
    for (const frame of due) frame(clock)
  })
}

beforeEach(() => {
  frames = []
  clock = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  setReducedMotion(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
  setReducedMotion(true)
})

describe('useCountUp', () => {
  it('part de zéro et arrive à la valeur', () => {
    const { result } = renderHook(() => useCountUp(120_000))
    expect(result.current).toBe(0)

    // La première image ne fait qu'ancrer l'horloge : rien n'a encore couru.
    paint(0)
    expect(result.current).toBe(0)

    paint(300)
    expect(result.current).toBeGreaterThan(0)
    expect(result.current).toBeLessThan(120_000)

    paint(300)
    expect(result.current).toBe(120_000)
  })

  /* Ce que le DS §4 interdit : « jamais sur mise à jour ». Le tableau de bord
     ne démonte pas ses tuiles quand on change de mois, il change leurs valeurs
     — un compteur qui repartirait de zéro à chaque échéance confirmée rendrait
     l'écran illisible pendant qu'on saisit. */
  it('ne recompte pas quand la valeur change en place', () => {
    const { result, rerender } = renderHook(({ value }) => useCountUp(value), {
      initialProps: { value: 120_000 },
    })
    paint(0)
    paint(600)
    expect(result.current).toBe(120_000)

    rerender({ value: 90_000 })
    expect(result.current).toBe(90_000)
  })

  it('rend la valeur d’emblée quand le comptage est refusé', () => {
    const { result } = renderHook(() => useCountUp(120_000, false))
    expect(result.current).toBe(120_000)
    expect(frames).toHaveLength(0)
  })

  /* DS §4 : « tout est neutralisé sous prefers-reduced-motion ». Le blanket
     CSS ne couvre pas un compteur piloté en JS, c'est donc au hook de le lire. */
  it('ne compte pas sous « réduire les animations »', () => {
    setReducedMotion(true)
    const { result } = renderHook(() => useCountUp(120_000))
    expect(result.current).toBe(120_000)
    expect(frames).toHaveLength(0)
  })

  /* Un solde négatif compte vers le bas, et n'est jamais rendu positif en
     chemin : le signe se lit tout au long. */
  it('compte aussi un solde négatif', () => {
    const { result } = renderHook(() => useCountUp(-50_000))
    paint(0)
    paint(200)
    expect(result.current).toBeLessThanOrEqual(0)
    expect(result.current).toBeGreaterThan(-50_000)
    paint(400)
    expect(result.current).toBe(-50_000)
  })

  /* L'arrivée est la cible elle-même, pas le dernier arrondi du calcul : un
     centime perdu en fin de course resterait affiché pour toujours. */
  it('arrive au centime exact', () => {
    const { result } = renderHook(() => useCountUp(123_457))
    paint(0)
    paint(600)
    expect(result.current).toBe(123_457)
  })
})
