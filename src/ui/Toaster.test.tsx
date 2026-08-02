import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Toaster } from './Toaster'
import { useToasts } from './toast'

describe('Toaster', () => {
  beforeEach(() => {
    useToasts.setState({ toasts: [] })
  })

  afterEach(() => {
    useToasts.setState({ toasts: [] })
  })

  it('annonce poliment une confirmation', () => {
    render(<Toaster />)
    act(() => {
      useToasts.getState().push('Mois confirmé')
    })

    expect(screen.getByRole('status')).toHaveTextContent('Mois confirmé')
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('annonce une erreur en interrompant, pas poliment', () => {
    render(<Toaster />)
    act(() => {
      useToasts.getState().push('L’enregistrement a échoué', 'danger')
    })

    // Poliment annoncé, un échec attend qu'un lecteur d'écran ait fini de lire
    // autre chose — et peut n'être jamais lu.
    expect(screen.getByRole('alert')).toHaveTextContent('L’enregistrement a échoué')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('pose les deux régions dès le premier rendu, avant tout message', () => {
    render(<Toaster />)
    // Une région créée en même temps que son contenu n'est pas annoncée.
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
