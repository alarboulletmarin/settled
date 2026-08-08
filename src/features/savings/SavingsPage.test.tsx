/* ============================================================================
 * L'épargne se lit au nom d'une personne, et n'a pas d'autre lecture.
 *
 * C'est la règle que ce fichier protège, et elle ne se lit dans le code d'aucun
 * composant : le bandeau ne propose que des personnes, une est toujours active,
 * et le total dit laquelle. Deux personnes qui ont 12 000 € et 8 000 € de côté
 * n'ont pas « 20 000 € » — un total du foyer ne se place nulle part.
 * ==========================================================================*/

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import {
  eur,
  makeCategory,
  makeData,
  makeEntry,
  makeFamily,
  makeMember,
  makeSavingSupport,
  makeSavingValuation,
} from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import { de, formatMoney, tpl } from '@/i18n/format'
import { ALL_FILTER, useStore } from '@/store/store'
import { ScreenTitleProvider } from '@/ui/ScreenTitleProvider'
import { SavingsPage } from './SavingsPage'

const initial = useStore.getState().data
const MONTH = '2026-07'

/* `getByText` normalise les blancs du nœud avant de comparer : l'espace
   insécable étroite qu'`Intl` glisse devant le symbole y devient une espace
   ordinaire. */
const said = (text: string): string => text.replace(/\s+/g, ' ').trim()
const spoken = (cents: number): string => said(formatMoney(eur(cents), 'EUR'))

const ANDREA = makeMember({ id: 'm-1', name: 'Andrea' })
const MARIE = makeMember({ id: 'm-2', name: 'Marie', color: 'var(--member-2)' })

function seed(members = [ANDREA, MARIE]) {
  useStore.setState({
    ym: MONTH,
    filter: ALL_FILTER,
    data: makeData({
      household: { name: '', members },
      families: [
        makeFamily({ id: 'fam-res', label: 'Ressources', kind: 'resource' }),
        makeFamily({ id: 'fam-savings', label: 'Épargne', kind: 'saving' }),
      ],
      categories: [
        makeCategory({ id: 'salaire', label: 'Salaire', familyId: 'fam-res', direction: 'in' }),
        makeCategory({ id: 'passbook', label: 'Livrets', familyId: 'fam-savings' }),
      ],
      savingSupports: [
        makeSavingSupport({ id: 's-1', label: 'Livret A', memberId: 'm-1' }),
        makeSavingSupport({ id: 's-2', label: 'Livret A', memberId: 'm-2' }),
      ],
      savingValuations: [
        makeSavingValuation({ id: 'v-1', supportId: 's-1', amount: eur(1_200_000), date: '2026-07-01' }),
        makeSavingValuation({ id: 'v-2', supportId: 's-2', amount: eur(800_000), date: '2026-07-01' }),
      ],
      entries: [
        makeEntry({ id: 'p1', date: '2026-07-01', direction: 'in', amount: eur(250_000), categoryId: 'salaire', memberId: 'm-1' }),
        makeEntry({ id: 'p2', date: '2026-07-01', direction: 'in', amount: eur(250_000), categoryId: 'salaire', memberId: 'm-2' }),
        makeEntry({ id: 'v1', date: '2026-07-05', amount: eur(20_000), categoryId: 'passbook', memberId: 'm-1', savingSupportId: 's-1' }),
        makeEntry({ id: 'v2', date: '2026-07-06', amount: eur(30_000), categoryId: 'passbook', memberId: 'm-2', savingSupportId: 's-2' }),
      ],
    }),
  })
}

function open() {
  render(
    <MemoryRouter>
      <ScreenTitleProvider>
        <SavingsPage />
      </ScreenTitleProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  /* Démonter avant de remettre le document : les `afterEach` se dépilent, donc
     celui-ci passe avant le `cleanup` de `test/setup.ts`, et reposer le store
     sous un arbre encore monté ferait remonter tout l'écran hors de `act`. */
  cleanup()
  useStore.setState({ data: initial, filter: ALL_FILTER })
})

describe('l’épargne se lit au nom d’une personne', () => {
  /* « Tout le monde » rendrait une somme, « Commun » rendrait des zéros :
     ni l'une ni l'autre n'est une lecture de l'épargne. */
  it('ne propose que les personnes dans le bandeau', () => {
    seed()
    open()

    expect(screen.queryByRole('button', { name: fr.shell.all })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: fr.shell.common })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Andrea' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marie' })).toBeInTheDocument()
  })

  /* Une rangée de pilules dont aucune n'est active laisserait croire à une
     lecture qui n'existe pas — et le total afficherait la somme du foyer. */
  it('pose une personne quand le filtre n’en portait aucune', () => {
    seed()
    expect(useStore.getState().filter).toEqual(ALL_FILTER)
    open()

    expect(useStore.getState().filter).toEqual({ kind: 'member', memberId: 'm-1' })
    expect(screen.getByText(tpl(fr.savings.totalOf, de('Andrea')))).toBeInTheDocument()
    // Deux fois : le total, et la tuile du seul support qu'elle porte.
    expect(screen.getAllByText(spoken(1_200_000))).toHaveLength(2)
    // Jamais la somme des deux personnes.
    expect(screen.queryByText(spoken(2_000_000))).not.toBeInTheDocument()
  })

  it('garde la personne déjà filtrée en arrivant', () => {
    seed()
    useStore.getState().setFilter({ kind: 'member', memberId: 'm-2' })
    open()

    expect(screen.getByText(tpl(fr.savings.totalOf, de('Marie')))).toBeInTheDocument()
    expect(screen.getAllByText(spoken(800_000))).toHaveLength(2)
  })

  it('change de personne à la pilule, stock et flux ensemble', async () => {
    seed()
    open()
    expect(screen.getAllByText(spoken(1_200_000))).toHaveLength(2)

    await userEvent.click(screen.getByRole('button', { name: 'Marie' }))

    expect(screen.getByText(tpl(fr.savings.totalOf, de('Marie')))).toBeInTheDocument()
    expect(screen.getAllByText(spoken(800_000))).toHaveLength(2)
    expect(screen.queryByText(spoken(1_200_000))).not.toBeInTheDocument()
  })

  /* Seul·e du foyer, il n'y a personne entre qui choisir — mais le total porte
     quand même son nom : c'est son épargne, pas celle d'un foyer. */
  it('nomme la personne même seule du foyer', () => {
    seed([ANDREA])
    open()

    expect(useStore.getState().filter).toEqual({ kind: 'member', memberId: 'm-1' })
    expect(screen.getByText(tpl(fr.savings.totalOf, de('Andrea')))).toBeInTheDocument()
  })

  /* Le raccourci vit sur la section, et pas dans les tuiles : une tuile
     actionnable est un `<button>`, qui n'admet pas de bouton, et une tuile à
     lien étendu ne contient plus rien d'actionnable (DS §6). */
  it('offre de relever ses supports sans ouvrir leurs fiches', () => {
    seed()
    open()

    const shortcut = screen.getByRole('button', { name: fr.savings.valuesUpdate })
    expect(shortcut.closest('section')).toContainElement(
      screen.getByRole('button', { name: tpl(fr.savings.supportOpen, 'Livret A') }),
    )
  })

  /* Sans personne au foyer, il n'y a rien à filtrer et rien à posséder :
     l'écran demande quelqu'un avant de parler d'épargne. */
  it('ne force aucun filtre quand le foyer n’a personne', () => {
    seed([])
    /* Un support est toujours à quelqu'un : sans membre, le document n'en porte
       aucun — c'est ce que la lecture d'un fichier garantit déjà (`validate`). */
    useStore.setState({
      data: { ...useStore.getState().data, savingSupports: [], savingValuations: [], entries: [] },
    })
    open()

    expect(useStore.getState().filter).toEqual(ALL_FILTER)
    expect(screen.getByText(fr.savings.supportsNoMember)).toBeInTheDocument()
  })
})
