import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Tile } from './Tile'

function show(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>)
}

describe('Tile', () => {
  it('rend une section, et non un bouton, quand le geste est au coin', () => {
    show(
      <Tile label="Répartition" link={{ to: '/repartition', label: 'Voir le détail' }}>
        <ul>
          <li>Camille 60 %</li>
          <li>Dominique 40 %</li>
        </ul>
      </Tile>,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Répartition' })).toBeInTheDocument()
  })

  /* Ce que le bouton coûtait : son nom accessible remplace tout ce qu'il
     contient, et la liste disparaissait derrière « Répartition ». */
  it('laisse la liste se lire ligne à ligne', () => {
    show(
      <Tile label="Répartition" link={{ to: '/repartition', label: 'Voir le détail' }}>
        <ul>
          <li>Camille 60 %</li>
          <li>Dominique 40 %</li>
        </ul>
      </Tile>,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('nomme le lien du coin, qui se lit hors de la tuile', () => {
    show(
      <Tile label="Répartition" link={{ to: '/repartition', label: 'Voir le détail' }}>
        <p>Rien à cliquer ici</p>
      </Tile>,
    )

    expect(screen.getByRole('link', { name: 'Voir le détail' })).toHaveAttribute(
      'href',
      '/repartition',
    )
  })

  it('reste un bouton quand toute la tuile est la cible', () => {
    show(
      <Tile
        label="Crédits"
        onClick={() => {
          /* rien */
        }}
        affordance={{ kind: 'navigate' }}
      >
        <span>1 200 €</span>
      </Tile>,
    )

    expect(screen.getByRole('button', { name: 'Crédits' })).toBeInTheDocument()
  })

  /* Le repère d'une tuile cliquable reste un ornement : le nom du bouton dit
     déjà où l'on va, et l'annoncer deux fois ne l'apprendrait pas mieux. */
  it('ne double pas le nom du bouton par un second lien', () => {
    show(
      <Tile
        label="Crédits"
        onClick={() => {
          /* rien */
        }}
        affordance={{ kind: 'navigate', destination: 'Crédits' }}
      >
        <span>1 200 €</span>
      </Tile>,
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
