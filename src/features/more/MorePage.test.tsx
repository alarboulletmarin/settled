import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ABOUT_PATH, MANAGE_ROUTES, MORE_SECTIONS, SETTINGS_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { MorePage } from './MorePage'

function open() {
  return render(
    <MemoryRouter>
      <MorePage />
    </MemoryRouter>,
  )
}

describe('« Plus » — la place qui manquait à quatre écrans', () => {
  /* La raison d'être de l'écran : l'épargne, la répartition et les crédits
     n'avaient aucune adresse dans la navigation, et n'existaient qu'au bout
     d'une tuile du mois qui s'efface quand elle n'a rien à montrer. */
  it('mène à chaque écran que « Gérer » range', () => {
    open()

    for (const route of MANAGE_ROUTES) {
      expect(screen.getByRole('link', { name: new RegExp(route.label) })).toHaveAttribute(
        'href',
        route.path,
      )
    }
  })

  it('mène aux réglages et à « à propos »', () => {
    open()

    expect(
      screen.getByRole('link', { name: new RegExp(fr.nav.settings) }),
    ).toHaveAttribute('href', SETTINGS_PATH)
    expect(screen.getByRole('link', { name: new RegExp(fr.nav.about) })).toHaveAttribute(
      'href',
      ABOUT_PATH,
    )
  })

  /* Sur un écran qui n'est qu'une liste de portes, un libellé seul demande
     d'ouvrir pour savoir si c'était la bonne. */
  it('dit d’une phrase ce qu’il y a derrière chaque porte', () => {
    open()

    expect(screen.getByText(fr.nav.savingsHint)).toBeInTheDocument()
    expect(screen.getByText(fr.nav.splitHint)).toBeInTheDocument()
  })

  it('range dans les mêmes groupes que la colonne latérale', () => {
    open()

    expect(screen.getByText(fr.nav.manage)).toBeInTheDocument()
    /* Le second groupe n'a pas de titre : « Réglages » au-dessus d'une rangée
       « Réglages » n'aurait rien séparé de ce qu'il nomme. */
    expect(MORE_SECTIONS.filter((group) => group.title !== undefined)).toHaveLength(1)
  })
})
