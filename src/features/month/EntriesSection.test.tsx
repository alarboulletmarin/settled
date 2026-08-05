import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { money } from '@/domain/money'
import {
  makeCategory,
  makeData,
  makeEntry,
  makeFamily,
  makeMember,
} from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import { ALL_FILTER, useStore } from '@/store/store'
import { EntriesSection } from './EntriesSection'

const FAMILIES = [
  makeFamily({ id: 'fam-home', label: 'Logement', kind: 'charge' }),
  makeFamily({ id: 'fam-food', label: 'Vie courante', kind: 'charge' }),
]

const CATEGORIES = [
  makeCategory({ id: 'cat-rent', label: 'Loyer', familyId: 'fam-home' }),
  makeCategory({ id: 'cat-food', label: 'Courses', familyId: 'fam-food' }),
]

const ENTRIES = [
  makeEntry({ date: '2026-08-03', label: 'Loyer', categoryId: 'cat-rent', amount: money(90000) }),
  makeEntry({
    date: '2026-08-05',
    label: 'Courses',
    categoryId: 'cat-food',
    amount: money(6500),
    memberId: 'm1',
    note: 'avec la caution',
  }),
]

function setup(family: string | null = null) {
  const onFamily = vi.fn()
  render(
    <EntriesSection
      nature={null}
      onNature={vi.fn()}
      family={family}
      onFamily={onFamily}
      focus={0}
      onOpen={vi.fn()}
    />,
  )
  return { onFamily }
}

describe('la liste du mois', () => {
  beforeEach(() => {
    useStore.setState({
      ym: '2026-08',
      filter: ALL_FILTER,
      data: makeData({
        household: { name: 'Foyer', members: [makeMember({ id: 'm1', name: 'Alix' })] },
        families: FAMILIES,
        categories: CATEGORIES,
        entries: ENTRIES,
      }),
    })
  })

  /* La note se saisissait et ne se relisait nulle part : il fallait rouvrir la
     ligne pour la voir, et rien n'annonçait qu'il y en avait une. */
  it('montre la note d’une ligne, à côté de son membre', () => {
    setup()
    expect(screen.getByText('Alix · avec la caution')).toBeInTheDocument()
  })

  it('ne fabrique pas de sous-libellé quand il n’y a ni membre ni note', () => {
    setup()
    const row = screen.getByText('Loyer').closest('button')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).queryByText(/·/)).not.toBeInTheDocument()
  })

  describe('le filtre par poste, venu de « Où part l’argent »', () => {
    it('ne garde que les lignes de la famille visée', () => {
      setup('fam-home')
      expect(screen.getByText('Loyer')).toBeInTheDocument()
      expect(screen.queryByText('Courses')).not.toBeInTheDocument()
    })

    /* Une liste réduite par un geste fait deux écrans plus haut, et qu'aucune
       commande visible ne défait, se lit comme un mois où il manque des
       lignes. */
    it('se nomme et se retire', async () => {
      const { onFamily } = setup('fam-home')
      const chip = screen.getByRole('button', { name: /Logement/ })
      expect(chip).toBeInTheDocument()

      await userEvent.click(chip)
      expect(onFamily).toHaveBeenCalledWith(null)
    })

    it('ne s’annonce pas quand il n’y en a pas', () => {
      setup()
      expect(screen.queryByText(fr.month.familyFilter)).not.toBeInTheDocument()
    })
  })
})
