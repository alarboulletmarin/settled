import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { RECURRENCE_NEW_PATH } from '@/app/routes'
import { currentYm, today } from '@/domain/date'
import { makeData, makeRecurrence } from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import { useStore } from '@/store/store'
import { MonthPage } from './MonthPage'

const initial = useStore.getState().data

/* La page navigue : sans témoin, on ne saurait pas où elle mène. */
function CurrentUrl() {
  const { pathname } = useLocation()
  return <span data-testid="url">{pathname}</span>
}

function renderEmptyMonth(recurrences: ReturnType<typeof makeRecurrence>[]): void {
  /* Un mois ouvert mais sans aucune ligne : c'est l'état vide, et c'est le seul
     que cet écran-ci a à dire de deux façons. */
  useStore.setState({
    data: {
      ...makeData(),
      entries: [],
      recurrences,
      months: [{ ym: currentYm(), openedAt: today(), closed: false }],
    },
    ym: currentYm(),
  })

  render(
    <MemoryRouter>
      <MonthPage />
      <CurrentUrl />
    </MemoryRouter>,
  )
}

describe('MonthPage — l’état vide mène au bon geste', () => {
  afterEach(() => {
    useStore.setState({ data: initial })
  })

  /* Le trou que corrige cet écran : « ajoute une dépense » n'amorce aucune
     prévision, et c'était le seul geste offert à qui venait de répondre aux
     deux questions. */
  it('propose d’abord une récurrence tant qu’il n’y en a aucune', async () => {
    renderEmptyMonth([])

    expect(screen.getByText(fr.month.emptyStart)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: fr.recurrences.add }))

    expect(screen.getByTestId('url')).toHaveTextContent(RECURRENCE_NEW_PATH)
  })

  /* Les trois portes cohabitent : au-delà de 1024px, la rangée en flux est
     masquée sur un mois vide, et cet état-ci est alors la seule façon de
     saisir quoi que ce soit. */
  it('garde les deux portes de saisie à côté', () => {
    renderEmptyMonth([])

    expect(screen.getByRole('button', { name: fr.entry.addOut })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: fr.entry.addIn })).toBeInTheDocument()
  })

  it('n’insiste plus dès qu’une récurrence existe', () => {
    renderEmptyMonth([makeRecurrence({ period: { unit: 'month', every: 1, anchorDay: 1 } })])

    expect(screen.getByText(fr.month.empty)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: fr.recurrences.add })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: fr.entry.addOut })).toBeInTheDocument()
  })
})
