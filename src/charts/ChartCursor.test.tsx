import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { ChartCursor } from './ChartCursor'

const MOIS = ['janvier', 'février', 'mars', 'avril']

function Harness({ labels = MOIS }: { labels?: string[] }) {
  const [shown, setShown] = useState(1)
  return (
    <div className="relative">
      <ChartCursor labels={labels} shown={shown} onShow={setShown} label="Choisir le mois à lire" />
    </div>
  )
}

const options = (): HTMLElement[] => screen.getAllByRole('option')

describe('ChartCursor', () => {
  it('nomme chaque période', () => {
    render(<Harness />)
    expect(options().map((o) => o.getAttribute('aria-label'))).toEqual(MOIS)
  })

  /* Douze périodes sur deux graphiques feraient vingt-quatre arrêts de
     tabulation sur le seul écran de l'historique — pour une lecture, pas pour
     vingt-quatre gestes. */
  it('n’offre qu’un seul arrêt de tabulation', () => {
    render(<Harness />)
    const tabbable = options().filter((o) => o.tabIndex === 0)
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('déplace la lecture et le focus à la flèche droite', () => {
    render(<Harness />)
    options()[1]?.focus()
    fireEvent.keyDown(options()[1] as HTMLElement, { key: 'ArrowRight' })

    expect(options()[2]).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(options()[2])
  })

  it('va aux extrémités avec Origine et Fin', () => {
    render(<Harness />)
    fireEvent.keyDown(options()[1] as HTMLElement, { key: 'End' })
    expect(options()[MOIS.length - 1]).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(options()[MOIS.length - 1] as HTMLElement, { key: 'Home' })
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
  })

  /* Une année a un début et une fin : le curseur s'y arrête au lieu de
     repartir de l'autre bout, ce qui ferait perdre le compte. */
  it('ne boucle pas aux extrémités', () => {
    render(<Harness />)
    fireEvent.keyDown(options()[1] as HTMLElement, { key: 'Home' })
    fireEvent.keyDown(options()[0] as HTMLElement, { key: 'ArrowLeft' })
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(options()[0] as HTMLElement, { key: 'End' })
    fireEvent.keyDown(options()[MOIS.length - 1] as HTMLElement, { key: 'ArrowRight' })
    expect(options()[MOIS.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  /* Une souris qui promènerait l'anneau de focus à travers la page
     déplacerait le clavier de quelqu'un d'autre sans le dire. */
  it('change la lecture au survol sans voler le focus', () => {
    render(<Harness />)
    const before = document.activeElement
    fireEvent.pointerOver(options()[3] as HTMLElement)

    expect(options()[3]).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(before)
  })

  /* Sans `preventDefault`, une flèche lirait un mois du graphique *et*
     changerait le mois de l'app — `useHotkeys` pose ses raccourcis sur
     `window` et s'efface désormais sur une frappe déjà consommée. */
  it('consomme les flèches, pour que les raccourcis de l’app se taisent', () => {
    const seen: boolean[] = []
    const listen = (event: KeyboardEvent): void => {
      seen.push(event.defaultPrevented)
    }
    window.addEventListener('keydown', listen)
    render(<Harness />)

    fireEvent.keyDown(options()[1] as HTMLElement, { key: 'ArrowRight' })

    expect(seen).toEqual([true])
    window.removeEventListener('keydown', listen)
  })

  it('laisse passer les touches qui ne sont pas les siennes', () => {
    render(<Harness />)
    fireEvent.keyDown(options()[1] as HTMLElement, { key: 'n' })
    expect(options()[1]).toHaveAttribute('aria-selected', 'true')
  })
})
