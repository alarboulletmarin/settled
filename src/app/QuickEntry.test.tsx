import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { fr } from '@/i18n/fr'
import { ENTRY_NEW_PATH, entryNewPath } from './routes'
import { QuickEntry } from './QuickEntry'

/* Le composant navigue : sans témoin, on ne saurait pas où. Celui-ci rend
   l'URL courante, requête comprise — c'est elle qui porte le sens et la
   nature. */
function CurrentUrl() {
  const { pathname, search } = useLocation()
  return <span data-testid="url">{`${pathname}${search}`}</span>
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QuickEntry />
      <CurrentUrl />
      {/* Tient lieu d'onglet : une navigation qui ne passe pas par le bouton. */}
      <Link to="/calendrier">{fr.nav.calendar}</Link>
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>,
  )
}

const trigger = () => screen.getByRole('button', { name: fr.shell.quickEntry })
const url = () => screen.getByTestId('url').textContent

describe('QuickEntry — le bouton de saisie flottant', () => {
  it('ne montre les trois portes qu’une fois déplié', async () => {
    renderAt('/')
    expect(screen.queryByRole('button', { name: fr.entry.newOut })).not.toBeInTheDocument()

    await userEvent.click(trigger())
    expect(screen.getByRole('button', { name: fr.entry.newOut })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: fr.entry.newIn })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: fr.entry.newSaving })).toBeInTheDocument()
  })

  it('annonce son état et change de nom quand il se déplie', async () => {
    renderAt('/')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(trigger())
    const open = screen.getByRole('button', { name: fr.shell.quickEntryClose })
    expect(open).toHaveAttribute('aria-expanded', 'true')
  })

  /* Les trois portes mènent à trois saisies différentes, et c'est tout l'objet
     du bouton : un FAB unique ramènerait la dépense pour tout le monde. */
  it.each([
    [fr.entry.newOut, entryNewPath({ direction: 'out' })],
    [fr.entry.newIn, entryNewPath({ direction: 'in' })],
    [fr.entry.newSaving, entryNewPath({ direction: 'out', saving: true })],
  ])('« %s » ouvre %s', async (label, expected) => {
    renderAt('/')
    await userEvent.click(trigger())
    await userEvent.click(screen.getByRole('button', { name: label }))
    expect(url()).toBe(expected)
  })

  it('se replie sur Échap, et rend le focus au bouton', async () => {
    renderAt('/')
    await userEvent.click(trigger())
    expect(screen.getByRole('button', { name: fr.entry.newOut })).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: fr.entry.newOut })).not.toBeInTheDocument()
    expect(trigger()).toHaveFocus()
  })

  it('se replie une fois la porte franchie', async () => {
    renderAt('/')
    await userEvent.click(trigger())
    await userEvent.click(screen.getByRole('button', { name: fr.entry.newOut }))
    expect(screen.queryByRole('button', { name: fr.entry.newIn })).not.toBeInTheDocument()
  })

  /* Il vit dans la coquille et ne se démonte jamais : l'état survivrait à un
     changement d'écran qui ne passe pas par lui — le bouton « retour » du
     navigateur, un onglet. */
  it('se replie quand l’écran change sans passer par lui', async () => {
    renderAt('/')
    await userEvent.click(trigger())
    expect(screen.getByRole('button', { name: fr.entry.newOut })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: fr.nav.calendar }))
    expect(screen.queryByRole('button', { name: fr.entry.newOut })).not.toBeInTheDocument()
    expect(url()).toBe('/calendrier')
  })

  /* Le calque referme aussi : toucher à côté est le geste le plus évident
     devant trois boutons qu'on n'a pas voulu ouvrir. */
  it('se replie sur un appui à côté', async () => {
    const { container } = renderAt('/')
    await userEvent.click(trigger())

    const overlay = container.querySelector('.fixed.inset-0')
    expect(overlay).not.toBeNull()
    await userEvent.click(overlay as Element)
    expect(screen.queryByRole('button', { name: fr.entry.newOut })).not.toBeInTheDocument()
  })

  /* Même garde que le raccourci « n » : sur un écran de saisie, il partirait
     créer une dépense par-dessus celle qu'on écrit, en contournant la garde de
     brouillon qui ne surveille que les deux boutons de sortie. */
  it('n’existe pas sur un écran de saisie', () => {
    const { container } = renderAt(ENTRY_NEW_PATH)
    expect(screen.queryByRole('button', { name: fr.shell.quickEntry })).not.toBeInTheDocument()
    expect(container).not.toBeEmptyDOMElement()
  })
})
