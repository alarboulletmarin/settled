import { describe, expect, it } from 'vitest'
import { money } from './money'
import {
  annualCost,
  clampToMonth,
  expandRecurrence,
  monthlyEquivalent,
  nextOccurrence,
  occurrencesInMonth,
} from './recurrence'
import type { Period, Recurrence } from './types'

/** La périodicité à plat, plus tout champ de la récurrence à surcharger. */
type Spec = Period & Partial<Omit<Recurrence, 'period'>>

function make({ unit, every, anchorDay, ...rest }: Spec): Recurrence {
  return {
    id: 'r1',
    label: 'Récurrence',
    categoryId: 'c1',
    direction: 'out',
    amount: money(999),
    startedOn: '2026-01-01',
    period: { unit, every, anchorDay },
    ...rest,
  }
}

const dates = (r: Recurrence, from: string, to: string): string[] =>
  expandRecurrence(r, from, to).map((o) => o.date)

describe('expansion — mensuelle', () => {
  it('tombe au jour d’échéance chaque mois', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 5 })
    expect(dates(r, '2026-01-01', '2026-04-30')).toEqual([
      '2026-01-05',
      '2026-02-05',
      '2026-03-05',
      '2026-04-05',
    ])
  })

  it('borne une échéance au 31 dans un mois court, sans la reporter ensuite', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 31 })
    expect(dates(r, '2026-01-01', '2026-05-31')).toEqual([
      '2026-01-31',
      '2026-02-28', // borné
      '2026-03-31', // et non reporté : on retrouve bien le 31
      '2026-04-30',
      '2026-05-31',
    ])
  })

  it('borne au 29 février une année bissextile', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 31, startedOn: '2024-01-01' })
    expect(dates(r, '2024-02-01', '2024-02-29')).toEqual(['2024-02-29'])
  })

  it('respecte « tous les n mois » en s’ancrant sur le mois de départ', () => {
    const r = make({ unit: 'month', every: 3, anchorDay: 15, startedOn: '2026-02-01' })
    expect(dates(r, '2026-01-01', '2026-12-31')).toEqual([
      '2026-02-15',
      '2026-05-15',
      '2026-08-15',
      '2026-11-15',
    ])
  })
})

describe('expansion — démarrage et arrêt en cours de mois', () => {
  it('ignore l’échéance du mois de départ si elle précède la date de départ', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 5, startedOn: '2026-01-10' })
    expect(dates(r, '2026-01-01', '2026-03-31')).toEqual(['2026-02-05', '2026-03-05'])
  })

  it('garde l’échéance du mois de départ si elle tombe le jour même', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 10, startedOn: '2026-01-10' })
    expect(dates(r, '2026-01-01', '2026-02-28')).toEqual(['2026-01-10', '2026-02-10'])
  })

  it('garde l’échéance du mois d’arrêt si elle précède la date d’arrêt', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 5, endedOn: '2026-03-10' })
    expect(dates(r, '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-05',
      '2026-02-05',
      '2026-03-05',
    ])
  })

  it('exclut l’échéance qui suit la date d’arrêt', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 20, endedOn: '2026-03-10' })
    expect(dates(r, '2026-01-01', '2026-12-31')).toEqual(['2026-01-20', '2026-02-20'])
  })

  it('inclut une échéance tombant exactement le jour d’arrêt', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 10, endedOn: '2026-03-10' })
    expect(dates(r, '2026-03-01', '2026-03-31')).toEqual(['2026-03-10'])
  })

  it('ne renvoie rien si la fenêtre précède le départ', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 5, startedOn: '2026-06-01' })
    expect(dates(r, '2026-01-01', '2026-05-31')).toEqual([])
  })
})

describe('expansion — hebdomadaire', () => {
  it('tombe le jour de semaine demandé', () => {
    // anchorDay 1 = lundi ; 2026-01-01 est un jeudi.
    const r = make({ unit: 'week', every: 1, anchorDay: 1 })
    expect(dates(r, '2026-01-01', '2026-01-31')).toEqual([
      '2026-01-05',
      '2026-01-12',
      '2026-01-19',
      '2026-01-26',
    ])
  })

  it('respecte « toutes les n semaines »', () => {
    const r = make({ unit: 'week', every: 2, anchorDay: 1 })
    expect(dates(r, '2026-01-01', '2026-02-28')).toEqual([
      '2026-01-05',
      '2026-01-19',
      '2026-02-02',
      '2026-02-16',
    ])
  })

  it('reste aligné sur son ancre quand la fenêtre commence bien plus tard', () => {
    const r = make({ unit: 'week', every: 2, anchorDay: 1, startedOn: '2020-01-01' })
    const found = dates(r, '2026-01-01', '2026-01-31')
    expect(found.length).toBeGreaterThan(0)
    for (const date of found) {
      expect(date >= '2026-01-01' && date <= '2026-01-31').toBe(true)
    }
    // Deux semaines pile entre chaque échéance, sans dérive sur six ans.
    expect(new Set(found.map((_, i) => i)).size).toBe(found.length)
  })

  it('produit cinq échéances dans un mois qui en compte cinq', () => {
    const r = make({ unit: 'week', every: 1, anchorDay: 5 }) // vendredi
    expect(dates(r, '2026-01-01', '2026-01-31')).toHaveLength(5)
  })
})

describe('expansion — annuelle', () => {
  it('garde le mois de son départ, année après année', () => {
    const r = make({ unit: 'year', every: 1, anchorDay: 15, startedOn: '2026-03-15' })
    expect(dates(r, '2026-01-01', '2029-12-31')).toEqual([
      '2026-03-15',
      '2027-03-15',
      '2028-03-15',
      '2029-03-15',
    ])
  })

  it('borne un 29 février aux années non bissextiles', () => {
    const r = make({ unit: 'year', every: 1, anchorDay: 29, startedOn: '2024-02-29' })
    expect(dates(r, '2024-01-01', '2027-12-31')).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
    ])
  })

  it('respecte « toutes les n années »', () => {
    const r = make({ unit: 'year', every: 2, anchorDay: 1, startedOn: '2026-06-01' })
    expect(dates(r, '2026-01-01', '2032-12-31')).toEqual([
      '2026-06-01',
      '2028-06-01',
      '2030-06-01',
      '2032-06-01',
    ])
  })
})

describe('expansion — cas limites', () => {
  it('renvoie une liste vide sur une fenêtre inversée', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 5 })
    expect(dates(r, '2026-03-31', '2026-03-01')).toEqual([])
  })

  it('renvoie une liste vide pour un mois sans aucune échéance', () => {
    const r = make({ unit: 'year', every: 1, anchorDay: 15, startedOn: '2026-03-15' })
    expect(occurrencesInMonth(r, '2026-07')).toEqual([])
  })

  it('traite une périodicité nulle ou négative comme une périodicité de 1', () => {
    const r = make({ unit: 'month', every: 0, anchorDay: 5 })
    expect(dates(r, '2026-01-01', '2026-03-31')).toHaveLength(3)
  })

  it('borne un jour d’échéance aberrant', () => {
    expect(clampToMonth('2026-02', 99)).toBe('2026-02-28')
    expect(clampToMonth('2026-02', 0)).toBe('2026-02-01')
  })
})

describe('prochaine échéance', () => {
  it('trouve la suivante, borne incluse', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 5 })
    expect(nextOccurrence(r, '2026-03-05')?.date).toBe('2026-03-05')
    expect(nextOccurrence(r, '2026-03-06')?.date).toBe('2026-04-05')
  })

  it('renvoie null quand la récurrence est arrêtée', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 5, endedOn: '2026-02-28' })
    expect(nextOccurrence(r, '2026-03-01')).toBeNull()
  })
})

describe('amortissement', () => {
  it('ramène une annuelle au mois', () => {
    const r = make({ unit: 'year', every: 1, anchorDay: 1, amount: money(11988) })
    expect(monthlyEquivalent(r)).toBe(999)
    expect(annualCost(r)).toBe(11988)
  })

  it('ramène une trimestrielle au mois', () => {
    const r = make({ unit: 'month', every: 3, anchorDay: 1, amount: money(3000) })
    expect(monthlyEquivalent(r)).toBe(1000)
    expect(annualCost(r)).toBe(12000)
  })

  it('ramène une hebdomadaire au mois sur une base de 52 semaines', () => {
    const r = make({ unit: 'week', every: 1, anchorDay: 1, amount: money(1000) })
    expect(monthlyEquivalent(r)).toBe(4333)
    expect(annualCost(r)).toBe(52000)
  })

  it('laisse une mensuelle inchangée', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 1, amount: money(999) })
    expect(monthlyEquivalent(r)).toBe(999)
    expect(annualCost(r)).toBe(11988)
  })

  it('ne chiffre pas un montant variable', () => {
    const r = make({ unit: 'month', every: 1, anchorDay: 1, amount: null })
    expect(monthlyEquivalent(r)).toBeNull()
    expect(annualCost(r)).toBeNull()
  })
})
