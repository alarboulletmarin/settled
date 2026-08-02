import 'fake-indexeddb/auto'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeData } from '@/domain/fixtures'
import { fr } from '@/i18n/fr'
import { backupDaily, clearBackups } from '@/persistence/backups'
import { closeDb } from '@/persistence/db'
import { useStore } from '@/store/store'
import { StorageSection } from './StorageSection'

describe('StorageSection', () => {
  beforeEach(async () => {
    await clearBackups()
  })

  afterEach(() => {
    closeDb()
  })

  it('avertit quand le navigateur n’a rien promis, et propose de demander', async () => {
    // jsdom n'expose pas `navigator.storage` : c'est le cas d'un navigateur qui
    // ne s'engage à rien, et c'est celui qu'il faut dire.
    render(<StorageSection />)
    expect(await screen.findByText(fr.storage.notPersisted)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: fr.storage.persistAsk })).toBeInTheDocument()
    expect(screen.getByText(fr.storage.usageUnknown)).toBeInTheDocument()
  })

  it('dit qu’il n’y a pas encore de sauvegarde plutôt que de laisser un vide', async () => {
    render(<StorageSection />)
    expect(await screen.findByText(fr.storage.backupsEmpty)).toBeInTheDocument()
  })

  it('restaure une sauvegarde après deux questions', async () => {
    await backupDaily(makeData({ household: { name: 'Hier', members: [] } }), '2026-08-01')
    render(<StorageSection />)

    await userEvent.click(await screen.findByRole('button', { name: fr.storage.backupRestore }))
    // La sauvegarde est relue et migrée avant que la question ne s'ouvre.
    const dialog = within(await screen.findByRole('dialog'))
    await userEvent.click(dialog.getByRole('button', { name: fr.common.confirm }))
    await userEvent.click(dialog.getByRole('button', { name: fr.storage.backupRestore }))

    expect(useStore.getState().data.household.name).toBe('Hier')
    expect(useStore.getState().status).toBe('ready')
  })
})
