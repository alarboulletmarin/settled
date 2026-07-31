import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { money } from '@/domain/money'
import { Amount } from './Amount'

describe('Amount', () => {
  it('pose tabular-nums sur tout montant, sans exception', () => {
    const { container } = render(<Amount value={money(1234)} />)
    expect(container.firstElementChild).toHaveClass('tnum')
  })

  it('affiche le signe + sur une entrée', () => {
    render(<Amount value={money(320000)} direction="in" />)
    expect(screen.getByLabelText('+3 200,00 €')).toBeInTheDocument()
  })

  it("n'affiche aucun signe sur une sortie : elle se lit à son contexte", () => {
    const { container } = render(<Amount value={money(191550)} direction="out" />)
    expect(container.textContent).not.toContain('+')
    expect(container.textContent).not.toContain('−')
  })

  it('affiche la valeur absolue quand un sens est donné', () => {
    const { container } = render(<Amount value={money(-4290)} direction="out" />)
    expect(container.textContent).toContain('42')
    expect(container.textContent).not.toContain('−')
  })

  it('affiche le − sur un solde négatif, faute de sens explicite', () => {
    const { container } = render(<Amount value={money(-4290)} />)
    expect(container.textContent).toContain('−')
  })

  it('sépare les centimes pour pouvoir les réduire sur un chiffre héros', () => {
    const { container } = render(<Amount value={money(128450)} size="hero" />)
    const cents = container.querySelector('span[style*="0.5em"]')
    expect(cents?.textContent).toBe(',50')
  })

  it('masque les centimes quand on ne les demande pas', () => {
    const { container } = render(<Amount value={money(128450)} withCents={false} />)
    expect(container.textContent).not.toContain(',50')
  })

  it('arrondit l’unité sans centimes, au lieu de la tronquer', () => {
    const { container } = render(<Amount value={money(5669)} withCents={false} />)
    expect(container.textContent).toContain('57')
    expect(screen.getByLabelText('57 €')).toBeInTheDocument()
  })

  it('arrondit vers le bas ce qui doit l’être', () => {
    const { container } = render(<Amount value={money(5620)} withCents={false} />)
    expect(container.textContent).toContain('56')
  })

  it('rend le montant lisible par un lecteur d’écran', () => {
    render(<Amount value={money(-4290)} />)
    expect(screen.getByLabelText('−42,90 €')).toBeInTheDocument()
  })
})
