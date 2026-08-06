import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { makeCategory, makeData, makeFamily } from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import { ENTRY_NEW_PATH } from '@/app/routes'
import { useStore } from '@/store/store'
import { ScreenTitleProvider } from '@/ui/ScreenTitleProvider'
import { EntryPage } from './EntryPage'

/* Deux portes mènent à une récurrence : l'onglet « Récurrences » et cet
   écran-ci, basculé sur « Récurrence ». Elles créent le même objet, donc elles
   doivent poser les mêmes questions — c'est ce que vérifie ce fichier. */

const CATEGORIES = [
  makeCategory({ id: 'cat-rent', label: 'Loyer', familyId: 'fam-home' }),
  makeCategory({ id: 'cat-power', label: 'Électricité', familyId: 'fam-home' }),
]

function open() {
  render(
    <MemoryRouter initialEntries={[`${ENTRY_NEW_PATH}?sens=sortie`]}>
      <ScreenTitleProvider>
        <Routes>
          <Route path={ENTRY_NEW_PATH} element={<EntryPage />} />
          <Route path="*" element={null} />
        </Routes>
      </ScreenTitleProvider>
    </MemoryRouter>,
  )
}

const rhythm = (label: string) => screen.getByRole('radio', { name: label })
const field = (label: string | RegExp) => screen.getByLabelText(label)

const recurrences = () => useStore.getState().data.recurrences
const entries = () => useStore.getState().data.entries

beforeEach(() => {
  useStore.setState({
    status: 'onboarding',
    ym: '2026-08',
    data: makeData({
      families: [makeFamily({ id: 'fam-home', label: 'Logement', kind: 'charge' })],
      categories: CATEGORIES,
    }),
  })
})

describe('la saisie basculée en récurrence', () => {
  it('ne montre le type de montant qu’une fois basculée', async () => {
    open()
    expect(screen.queryByRole('radio', { name: fr.recurrences.variable })).not.toBeInTheDocument()

    await userEvent.click(rhythm(fr.entry.recurring))
    expect(screen.getByRole('radio', { name: fr.recurrences.fixedAmount })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: fr.recurrences.variable })).toBeInTheDocument()
  })

  /* Le champ manquait des deux côtés de l'écran : la note se lit sur la ligne
     du mois et se cherche depuis l'historique, mais aucune saisie n'en posait. */
  it('porte une note, ponctuelle comme récurrente', async () => {
    open()
    expect(field(new RegExp(fr.entry.note))).toBeInTheDocument()

    await userEvent.click(rhythm(fr.entry.recurring))
    expect(field(new RegExp(fr.entry.note))).toBeInTheDocument()
  })

  it('parle de la récurrence, et non de « cette entrée »', async () => {
    open()
    await userEvent.click(rhythm(fr.entry.recurring))
    await userEvent.click(screen.getByRole('button', { name: fr.common.save }))

    expect(screen.getByText(fr.recurrences.form.labelRequired)).toBeInTheDocument()
    expect(screen.queryByText(fr.entry.labelRequired)).not.toBeInTheDocument()
  })

  it('pose une règle à montant fixe, et paie l’échéance du jour', async () => {
    open()
    await userEvent.click(rhythm(fr.entry.recurring))
    await userEvent.type(field(new RegExp(fr.entry.amount)), '850')
    await userEvent.selectOptions(field(new RegExp(fr.entry.category)), 'cat-rent')
    await userEvent.type(field(new RegExp(fr.entry.label)), 'Loyer')
    await userEvent.type(field(new RegExp(fr.entry.note)), 'Virement le 5')
    await userEvent.click(screen.getByRole('button', { name: fr.common.save }))

    expect(recurrences()).toHaveLength(1)
    expect(recurrences()[0]).toMatchObject({ label: 'Loyer', amount: 85000, note: 'Virement le 5' })
    expect(entries().filter((e) => e.status === 'confirmed')).toHaveLength(1)
  })

  /* Le cas qui n'existait pas : cette porte-là ne savait poser que des montants
     fixes, alors qu'elle crée le même objet que l'autre. */
  it('pose une règle à montant variable, chiffrée par l’échéance qu’on vient de payer', async () => {
    open()
    await userEvent.click(rhythm(fr.entry.recurring))
    await userEvent.click(rhythm(fr.recurrences.variable))
    await userEvent.type(field(new RegExp(fr.entry.amount)), '8750')
    await userEvent.selectOptions(field(new RegExp(fr.entry.category)), 'cat-power')
    await userEvent.type(field(new RegExp(fr.entry.label)), 'Électricité')
    await userEvent.click(screen.getByRole('button', { name: fr.common.save }))

    /* La règle ne fixe aucun montant — c'est ce que « variable » veut dire —
       mais elle garde celui-ci en ordre de grandeur, et l'échéance du jour part
       payée à ce montant-là plutôt qu'à zéro. */
    expect(recurrences()[0]).toMatchObject({ amount: null, estimate: 875000 })
    const paid = entries().filter((e) => e.status === 'confirmed')
    expect(paid).toHaveLength(1)
    expect(paid[0]?.amount).toBe(875000)
  })

  /* Le montant reste exigé : ici il ne chiffre pas la règle mais l'échéance du
     jour, celle qu'on vient de vivre. */
  it('exige quand même un montant sur une règle variable', async () => {
    open()
    await userEvent.click(rhythm(fr.entry.recurring))
    await userEvent.click(rhythm(fr.recurrences.variable))
    await userEvent.selectOptions(field(new RegExp(fr.entry.category)), 'cat-power')
    await userEvent.type(field(new RegExp(fr.entry.label)), 'Électricité')
    await userEvent.click(screen.getByRole('button', { name: fr.common.save }))

    expect(screen.getByText(fr.entry.amountRequired)).toBeInTheDocument()
    expect(recurrences()).toHaveLength(0)
  })
})
