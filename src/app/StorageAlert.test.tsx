import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fr } from '@/i18n/fr'
import * as downloadModule from '@/lib/download'
import { useStore } from '@/store/store'
import { StorageAlert } from './StorageAlert'

describe('StorageAlert', () => {
  afterEach(() => {
    useStore.getState().setError(null)
    vi.restoreAllMocks()
  })

  it('ne dit rien tant que les écritures passent', () => {
    const { container } = render(<StorageAlert />)
    expect(container).toBeEmptyDOMElement()
  })

  it('ne s’affiche pas pour un échec de lecture, qui a son propre écran', () => {
    useStore.getState().setError({ kind: 'read', message: fr.storage.readFailed })
    const { container } = render(<StorageAlert />)
    expect(container).toBeEmptyDOMElement()
  })

  it('annonce l’échec d’écriture et propose l’export', async () => {
    const download = vi.spyOn(downloadModule, 'download').mockImplementation(() => {})
    useStore.getState().setError({ kind: 'write', message: fr.storage.writeFailed })

    render(<StorageAlert />)
    expect(screen.getByRole('alert')).toHaveTextContent(fr.storage.writeFailed)

    await userEvent.click(screen.getByRole('button', { name: fr.storage.exportNow }))
    expect(download).toHaveBeenCalledTimes(1)
  })
})
