import { describe, expect, it } from 'vitest'
import { makeEntry, makeRecurrence } from './fixtures'
import {
  isSearchable,
  matchesText,
  normalizeText,
  searchEntries,
  searchRecurrences,
} from './search'

const monthly = { unit: 'month' as const, every: 1, anchorDay: 5 }

describe('normalizeText', () => {
  it('met la casse et les accents de côté', () => {
    // On ne tape pas ses accents dans un champ de recherche, surtout au pouce.
    expect(normalizeText('Énergies')).toBe('energies')
    expect(normalizeText('  Péages  ')).toBe('peages')
    expect(normalizeText('Coiffure et hygiène')).toBe('coiffure et hygiene')
  })
})

describe('matchesText', () => {
  it('apparie une sous-chaîne, pas seulement un début de mot', () => {
    expect(matchesText('Prélèvement EDF', 'edf')).toBe(true)
    expect(matchesText('Énergies (électricité, gaz, eau)', 'electricite')).toBe(true)
    expect(matchesText('Loyer', 'courses')).toBe(false)
  })
})

describe('isSearchable', () => {
  it('refuse une requête trop courte pour réduire quoi que ce soit', () => {
    expect(isSearchable('a')).toBe(false)
    expect(isSearchable('  e  ')).toBe(false)
    expect(isSearchable('ed')).toBe(true)
  })
})

describe('searchEntries', () => {
  const entries = [
    makeEntry({ id: 'e-mars', date: '2026-03-05', label: 'Prélèvement EDF' }),
    makeEntry({ id: 'e-juillet', date: '2026-07-05', label: 'Prélèvement EDF' }),
    makeEntry({ id: 'e-courses', date: '2026-05-12', label: 'Courses' }),
  ]

  it('ne rend rien tant que la requête est trop courte', () => {
    expect(searchEntries(entries, 'e', 10).items).toEqual([])
  })

  it('rend la plus récente d’abord — on remonte le temps, on ne le descend pas', () => {
    const found = searchEntries(entries, 'prelevement', 10)
    expect(found.items.map((e) => e.date)).toEqual(['2026-07-05', '2026-03-05'])
    expect(found.hidden).toBe(0)
  })

  it('dit ce que la limite laisse de côté plutôt que de le taire', () => {
    const found = searchEntries(entries, 'prelevement', 1)
    expect(found.items).toHaveLength(1)
    expect(found.hidden).toBe(1)
  })

  it('cherche tous mois confondus', () => {
    // Le point de la recherche : « ce prélèvement de mars » se trouvait en
    // naviguant mois par mois, ou pas du tout.
    expect(searchEntries(entries, 'courses', 10).items.map((e) => e.date)).toEqual(['2026-05-12'])
  })
})

describe('searchRecurrences', () => {
  const recurrences = [
    makeRecurrence({ id: 'r-2', label: 'Netflix', period: monthly }),
    makeRecurrence({ id: 'r-1', label: 'Assurance auto', period: monthly }),
    makeRecurrence({ id: 'r-3', label: 'Assurance habitation', period: monthly }),
  ]

  it('range par libellé, à la française', () => {
    const found = searchRecurrences(recurrences, 'assurance', 10)
    expect(found.items.map((r) => r.label)).toEqual(['Assurance auto', 'Assurance habitation'])
  })

  it('ne trouve rien quand rien n’apparie', () => {
    expect(searchRecurrences(recurrences, 'loyer', 10).items).toEqual([])
  })
})
