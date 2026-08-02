/* ============================================================================
 * Ce que les quatre chemins asynchrones des réglages disent quand ils ratent.
 *
 * Aucun ne portait de `.catch` : deux annonçaient la réussite d'une écriture
 * qui n'avait pas eu lieu, deux laissaient un clic sans effet et sans message.
 * ==========================================================================*/

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fr } from '@/i18n/fr'
import { useStore } from '@/store/store'
import { useToasts } from '@/ui/toast'
import { DataSection } from './DataSection'
import { ExampleControl } from './ExampleControl'
import { ImportControl } from './ImportControl'
import { SchemaControl } from './SchemaControl'

vi.mock('@/persistence/example', () => {
  throw new Error('chunk indisponible')
})

vi.mock('@/persistence/schemaDoc', () => {
  throw new Error('chunk indisponible')
})

const dangers = (): string[] =>
  useToasts.getState().toasts.filter((t) => t.tone === 'danger').map((t) => t.message)

const messages = (): string[] => useToasts.getState().toasts.map((t) => t.message)

beforeEach(() => {
  useToasts.setState({ toasts: [] })
})

afterEach(() => {
  useToasts.setState({ toasts: [] })
  vi.restoreAllMocks()
})

describe('un chargement à la demande qui n’aboutit pas', () => {
  it('le dit, plutôt que de laisser le clic sans effet', async () => {
    render(<ExampleControl confirm={false} />)
    await userEvent.click(screen.getByRole('button', { name: fr.settings.exampleLoad }))

    await waitFor(() => {
      expect(dangers()).toEqual([fr.settings.exampleFailed])
    })
  })

  it('le dit aussi pour le schéma, dont les boutons restent désactivés', async () => {
    render(<SchemaControl />)

    await waitFor(() => {
      expect(dangers()).toEqual([fr.settings.schemaUnavailable])
    })
    expect(screen.getByRole('button', { name: fr.settings.schemaCopy })).toBeDisabled()
  })
})

describe('une écriture qui n’aboutit pas', () => {
  it('n’annonce pas un import qui a échoué comme réussi', async () => {
    const replaceData = vi.fn().mockRejectedValue(new Error('disque plein'))
    useStore.setState({ replaceData })

    render(<ImportControl />)

    const file = new File(['{"schemaVersion":6}'], 'export.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) throw new Error('champ de fichier introuvable')
    await userEvent.upload(input, file)

    // Deux pas avant que l'import parte : un remplacement se confirme.
    await screen.findByText(fr.settings.importConfirm)
    const dialog = within(screen.getByRole('dialog'))
    await userEvent.click(dialog.getByRole('button', { name: fr.common.confirm }))
    await userEvent.click(dialog.getByRole('button', { name: fr.settings.import }))

    await waitFor(() => {
      expect(replaceData).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(messages()).toEqual([fr.settings.importFailed])
    })
  })

  it('n’annonce pas « Données effacées » sur un effacement qui n’a pas eu lieu', async () => {
    const resetAll = vi.fn().mockRejectedValue(new Error('base verrouillée'))
    useStore.setState({ resetAll })

    render(<DataSection />)
    await userEvent.click(screen.getByRole('button', { name: fr.settings.reset }))

    // Trois pas : c'est le seul geste de l'app qui n'épargne rien.
    const dialog = within(screen.getByRole('dialog'))
    await userEvent.click(dialog.getByRole('button', { name: fr.common.confirm }))
    await userEvent.click(dialog.getByRole('button', { name: fr.common.confirm }))
    await userEvent.click(dialog.getByRole('button', { name: fr.settings.reset }))

    await waitFor(() => {
      expect(dangers()).toContain(fr.settings.resetFailed)
    })
    expect(messages()).not.toContain(fr.settings.resetDone)
  })
})
