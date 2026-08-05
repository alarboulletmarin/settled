import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { money } from '@/domain/money'
import { makeCategory, makeData, makeEntry, makeFamily } from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { ALL_FILTER, useStore } from '@/store/store'
import { SearchSection } from './SearchSection'

/** Vingt-cinq lignes au même libellé : au-delà de la limite d'affichage. */
const MANY = Array.from({ length: 25 }, (_, index) =>
  makeEntry({
    date: `2026-08-${String(index + 1).padStart(2, '0')}`,
    label: 'Carburant',
    categoryId: 'cat-1',
    amount: money(5000 + index),
  }),
)

function setup() {
  render(
    <MemoryRouter>
      <SearchSection />
    </MemoryRouter>,
  )
}

describe('la recherche', () => {
  beforeEach(() => {
    useStore.setState({
      ym: '2026-08',
      filter: ALL_FILTER,
      data: makeData({
        families: [makeFamily({ id: 'fam-1' })],
        categories: [makeCategory({ id: 'cat-1', familyId: 'fam-1' })],
        entries: [
          ...MANY,
          makeEntry({
            date: '2026-03-11',
            label: 'Assurance',
            categoryId: 'cat-1',
            amount: money(60000),
            note: 'prélevée en une fois',
          }),
        ],
      }),
    })
  })

  it('montre la note d’un résultat, à côté de sa date', async () => {
    setup()
    await userEvent.type(screen.getByRole('searchbox'), 'assurance')
    expect(screen.getByText(/prélevée en une fois/)).toBeInTheDocument()
  })

  /* La coupe était annoncée mais sans issue : « précise la recherche » ne sert
     à rien quand tout ce qui dépasse porte réellement le même mot. */
  it('compte ce qu’elle laisse de côté, et sait le montrer', async () => {
    setup()
    await userEvent.type(screen.getByRole('searchbox'), 'carburant')
    expect(screen.getByText(tpl(fr.history.searchMore, 5))).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: fr.history.searchShowAll }))
    expect(screen.getAllByText('Carburant')).toHaveLength(25)
    expect(screen.queryByRole('button', { name: fr.history.searchShowAll })).not.toBeInTheDocument()
  })

  /* Une liste complète héritée du mot précédent n'a pas été demandée pour
     celui-ci : le premier écran doit rester court à chaque question posée. */
  it('se referme quand la recherche change', async () => {
    setup()
    const field = screen.getByRole('searchbox')
    await userEvent.type(field, 'carburant')
    await userEvent.click(screen.getByRole('button', { name: fr.history.searchShowAll }))

    await userEvent.type(field, 'x')
    await userEvent.clear(field)
    await userEvent.type(field, 'carburant')
    expect(screen.getByRole('button', { name: fr.history.searchShowAll })).toBeInTheDocument()
  })
})
