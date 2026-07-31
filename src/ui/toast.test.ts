import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast, useToasts } from './toast'

const messages = (): string[] => useToasts.getState().toasts.map((t) => t.message)
const counts = (): number[] => useToasts.getState().toasts.map((t) => t.count)

beforeEach(() => {
  vi.useFakeTimers()
  useToasts.setState({ toasts: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('pile de messages', () => {
  it('compte un message répété au lieu de l’empiler', () => {
    toast('Échéance confirmée')
    toast('Échéance confirmée')
    toast('Échéance confirmée')
    expect(messages()).toEqual(['Échéance confirmée'])
    expect(counts()).toEqual([3])
  })

  it('repart du délai complet à chaque répétition', () => {
    toast('Échéance confirmée')
    vi.advanceTimersByTime(3000)
    toast('Échéance confirmée')
    vi.advanceTimersByTime(3000)
    // Sans la remise à zéro, le premier compte à rebours aurait déjà fini.
    expect(messages()).toHaveLength(1)
    vi.advanceTimersByTime(1500)
    expect(messages()).toEqual([])
  })

  it('ne fond pas deux messages différents', () => {
    toast('Échéance confirmée')
    toast('Mois confirmé')
    expect(messages()).toEqual(['Échéance confirmée', 'Mois confirmé'])
  })

  it('ne fond pas deux tons différents', () => {
    toast('Rien à faire')
    toast('Rien à faire', 'danger')
    expect(messages()).toHaveLength(2)
  })

  it('n’en garde jamais plus de trois à l’écran', () => {
    for (const m of ['un', 'deux', 'trois', 'quatre', 'cinq']) toast(m)
    expect(messages()).toEqual(['trois', 'quatre', 'cinq'])
  })

  it('s’efface tout seul au bout du délai', () => {
    toast('Échéance confirmée')
    vi.advanceTimersByTime(4001)
    expect(messages()).toEqual([])
  })

  it('se ferme à la main sans laisser son minuteur derrière', () => {
    toast('Échéance confirmée')
    const id = useToasts.getState().toasts[0]?.id ?? 0
    useToasts.getState().dismiss(id)
    expect(messages()).toEqual([])

    // Le même message revient : il ne doit pas être effacé par l'ancien minuteur.
    toast('Échéance confirmée')
    vi.advanceTimersByTime(3000)
    expect(messages()).toHaveLength(1)
  })
})
