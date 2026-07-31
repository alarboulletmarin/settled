import { describe, expect, it } from 'vitest'
import {
  eur,
  makeCategory,
  makeData,
  makeEntry,
  makeMember,
  makeRecurrence,
  sequentialIds,
} from './fixtures'
import {
  addEntry,
  addMember,
  archiveCategory,
  confirmEntries,
  confirmEntry,
  confirmOccurrence,
  openMonth,
  removeMember,
  removeRecurrence,
  renameMember,
  replaceEntry,
  replaceRecurrence,
  resumeRecurrence,
  setHouseholdName,
  stopRecurrence,
  syncRecurrenceEntries,
  updateRecurrence,
  updateSettings,
} from './updates'

describe('foyer et membres', () => {
  it('renomme le foyer sans toucher au reste', () => {
    const before = makeData({ entries: [makeEntry({ date: '2026-07-01' })] })
    const after = setHouseholdName(before, 'Chez nous')
    expect(after.household.name).toBe('Chez nous')
    expect(after.entries).toBe(before.entries)
  })

  it('ajoute un membre', () => {
    const after = addMember(makeData(), { id: 'm1', name: 'Alix', color: 'c' })
    expect(after.household.members).toHaveLength(1)
  })

  it('retirer un membre libère ses entrées au lieu de les perdre', () => {
    const before = makeData({
      household: { name: 'Maison', members: [{ id: 'm1', name: 'Alix', color: 'c' }] },
      entries: [
        makeEntry({ id: 'e1', date: '2026-07-01', memberId: 'm1' }),
        makeEntry({ id: 'e2', date: '2026-07-02', memberId: 'm2' }),
      ],
      recurrences: [
        makeRecurrence({
          id: 'r1',
          memberId: 'm1',
          period: { unit: 'month', every: 1, anchorDay: 1 },
        }),
      ],
    })
    const after = removeMember(before, 'm1')
    expect(after.household.members).toEqual([])
    expect(after.entries).toHaveLength(2)
    expect(after.entries[0]).not.toHaveProperty('memberId')
    expect(after.entries[1]?.memberId).toBe('m2')
    expect(after.recurrences[0]).not.toHaveProperty('memberId')
  })

  it('renomme un membre sans toucher aux autres', () => {
    const before = makeData({
      household: { name: 'Maison', members: [makeMember({ id: 'm1' }), makeMember({ id: 'm2' })] },
      entries: [makeEntry({ date: '2026-07-01' })],
    })
    const after = renameMember(before, 'm1', 'Alix')
    expect(after.household.members[0]?.name).toBe('Alix')
    expect(after.household.members[1]).toBe(before.household.members[1])
    expect(after.entries).toBe(before.entries)
  })
})

describe('échéance payée d’avance', () => {
  const monthly = makeRecurrence({
    id: 'r1',
    amount: eur(1399),
    startedOn: '2026-07-31',
    period: { unit: 'month', every: 1, anchorDay: 31 },
  })

  it('confirme l’échéance déjà posée par la synchronisation', () => {
    const opened = makeData({
      recurrences: [monthly],
      months: [{ ym: '2026-07', openedAt: '2026-07-01', closed: false }],
    })
    const planned = syncRecurrenceEntries(opened, 'r1', sequentialIds(), '2026-07-01')
    const after = confirmOccurrence(planned, 'r1', '2026-07-31', sequentialIds('bis'))

    const july = after.entries.filter((e) => e.date === '2026-07-31')
    expect(july).toHaveLength(1)
    expect(july[0]?.status).toBe('confirmed')
  })

  it('crée l’échéance quand son mois n’a jamais été ouvert', () => {
    const before = makeData({ recurrences: [monthly] })
    const after = confirmOccurrence(before, 'r1', '2026-07-31', sequentialIds())

    expect(after.entries).toHaveLength(1)
    expect(after.entries[0]).toMatchObject({
      recurrenceId: 'r1',
      date: '2026-07-31',
      status: 'confirmed',
      amount: 1399,
    })
  })

  it('ne fabrique rien pour une récurrence inconnue', () => {
    const before = makeData({ recurrences: [monthly] })
    expect(confirmOccurrence(before, 'inconnue', '2026-07-31', sequentialIds())).toBe(before)
  })
})

describe('catégories', () => {
  it('archive plutôt que d’effacer', () => {
    const before = makeData({ categories: [makeCategory({ id: 'c1' })] })
    const after = archiveCategory(before, 'c1')
    expect(after.categories[0]?.archived).toBe(true)
    expect(after.categories).toHaveLength(1)
  })
})

describe('récurrences', () => {
  const base = makeData({
    recurrences: [
      makeRecurrence({ id: 'r1', period: { unit: 'month', every: 1, anchorDay: 5 } }),
    ],
    entries: [
      makeEntry({ id: 'passe', recurrenceId: 'r1', date: '2026-06-05', status: 'confirmed' }),
      makeEntry({ id: 'futur', recurrenceId: 'r1', date: '2026-08-05', status: 'planned' }),
    ],
  })

  it('arrête une récurrence et retire ses échéances seulement prévues', () => {
    const after = stopRecurrence(base, 'r1', '2026-07-15')
    expect(after.recurrences[0]?.endedOn).toBe('2026-07-15')
    expect(after.entries.map((e) => e.id)).toEqual(['passe'])
  })

  it('garde les échéances confirmées : elles ont eu lieu', () => {
    const after = stopRecurrence(base, 'r1', '2026-01-01')
    expect(after.entries.some((e) => e.id === 'passe')).toBe(true)
  })

  it('relance une récurrence arrêtée', () => {
    const stopped = stopRecurrence(base, 'r1', '2026-07-15')
    expect(resumeRecurrence(stopped, 'r1').recurrences[0]).not.toHaveProperty('endedOn')
  })

  it('supprime vraiment une récurrence sans aucune échéance confirmée', () => {
    const fresh = makeData({
      recurrences: [makeRecurrence({ id: 'r1', period: { unit: 'month', every: 1, anchorDay: 5 } })],
      entries: [makeEntry({ id: 'p', recurrenceId: 'r1', date: '2026-08-05', status: 'planned' })],
    })
    const after = removeRecurrence(fresh, 'r1', '2026-07-15')
    expect(after.recurrences).toEqual([])
    expect(after.entries).toEqual([])
  })

  it('arrête au lieu de supprimer dès qu’une échéance a été confirmée', () => {
    const after = removeRecurrence(base, 'r1', '2026-07-15')
    expect(after.recurrences).toHaveLength(1)
    expect(after.recurrences[0]?.endedOn).toBe('2026-07-15')
    expect(after.entries.some((e) => e.id === 'passe')).toBe(true)
  })

  /* Le formulaire envoie l'état complet de ce qu'il montre : remettre un
     abonnement à « tout le foyer » doit effacer le membre, pas le laisser. */
  it('rend l’abonnement au foyer quand le formulaire n’envoie plus de membre', () => {
    const owned = makeData({
      recurrences: [
        makeRecurrence({
          id: 'r1',
          memberId: 'm1',
          shared: false,
          note: 'à moi',
          period: { unit: 'month', every: 1, anchorDay: 5 },
        }),
      ],
    })
    const { id: _dropped, memberId: _m, shared: _s, note: _n, ...kept } = owned.recurrences[0]!
    const after = replaceRecurrence(owned, 'r1', kept)
    expect(after.recurrences[0]).not.toHaveProperty('memberId')
    expect(after.recurrences[0]).not.toHaveProperty('shared')
    expect(after.recurrences[0]).not.toHaveProperty('note')
    expect(after.recurrences[0]?.id).toBe('r1')
  })
})

describe('entrées', () => {
  it('confirme une échéance', () => {
    const before = makeData({ entries: [makeEntry({ id: 'e1', date: '2026-07-01', status: 'planned' })] })
    expect(confirmEntry(before, 'e1').entries[0]?.status).toBe('confirmed')
  })

  it('confirme en bloc, sans toucher aux autres', () => {
    const before = makeData({
      entries: [
        makeEntry({ id: 'a', date: '2026-07-01', status: 'planned' }),
        makeEntry({ id: 'b', date: '2026-07-02', status: 'planned' }),
        makeEntry({ id: 'c', date: '2026-07-03', status: 'planned' }),
      ],
    })
    const after = confirmEntries(before, ['a', 'c'])
    expect(after.entries.map((e) => e.status)).toEqual(['confirmed', 'planned', 'confirmed'])
  })

  it('efface le membre vidé sans couper l’entrée de sa récurrence', () => {
    const before = makeData({
      entries: [
        makeEntry({ id: 'e1', recurrenceId: 'r1', date: '2026-07-05', memberId: 'm1', shared: false }),
      ],
    })
    const { id: _dropped, recurrenceId: _link, memberId: _m, shared: _s, ...kept } =
      before.entries[0]!
    const after = replaceEntry(before, 'e1', kept)
    expect(after.entries[0]).not.toHaveProperty('memberId')
    expect(after.entries[0]).not.toHaveProperty('shared')
    expect(after.entries[0]?.recurrenceId).toBe('r1')
  })

  it('ajoute une saisie ponctuelle', () => {
    const entry = makeEntry({ id: 'x', date: '2026-07-09', amount: eur(2350) })
    expect(addEntry(makeData(), entry).entries).toEqual([entry])
  })
})

describe('ouverture du mois', () => {
  const data = makeData({
    recurrences: [
      makeRecurrence({ id: 'loyer', amount: eur(95000), period: { unit: 'month', every: 1, anchorDay: 5 } }),
    ],
  })

  it('génère les échéances et enregistre l’ouverture', () => {
    const result = openMonth(data, '2026-07', sequentialIds(), '2026-07-01')
    expect(result.created).toBe(1)
    expect(result.data.entries).toHaveLength(1)
    expect(result.data.months).toEqual([{ ym: '2026-07', openedAt: '2026-07-01', closed: false }])
  })

  it('est rejouable sans rien dupliquer', () => {
    const once = openMonth(data, '2026-07', sequentialIds(), '2026-07-01')
    const twice = openMonth(once.data, '2026-07', sequentialIds(), '2026-07-20')
    expect(twice.created).toBe(0)
    expect(twice.data.entries).toHaveLength(1)
    expect(twice.data.months).toHaveLength(1)
    // La date d'ouverture d'origine n'est pas réécrite.
    expect(twice.data.months[0]?.openedAt).toBe('2026-07-01')
  })

  it('compte les échéances à montant variable', () => {
    const withVariable = makeData({
      recurrences: [
        makeRecurrence({ id: 'elec', amount: null, period: { unit: 'month', every: 1, anchorDay: 12 } }),
      ],
    })
    expect(openMonth(withVariable, '2026-07', sequentialIds()).variable).toBe(1)
  })

  it('ouvre un mois sans aucune échéance sans rien créer', () => {
    const result = openMonth(makeData(), '2026-07', sequentialIds(), '2026-07-01')
    expect(result.created).toBe(0)
    expect(result.data.months).toHaveLength(1)
  })
})

describe('réglages', () => {
  it('modifie un réglage sans écraser les autres', () => {
    const after = updateSettings(makeData(), { theme: 'dark' })
    expect(after.settings).toEqual({ theme: 'dark', currency: 'EUR', monthStartsOn: 1 })
  })
})

describe('synchronisation d’une récurrence', () => {
  /** Deux mois ouverts et un abonnement mensuel qui n'y a encore rien posé. */
  function twoOpenMonths() {
    return makeData({
      recurrences: [
        makeRecurrence({ id: 'r1', period: { unit: 'month', every: 1, anchorDay: 10 } }),
      ],
      months: [
        { ym: '2026-07', openedAt: '2026-07-01', closed: false },
        { ym: '2026-08', openedAt: '2026-08-01', closed: false },
      ],
    })
  }

  it('pose les échéances dans tous les mois ouverts à partir du mois courant', () => {
    const after = syncRecurrenceEntries(twoOpenMonths(), 'r1', sequentialIds(), '2026-07-15')
    expect(after.entries.map((e) => e.date)).toEqual(['2026-07-10', '2026-08-10'])
    expect(after.entries.every((e) => e.status === 'planned')).toBe(true)
  })

  it('ne remonte pas dans un mois antérieur au mois de référence', () => {
    const data = makeData({
      ...twoOpenMonths(),
      months: [
        { ym: '2026-05', openedAt: '2026-05-01', closed: false },
        { ym: '2026-08', openedAt: '2026-08-01', closed: false },
      ],
    })
    const after = syncRecurrenceEntries(data, 'r1', sequentialIds(), '2026-07-15')
    expect(after.entries.map((e) => e.date)).toEqual(['2026-08-10'])
  })

  it('refait les prévues à venir quand la règle change', () => {
    const before = syncRecurrenceEntries(twoOpenMonths(), 'r1', sequentialIds(), '2026-07-15')
    const moved = updateRecurrence(before, 'r1', {
      period: { unit: 'month', every: 1, anchorDay: 25 },
    })
    const after = syncRecurrenceEntries(moved, 'r1', sequentialIds('b'), '2026-07-15')
    expect(after.entries.map((e) => e.date)).toEqual(['2026-07-25', '2026-08-25'])
  })

  it('ne touche jamais une échéance confirmée', () => {
    const data = {
      ...twoOpenMonths(),
      entries: [
        makeEntry({ id: 'paid', recurrenceId: 'r1', date: '2026-07-10', status: 'confirmed' }),
      ],
    }
    const after = syncRecurrenceEntries(data, 'r1', sequentialIds(), '2026-07-15')
    expect(after.entries.find((e) => e.id === 'paid')).toBeDefined()
    // Juillet est déjà servi par l'échéance confirmée : rien n'y est ajouté.
    expect(after.entries.filter((e) => e.date.startsWith('2026-07'))).toHaveLength(1)
  })

  /** Confirmer d'avance dit qu'une échéance aura lieu, pas qu'elle a eu lieu. */
  describe('échéance confirmée d’avance', () => {
    const owned = () =>
      makeData({
        ...twoOpenMonths(),
        recurrences: [
          makeRecurrence({
            id: 'r1',
            memberId: 'm1',
            period: { unit: 'month', every: 1, anchorDay: 10 },
          }),
        ],
        entries: [
          makeEntry({
            id: 'juillet',
            recurrenceId: 'r1',
            date: '2026-07-10',
            status: 'confirmed',
            memberId: 'm1',
            amount: eur(1500),
          }),
          makeEntry({
            id: 'aout',
            recurrenceId: 'r1',
            date: '2026-08-10',
            status: 'confirmed',
            memberId: 'm1',
            amount: eur(1500),
          }),
        ],
      })

    it('suit la règle quand l’abonnement passe au foyer', () => {
      const { id: _dropped, memberId: _m, ...household } = owned().recurrences[0]!
      const moved = replaceRecurrence(owned(), 'r1', household)
      const after = syncRecurrenceEntries(moved, 'r1', sequentialIds(), '2026-07-15')

      expect(after.entries.find((e) => e.id === 'aout')).not.toHaveProperty('memberId')
      // Le passé, lui, ne se réécrit pas : juillet a eu lieu (cahier §3).
      expect(after.entries.find((e) => e.id === 'juillet')?.memberId).toBe('m1')
    })

    it('garde le montant et la date saisis à la main', () => {
      const { id: _dropped, ...rule } = owned().recurrences[0]!
      const relabelled = replaceRecurrence(owned(), 'r1', {
        ...rule,
        label: 'Nouveau nom',
        amount: eur(9900),
      })
      const after = syncRecurrenceEntries(relabelled, 'r1', sequentialIds(), '2026-07-15')
      const aout = after.entries.find((e) => e.id === 'aout')

      expect(aout?.label).toBe('Nouveau nom')
      expect(aout?.amount).toBe(eur(1500))
      expect(aout?.date).toBe('2026-08-10')
      expect(aout?.status).toBe('confirmed')
    })
  })

  it('est rejouable sans rien dupliquer', () => {
    const once = syncRecurrenceEntries(twoOpenMonths(), 'r1', sequentialIds(), '2026-07-15')
    const twice = syncRecurrenceEntries(once, 'r1', sequentialIds('b'), '2026-07-15')
    expect(twice.entries.map((e) => e.date)).toEqual(once.entries.map((e) => e.date))
  })

  it('laisse tranquilles les échéances des autres récurrences', () => {
    const data = {
      ...twoOpenMonths(),
      recurrences: [
        makeRecurrence({ id: 'r1', period: { unit: 'month', every: 1, anchorDay: 10 } }),
        makeRecurrence({ id: 'r2', period: { unit: 'month', every: 1, anchorDay: 20 } }),
      ],
      entries: [
        makeEntry({ id: 'autre', recurrenceId: 'r2', date: '2026-08-20', status: 'planned' }),
      ],
    }
    const after = syncRecurrenceEntries(data, 'r1', sequentialIds(), '2026-07-15')
    expect(after.entries.find((e) => e.id === 'autre')).toBeDefined()
  })
})
