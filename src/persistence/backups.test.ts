import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeData } from '@/domain/fixtures'
import { BACKUP_KEEP, backupDaily, clearBackups, listBackups, readBackup } from './backups'
import { closeDb } from './db'
import { CURRENT_SCHEMA_VERSION } from './schema'

const named = (name: string) => makeData({ household: { name, members: [] } })

describe('anneau de sauvegardes', () => {
  beforeEach(async () => {
    await clearBackups()
  })

  afterEach(() => {
    closeDb()
  })

  it('ne garde qu’un instantané par jour, celui du premier passage', async () => {
    // Les écritures suivantes du jour ne doivent pas recouvrir le point de
    // retour : c'est précisément l'état d'avant qu'on veut conserver.
    await backupDaily(named('du matin'), '2026-08-02')
    await backupDaily(named('du soir'), '2026-08-02')

    const backups = await listBackups()
    expect(backups).toHaveLength(1)
    await expect(readBackup('2026-08-02')).resolves.toMatchObject({
      household: { name: 'du matin' },
    })
  })

  it('plafonne à cinq et jette la plus ancienne', async () => {
    const days = ['2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02']
    for (const day of days) await backupDaily(named(day), day)

    const backups = await listBackups()
    expect(backups).toHaveLength(BACKUP_KEEP)
    // Du plus récent au plus ancien, et sans le premier jour.
    expect(backups.map((entry) => entry.on)).toStrictEqual(days.slice(1).reverse())
  })

  it('dit ce que chaque sauvegarde contient, pour qu’on puisse choisir', async () => {
    const data = makeData({ household: { name: 'Chez nous', members: [] } })
    await backupDaily(data, '2026-08-02')

    const [entry] = await listBackups()
    expect(entry).toStrictEqual({
      on: '2026-08-02',
      entries: data.entries.length,
      recurrences: data.recurrences.length,
    })
  })

  it('fait passer une vieille sauvegarde par les migrations', async () => {
    // Cinq jours d'anneau peuvent traverser une mise à jour de l'app.
    await backupDaily({ household: { name: 'Ancien' } } as never, '2026-08-02')
    const restored = await readBackup('2026-08-02')
    expect(restored?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(restored?.household.name).toBe('Ancien')
  })

  it('ne renvoie rien pour un jour sans sauvegarde', async () => {
    await expect(readBackup('2026-01-01')).resolves.toBeNull()
  })

  it('s’efface entièrement', async () => {
    await backupDaily(named('a'), '2026-08-01')
    await backupDaily(named('b'), '2026-08-02')
    await clearBackups()
    await expect(listBackups()).resolves.toStrictEqual([])
  })
})
