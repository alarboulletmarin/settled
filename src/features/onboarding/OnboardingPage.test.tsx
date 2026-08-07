import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { currentYm, startOfMonth } from '@/domain/date'
import { money } from '@/domain/money'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { closeDb } from '@/persistence/db'
import { emptyData } from '@/persistence/defaults'
import { useStore } from '@/store/store'
import { OnboardingPage } from './OnboardingPage'

/* Le premier lancement, tel qu'il se présente : rien d'enregistré, statut
   « onboarding ». C'est cette garde-là qui fait que les récurrences posées à la
   troisième étape n'ont encore aucune échéance — voir `startWith`. */
function firstLaunch(): void {
  useStore.setState({ status: 'onboarding', data: emptyData(), error: null, ym: currentYm() })
}

const state = () => useStore.getState()

/** Répond aux deux questions et s'arrête sur la troisième étape. */
async function answerBoth(names: readonly string[]): Promise<void> {
  render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>,
  )

  await userEvent.type(
    screen.getByLabelText(new RegExp(fr.onboarding.householdLabel)),
    'Chez nous',
  )
  await userEvent.click(screen.getByRole('button', { name: fr.common.next }))

  for (const name of names) {
    /* Sans `exact`, « Prénom » attraperait aussi les champs de renommage des
       membres déjà ajoutés, qui s'appellent « Prénom de Alix ». */
    await userEvent.type(screen.getByLabelText(fr.onboarding.membersLabel), name)
    await userEvent.click(screen.getByRole('button', { name: fr.onboarding.membersAdd }))
  }

  await userEvent.click(
    screen.getByRole('button', {
      name: names.length === 0 ? fr.onboarding.solo : fr.common.next,
    }),
  )
}

const fill = async (label: string, amount: string): Promise<void> => {
  await userEvent.type(screen.getByLabelText(new RegExp(label)), amount)
}

/* Le montant tel qu'un lecteur d'écran l'entend. Les espaces fines insécables
   d'`Amount` sont ramenées à l'espace ordinaire, comme le fait la
   normalisation de `getByText` sur le texte du DOM — sans quoi les deux
   chaînes se compareraient sur deux caractères d'espace différents. */
const spoken = (cents: number): string => formatMoney(money(cents), 'EUR').replace(/\s/g, ' ')

describe('les trois étapes du premier lancement', () => {
  beforeEach(firstLaunch)

  afterEach(() => {
    closeDb()
  })

  it('pose un salaire par personne et un loyer commun, puis ouvre le mois', async () => {
    await answerBoth(['Alix', 'Camille'])

    await fill(tpl(fr.onboarding.starterSalaryOf, 'Alix'), '2400')
    await fill(tpl(fr.onboarding.starterSalaryOf, 'Camille'), '1850')
    await fill(fr.onboarding.starterRent, '980')
    await userEvent.click(screen.getByRole('button', { name: fr.onboarding.start }))

    const { data, status } = state()
    expect(status).toBe('ready')

    const [alix, camille] = data.household.members
    expect(data.recurrences).toHaveLength(3)

    const salaries = data.recurrences.filter((r) => r.categoryId === 'salary')
    expect(salaries.map((r) => r.memberId)).toStrictEqual([alix?.id, camille?.id])
    expect(salaries.map((r) => r.amount)).toStrictEqual([240_000, 185_000])
    expect(salaries.every((r) => r.direction === 'in')).toBe(true)
    /* Le nom de la ligne, pas celui du tiroir : « Salaires, retraites ou
       indemnités » décrit la catégorie, et la pastille du membre dit déjà de
       qui c'est le salaire. */
    expect(salaries.every((r) => r.label === fr.onboarding.starterSalaryLabel)).toBe(true)

    /* Le loyer n'est à personne et ne force rien : `defaultShared` le rend
       commun parce que c'est une charge que personne ne s'attribue. Poser
       `shared: true` ici recopierait la règle au lieu de s'y fier — et la
       ligne cesserait de suivre si la règle changeait. */
    const rent = data.recurrences.find((r) => r.categoryId === 'rent')
    expect(rent?.memberId).toBeUndefined()
    expect(rent?.shared).toBeUndefined()
    expect(rent?.direction).toBe('out')
    expect(rent?.label).toBe(fr.onboarding.starterRentLabel)

    // Mensuelles au 1er, sans qu'on ait eu à le demander.
    const ym = currentYm()
    expect(data.recurrences.map((r) => r.startedOn)).toStrictEqual(Array(3).fill(startOfMonth(ym)))
    expect(data.recurrences.map((r) => r.period)).toStrictEqual(
      Array(3).fill({ unit: 'month', every: 1, anchorDay: 1 }),
    )

    /* Le vrai résultat de l'étape : on n'arrive pas sur un mois à zéro. Les
       échéances naissent à l'ouverture du mois, donc dans `finishOnboarding`,
       et elles arrivent à confirmer comme n'importe quel mois qui s'ouvre. */
    const planned = data.entries.filter((e) => e.date.startsWith(ym))
    expect(planned).toHaveLength(3)
    expect(planned.every((e) => e.status === 'planned')).toBe(true)
    expect(data.months.map((m) => m.ym)).toStrictEqual([ym])
  })

  it('accepte un revenu sans personne à qui l’attribuer — le foyer solo', async () => {
    await answerBoth([])

    await fill(fr.onboarding.starterSalarySolo, '1700')
    await userEvent.click(screen.getByRole('button', { name: fr.onboarding.start }))

    const { data, status } = state()
    expect(status).toBe('ready')
    expect(data.recurrences).toHaveLength(1)
    expect(data.recurrences[0]?.categoryId).toBe('salary')
    expect(data.recurrences[0]?.memberId).toBeUndefined()
  })

  /* Le cahier §4.1 ne cède pas : l'app reste utilisable sans cette étape, et le
     bouton qui la saute est visible. Sans ce test, « facultative » ne serait
     qu'une intention écrite dans un commentaire. */
  it('s’ouvre quand même quand on saute l’étape', async () => {
    await answerBoth(['Alix'])

    await userEvent.click(screen.getByRole('button', { name: fr.onboarding.starterSkip }))

    expect(state().status).toBe('ready')
    expect(state().data.recurrences).toStrictEqual([])
  })

  it('ignore un champ vide sans retenir les autres', async () => {
    await answerBoth(['Alix'])

    // Le loyer reste vide, et le salaire passe quand même.
    await fill(tpl(fr.onboarding.starterSalaryOf, 'Alix'), '2400')
    await userEvent.click(screen.getByRole('button', { name: fr.onboarding.start }))

    expect(state().data.recurrences).toHaveLength(1)
    expect(state().data.recurrences[0]?.categoryId).toBe('salary')
  })

  it('montre la part de chacun dès que deux revenus et un loyer sont posés', async () => {
    await answerBoth(['Alix', 'Camille'])

    // Rien encore : l'aperçu dit ce que l'étape débloque plutôt qu'un zéro.
    expect(screen.getByText(fr.onboarding.previewStarterEmpty)).toBeInTheDocument()

    await fill(tpl(fr.onboarding.starterSalaryOf, 'Alix'), '3000')
    await fill(tpl(fr.onboarding.starterSalaryOf, 'Camille'), '1000')
    await fill(fr.onboarding.starterRent, '1000')

    expect(screen.getByText(fr.onboarding.previewStarterShare)).toBeInTheDocument()
    // 3 000 contre 1 000 : trois quarts, un quart. Et la somme fait le loyer.
    expect(screen.getByText(spoken(75_000))).toBeInTheDocument()
    expect(screen.getByText(spoken(25_000))).toBeInTheDocument()
    // Et le solde du mois au-dessus : 4 000 de revenus moins 1 000 de loyer.
    expect(screen.getByText(spoken(300_000))).toBeInTheDocument()
  })

  /* L'export ne se découvrait qu'au bout de trente jours, par un bandeau. Il se
     nomme désormais là où la promesse de confidentialité est faite. */
  it('nomme l’export à la dernière étape, et pas avant', async () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    )
    expect(screen.queryByText(fr.onboarding.backup)).not.toBeInTheDocument()

    await userEvent.type(
      screen.getByLabelText(new RegExp(fr.onboarding.householdLabel)),
      'Chez nous',
    )
    await userEvent.click(screen.getByRole('button', { name: fr.common.next }))
    await userEvent.click(screen.getByRole('button', { name: fr.onboarding.solo }))

    expect(screen.getByText(fr.onboarding.backup)).toBeInTheDocument()
  })
})
