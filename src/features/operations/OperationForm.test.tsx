import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { today } from '@/domain/date'
import { makeCategory, makeData, makeFamily } from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import { ENTRY_NEW_PATH, RECURRENCE_NEW_PATH } from '@/app/routes'
import { EntryPage } from '@/features/month/EntryPage'
import { RecurrenceFormPage } from '@/features/recurrences/RecurrenceFormPage'
import { useStore } from '@/store/store'
import { ScreenTitleProvider } from '@/ui/ScreenTitleProvider'

/* Un seul formulaire, deux portes. Ce fichier vérifie surtout la chose qu'on ne
   peut pas lire dans le code d'un composant : que les deux portes mènent au même
   écran, et que rien à l'intérieur ne dit par laquelle on est passé. */

const CATEGORIES = [
  makeCategory({ id: 'cat-rent', label: 'Loyer', familyId: 'fam-home' }),
  makeCategory({ id: 'cat-power', label: 'Électricité', familyId: 'fam-home' }),
]

const TODAY = today()
const NEXT_YEAR = `${String(Number(TODAY.slice(0, 4)) + 1)}-01-15`

function openAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ScreenTitleProvider>
        <Routes>
          <Route path={ENTRY_NEW_PATH} element={<EntryPage />} />
          <Route path={RECURRENCE_NEW_PATH} element={<RecurrenceFormPage />} />
          <Route path="*" element={null} />
        </Routes>
      </ScreenTitleProvider>
    </MemoryRouter>,
  )
}

const fromEntryDoor = () => { openAt(`${ENTRY_NEW_PATH}?sens=sortie`) }
const fromRecurrenceDoor = () => { openAt(RECURRENCE_NEW_PATH) }

const choice = (label: string) => screen.getByRole('radio', { name: label })
const field = (label: string) => screen.getByLabelText(new RegExp(label))
const missing = (label: string) => screen.queryByLabelText(new RegExp(label))
const save = () => screen.getByRole('button', { name: /Ajouter|Enregistrer/ })

const setDate = (label: string, value: string): void => {
  fireEvent.change(field(label), { target: { value } })
}

const recurrences = () => useStore.getState().data.recurrences
const entries = () => useStore.getState().data.entries

beforeEach(() => {
  useStore.setState({
    status: 'onboarding',
    /* Le mois affiché est celui qu'on vit : la date proposée est donc
       aujourd'hui, des deux côtés. */
    ym: TODAY.slice(0, 7),
    data: makeData({
      families: [makeFamily({ id: 'fam-home', label: 'Logement', kind: 'charge' })],
      categories: CATEGORIES,
    }),
  })
})

describe('les deux portes mènent au même formulaire', () => {
  /* Le titre ne nomme plus ce qu'on croit enregistrer : nature et rythme se
     changent d'un doigt, et « Ajouter une récurrence » s'affichait au-dessus
     d'un formulaire qu'un seul geste ramenait au ponctuel. */
  it('porte le même titre depuis la saisie', () => {
    fromEntryDoor()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(fr.entry.addOperation)
    expect(choice(fr.entry.once)).toHaveAttribute('aria-checked', 'true')
  })

  it('porte le même titre depuis l’onglet des récurrences', () => {
    fromRecurrenceDoor()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(fr.entry.addOperation)
    expect(choice(fr.entry.recurring)).toHaveAttribute('aria-checked', 'true')
  })

  /* La seule chose qu'une porte transmet est un état initial : tout le reste —
     champs, mots, comportements — doit être indiscernable. */
  it('pose les mêmes champs qu’on arrive par la saisie ou par les récurrences', async () => {
    const labels = [
      fr.entry.amount,
      fr.entry.category,
      fr.entry.firstDate,
      fr.recurrences.form.period,
      fr.recurrences.form.monthDay,
      fr.entry.label,
      fr.entry.note,
    ]

    fromEntryDoor()
    await userEvent.click(choice(fr.entry.recurring))
    for (const label of labels) expect(field(label)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: fr.recurrences.variable })).toBeInTheDocument()
    cleanup()

    fromRecurrenceDoor()
    for (const label of labels) expect(field(label)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: fr.recurrences.variable })).toBeInTheDocument()
  })
})

describe('le rythme commande les champs', () => {
  it('ne montre ni périodicité ni type de montant en ponctuel', () => {
    fromEntryDoor()
    expect(field(fr.entry.date)).toBeInTheDocument()
    expect(missing(fr.recurrences.form.period)).not.toBeInTheDocument()
    expect(missing(fr.recurrences.form.monthDay)).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: fr.recurrences.variable })).not.toBeInTheDocument()
  })

  it('les fait apparaître à la bascule, sans changer de date', async () => {
    fromEntryDoor()
    setDate(fr.entry.date, NEXT_YEAR)
    await userEvent.click(choice(fr.entry.recurring))

    expect(field(fr.entry.firstDate)).toHaveValue(NEXT_YEAR)
    expect(field(fr.recurrences.form.period)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: fr.recurrences.variable })).toBeInTheDocument()
  })

  /* « Première échéance le 15 janvier » répond déjà à « quel jour du mois ». */
  it('préremplit le jour du mois depuis la première échéance, sans le figer', () => {
    fromRecurrenceDoor()
    setDate(fr.entry.firstDate, NEXT_YEAR)
    expect(field(fr.recurrences.form.monthDay)).toHaveValue(15)

    // Le prérempli est une proposition : c'est la date suivante qui le reprend.
    fireEvent.change(field(fr.recurrences.form.monthDay), { target: { value: '28' } })
    expect(field(fr.recurrences.form.monthDay)).toHaveValue(28)

    setDate(fr.entry.firstDate, `${NEXT_YEAR.slice(0, 8)}03`)
    expect(field(fr.recurrences.form.monthDay)).toHaveValue(3)
  })
})

describe('ce qui est enregistré suit le rythme, pas la porte', () => {
  const fill = async (label: string, categoryId: string) => {
    await userEvent.type(field(fr.entry.amount), '850')
    await userEvent.selectOptions(field(fr.entry.category), categoryId)
    await userEvent.type(field(fr.entry.label), label)
  }

  it('crée une entrée ponctuelle depuis l’onglet des récurrences', async () => {
    fromRecurrenceDoor()
    await userEvent.click(choice(fr.entry.once))
    await fill('Achat unique', 'cat-rent')
    await userEvent.click(save())

    expect(recurrences()).toHaveLength(0)
    expect(entries()).toHaveLength(1)
    expect(entries()[0]).toMatchObject({ label: 'Achat unique', amount: 85000 })
  })

  it('crée une récurrence depuis la saisie d’une dépense', async () => {
    fromEntryDoor()
    await userEvent.click(choice(fr.entry.recurring))
    await fill('Loyer', 'cat-rent')
    await userEvent.click(save())

    expect(recurrences()).toHaveLength(1)
    expect(recurrences()[0]).toMatchObject({ label: 'Loyer', amount: 85000 })
  })

  it('nomme dans son bouton ce qui va être créé', async () => {
    fromEntryDoor()
    expect(save()).toHaveTextContent(fr.entry.saveOperation)

    await userEvent.click(choice(fr.entry.recurring))
    expect(save()).toHaveTextContent(fr.entry.saveRecurrence)
  })
})

describe('la première échéance', () => {
  const poser = async (categoryId: string) => {
    await userEvent.type(field(fr.entry.label), 'Loyer')
    await userEvent.selectOptions(field(fr.entry.category), categoryId)
    await userEvent.click(save())
  }

  /* Une échéance datée d'aujourd'hui, dont le montant est fixe, a eu lieu : le
     geste courant de la saisie — « j'ai payé le loyer, et c'est tous les mois ». */
  it('part payée quand elle est datée d’aujourd’hui et chiffrée', async () => {
    fromRecurrenceDoor()
    expect(screen.getByText(fr.entry.firstDatePaid)).toBeInTheDocument()
    await userEvent.type(field(fr.entry.amount), '850')
    await poser('cat-rent')

    const paid = entries().filter((e) => e.status === 'confirmed')
    expect(paid).toHaveLength(1)
    expect(paid[0]).toMatchObject({ date: TODAY, amount: 85000 })
  })

  it('part à confirmer quand elle est à venir', async () => {
    fromEntryDoor()
    await userEvent.click(choice(fr.entry.recurring))
    await userEvent.type(field(fr.entry.amount), '850')
    setDate(fr.entry.firstDate, NEXT_YEAR)
    expect(screen.getByText(fr.entry.firstDatePlanned)).toBeInTheDocument()
    await poser('cat-rent')

    expect(recurrences()).toHaveLength(1)
    expect(entries().filter((e) => e.status === 'confirmed')).toHaveLength(0)
  })

  /* Sans montant, il n'y a rien à enregistrer comme payé : la marquer payée
     l'écrirait à l'estimation, c'est-à-dire à une supposition. */
  it('part à confirmer quand le montant est variable', async () => {
    fromRecurrenceDoor()
    await userEvent.click(choice(fr.recurrences.variable))
    expect(screen.getByText(fr.entry.firstDatePlanned)).toBeInTheDocument()
    await poser('cat-power')

    expect(entries().filter((e) => e.status === 'confirmed')).toHaveLength(0)
  })
})

describe('le montant variable', () => {
  it('rend le montant facultatif, et le garde en ordre de grandeur', async () => {
    fromRecurrenceDoor()
    await userEvent.click(choice(fr.recurrences.variable))
    await userEvent.type(field(fr.entry.amount), '87,50')
    await userEvent.selectOptions(field(fr.entry.category), 'cat-power')
    await userEvent.type(field(fr.entry.label), 'Électricité')
    await userEvent.click(save())

    expect(recurrences()[0]).toMatchObject({ amount: null, estimate: 8750 })
  })

  it('s’enregistre même sans montant', async () => {
    fromRecurrenceDoor()
    await userEvent.click(choice(fr.recurrences.variable))
    await userEvent.selectOptions(field(fr.entry.category), 'cat-power')
    await userEvent.type(field(fr.entry.label), 'Électricité')
    await userEvent.click(save())

    expect(recurrences()).toHaveLength(1)
    expect(recurrences()[0]).toMatchObject({ amount: null })
    expect(recurrences()[0]).not.toHaveProperty('estimate')
  })

  /* Le montant redevient obligatoire dès que la règle en fixe un — et il l'est
     toujours en ponctuel, où un mouvement sans montant n'est pas un mouvement. */
  it('reste obligatoire en montant fixe', async () => {
    fromRecurrenceDoor()
    await userEvent.selectOptions(field(fr.entry.category), 'cat-rent')
    await userEvent.type(field(fr.entry.label), 'Loyer')
    await userEvent.click(save())

    expect(screen.getByText(fr.entry.amountRequired)).toBeInTheDocument()
    expect(recurrences()).toHaveLength(0)
  })
})

describe('les mots suivent ce qu’on enregistre', () => {
  it('parle de la récurrence en récurrence, de l’entrée en ponctuel', async () => {
    fromEntryDoor()
    await userEvent.click(save())
    expect(screen.getByText(fr.entry.labelRequired)).toBeInTheDocument()

    await userEvent.click(choice(fr.entry.recurring))
    expect(screen.getByText(fr.entry.labelRequiredRecurring)).toBeInTheDocument()
    expect(screen.queryByText(fr.entry.labelRequired)).not.toBeInTheDocument()
  })
})
