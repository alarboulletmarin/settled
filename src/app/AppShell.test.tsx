import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PageTitle } from '@/ui/PageTitle'
import { AppShell } from './AppShell'

/* Les liens vivent hors de la coquille, comme ceux de la navigation : ils ne
   se démontent pas en changeant d'écran, et c'est tout le cas — le focus
   restait sur le lien activé, dans un menu, pendant que l'écran avait changé.
   Un lien posé dans le contenu, lui, part avec l'écran qu'il quitte. */
function shell(initial = '/') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <nav aria-label="Témoin">
        <Link to="/credits">Vers les crédits</Link>
        <Link to="/depense">Vers la saisie</Link>
      </nav>
      <AppShell>
        <Routes>
          <Route path="/" element={<PageTitle title="Le mois" hidden />} />
          <Route
            path="/credits"
            element={
              <>
                <PageTitle title="Crédits et dettes" />
                <input aria-label="Un champ" />
              </>
            }
          />
          <Route
            path="/depense"
            element={
              <>
                <PageTitle title="Nouvelle dépense" />
                <input aria-label="Libellé" autoFocus />
              </>
            }
          />
        </Routes>
      </AppShell>
    </MemoryRouter>,
  )
}

const main = () => document.querySelector('main')

describe('AppShell — le changement d’écran', () => {
  it('ne vole pas le focus au premier affichage', () => {
    shell()
    expect(main()).not.toHaveFocus()
  })

  it('dépose le focus sur le contenu en changeant d’écran', async () => {
    const user = userEvent.setup()
    shell()

    await user.click(screen.getByRole('link', { name: 'Vers les crédits' }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Crédits et dettes')
    expect(main()).toHaveFocus()
  })

  it('annonce l’écran où l’on vient d’arriver', async () => {
    const user = userEvent.setup()
    shell()

    await user.click(screen.getByRole('link', { name: 'Vers les crédits' }))

    expect(screen.getByRole('status')).toHaveTextContent('Crédits et dettes')
  })

  /* Un écran qui pose son propre focus le garde : renvoyer en haut de page
     quelqu'un qui vient d'ouvrir une saisie annulerait le geste. */
  it('laisse un écran de saisie garder son premier champ', async () => {
    const user = userEvent.setup()
    shell()

    await user.click(screen.getByRole('link', { name: 'Vers la saisie' }))

    expect(screen.getByRole('textbox', { name: 'Libellé' })).toHaveFocus()
    expect(main()).not.toHaveFocus()
  })

  it('ne met pas le contenu dans le parcours de tabulation', () => {
    shell()
    expect(main()).toHaveAttribute('tabindex', '-1')
  })
})
