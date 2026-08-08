/* ============================================================================
 * Les réglages sont une section, pas un écran.
 *
 * Ce qui est éprouvé ici n'est pas la mise en forme mais l'architecture : ce que
 * la page d'entrée montre — et surtout ce qu'elle ne montre plus —, les quatre
 * pas de navigation qui y mènent, et le retour de chacun. C'est exactement ce
 * qu'un rangement de composants casse sans que rien ne le dise.
 * ==========================================================================*/

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  SETTINGS_CATEGORIES_PATH,
  SETTINGS_FAMILY_NEW_PATH,
  SETTINGS_MEMBER_NEW_PATH,
  SETTINGS_PATH,
  SETTINGS_PEOPLE_PATH,
  isFocusScreen,
  settingsFamilyPath,
} from '@/app/routes'
import { makeCategory, makeData, makeFamily, makeMember } from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { useStore } from '@/store/store'
import { CategoriesPage } from './CategoriesPage'
import { CategoryNewPage, FamilyNewPage } from './CategoryForms'
import { FamilyPage } from './FamilyPage'
import { MemberPage } from './MemberPage'
import { PeoplePage } from './PeoplePage'
import { SettingsPage } from './SettingsPage'

/* Les mêmes chemins que `app/Routes.tsx`, par les mêmes constantes : un test
   qui écrirait ses URL à la main resterait vert le jour où l'app change les
   siennes. */
function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={SETTINGS_PATH} element={<SettingsPage />} />
        <Route path={SETTINGS_PEOPLE_PATH} element={<PeoplePage />} />
        <Route path={SETTINGS_MEMBER_NEW_PATH} element={<MemberPage />} />
        <Route path={`${SETTINGS_PEOPLE_PATH}/:id`} element={<MemberPage />} />
        <Route path={SETTINGS_CATEGORIES_PATH} element={<CategoriesPage />} />
        <Route path={SETTINGS_FAMILY_NEW_PATH} element={<FamilyNewPage />} />
        <Route path={`${SETTINGS_CATEGORIES_PATH}/:id`} element={<FamilyPage />} />
        <Route path={`${SETTINGS_CATEGORIES_PATH}/:id/nouvelle`} element={<CategoryNewPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useStore.setState({
    status: 'ready',
    data: makeData({
      household: { name: 'Maison', members: [makeMember({ id: 'm-1', name: 'Aix' })] },
      families: [
        makeFamily({ id: 'fam-transport', label: 'Transport' }),
        makeFamily({ id: 'fam-daily', label: 'Vie courante' }),
      ],
      categories: [
        makeCategory({ id: 'cat-fuel', label: 'Carburant', familyId: 'fam-transport' }),
        makeCategory({ id: 'cat-toll', label: 'Péages', familyId: 'fam-transport' }),
        makeCategory({ id: 'cat-food', label: 'Courses', familyId: 'fam-daily' }),
      ],
    }),
  })
})

describe('la page d’entrée', () => {
  /* C'est le reproche d'origine : la page portait tout, catalogue compris, et
     l'on faisait défiler quarante-six catégories pour atteindre le thème. */
  it('résume au lieu de tout déplier', () => {
    open(SETTINGS_PATH)

    expect(screen.getByText('Maison')).toBeInTheDocument()
    expect(screen.getByText(tpl(fr.settings.membersCountOne, 1))).toBeInTheDocument()
    expect(
      screen.getByText(
        `${tpl(fr.settings.familyCount, 3)} · ${tpl(fr.settings.familiesCount, 2)}`,
      ),
    ).toBeInTheDocument()

    expect(screen.queryByText('Carburant')).not.toBeInTheDocument()
    expect(screen.queryByText('Transport')).not.toBeInTheDocument()
  })

  /* Le nom du foyer est facultatif. Sans lui, la rangée dit ce qu'elle a à dire
     sur une ligne plutôt que de reprendre le mot de son étiquette. */
  it('se passe du nom quand il n’y en a pas', () => {
    useStore.setState({ data: makeData({ household: { name: '', members: [] } }) })
    open(SETTINGS_PATH)

    expect(screen.getByRole('link', { name: fr.settings.membersNone })).toBeInTheDocument()
  })

  /* Les deux réglages qui restent modifiables sur place : trois positions et
     six choix ne méritent pas un écran chacun. */
  it('garde le thème et la devise à portée', () => {
    open(SETTINGS_PATH)

    expect(screen.getByRole('radiogroup', { name: fr.theme.label })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: fr.settings.currency })).toBeInTheDocument()
  })
})

describe('le catalogue', () => {
  it('descend famille par famille, et remonte', async () => {
    const user = userEvent.setup()
    open(SETTINGS_PATH)

    await user.click(screen.getByRole('link', { name: /Catégories/ }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(fr.settings.categories)

    await user.click(screen.getByRole('link', { name: /Transport/ }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Transport')
    expect(screen.getByDisplayValue('Carburant')).toBeInTheDocument()
    // Les catégories des autres familles restent où elles sont.
    expect(screen.queryByDisplayValue('Courses')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: fr.common.back }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(fr.settings.categories)
  })

  /* La recherche existait déjà ; ce qu'elle doit garder, c'est de retrouver une
     catégorie sans ouvrir sa famille — et de dire de laquelle il s'agit. */
  it('retrouve une catégorie sans ouvrir sa famille, et nomme celle-ci', async () => {
    const user = userEvent.setup()
    open(SETTINGS_CATEGORIES_PATH)

    await user.type(screen.getByRole('searchbox', { name: fr.settings.categorySearch }), 'carbu')

    const result = screen.getByRole('link', { name: /Carburant/ })
    expect(result).toHaveTextContent('Transport')
    expect(screen.queryByRole('link', { name: /Vie courante/ })).not.toBeInTheDocument()

    await user.click(result)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Transport')
  })

  it('dit ce qu’aucune recherche ne trouve', async () => {
    const user = userEvent.setup()
    open(SETTINGS_CATEGORIES_PATH)

    await user.type(screen.getByRole('searchbox', { name: fr.settings.categorySearch }), 'zzz')

    expect(screen.getByText(tpl(fr.settings.categorySearchEmpty, 'zzz'))).toBeInTheDocument()
  })

  /* Le formulaire de création n'attend plus ouvert sous la liste : on le
     demande, et la famille qu'il crée s'ouvre pour qu'on y range. */
  it('crée une famille sur demande, et atterrit dessus', async () => {
    const user = userEvent.setup()
    open(SETTINGS_CATEGORIES_PATH)

    await user.click(screen.getByRole('button', { name: fr.settings.familyAdd }))
    await user.type(screen.getByRole('textbox', { name: fr.settings.familyName }), 'Animaux')
    await user.click(screen.getByRole('button', { name: fr.settings.familyAdd }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Animaux')
    expect(useStore.getState().data.families.map((f) => f.label)).toContain('Animaux')
  })

  /* La famille est connue : la création d'une catégorie ne la redemande pas. */
  it('crée une catégorie dans la famille où l’on est', async () => {
    const user = userEvent.setup()
    open(settingsFamilyPath('fam-transport'))

    await user.click(screen.getByRole('button', { name: fr.settings.categoryAdd }))
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: fr.settings.categoryName }), 'Péage A7')
    await user.click(screen.getByRole('button', { name: fr.settings.categoryAdd }))

    const created = useStore.getState().data.categories.find((c) => c.label === 'Péage A7')
    expect(created?.familyId).toBe('fam-transport')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Transport')
  })
})

describe('les personnes', () => {
  it('mènent à la fiche d’un membre, où le prénom se valide', async () => {
    const user = userEvent.setup()
    open(SETTINGS_PEOPLE_PATH)

    await user.click(screen.getByRole('button', { name: /Aix/ }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Aix')

    const field = screen.getByRole('textbox', { name: fr.settings.memberName })
    await user.clear(field)
    await user.type(field, 'Camille')
    // Rien n'est écrit tant qu'on n'a pas validé.
    expect(useStore.getState().data.household.members[0]?.name).toBe('Aix')

    await user.click(screen.getByRole('button', { name: fr.common.save }))
    expect(useStore.getState().data.household.members[0]?.name).toBe('Camille')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(fr.settings.household)
  })

  it('ajoutent un membre depuis une vue à part', async () => {
    const user = userEvent.setup()
    open(SETTINGS_PEOPLE_PATH)

    await user.click(screen.getByRole('button', { name: fr.settings.memberAdd }))
    await user.type(screen.getByRole('textbox', { name: fr.settings.memberName }), 'Sacha')
    await user.click(screen.getByRole('button', { name: fr.settings.memberAdd }))

    expect(useStore.getState().data.household.members.map((m) => m.name)).toEqual(['Aix', 'Sacha'])
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(fr.settings.household)
  })
})

/* Le bouton flottant pose la saisie d'une dépense ; « Ajouter un membre » pose
   un membre. Deux actions principales sur le même écran, à trois centimètres
   l'une de l'autre, ne disent plus laquelle est celle de l'écran. */
describe('le bouton flottant', () => {
  it('se retire des vues des réglages, et reste sur la page d’entrée', () => {
    expect(isFocusScreen(SETTINGS_PATH)).toBe(false)
    expect(isFocusScreen(SETTINGS_PEOPLE_PATH)).toBe(true)
    expect(isFocusScreen(SETTINGS_CATEGORIES_PATH)).toBe(true)
    expect(isFocusScreen(settingsFamilyPath('fam-transport'))).toBe(true)
  })
})
