import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  addMonthsToYm,
  compareISO,
  dayOfWeek,
  daysInMonth,
  daysOfMonth,
  diffDays,
  diffMonths,
  endOfMonth,
  fromEpochDay,
  isLeapYear,
  isValidISO,
  isValidYm,
  isWithin,
  monthRange,
  parseISO,
  startOfMonth,
  toEpochDay,
  toISO,
  ym,
  ymOf,
} from './date'

describe('date — calendrier', () => {
  it('connaît les années bissextiles, y compris la règle séculaire', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2025)).toBe(false)
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2000)).toBe(true)
  })

  it('donne la longueur des mois à 28, 29, 30 et 31 jours', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2026, 4)).toBe(30)
    expect(daysInMonth(2026, 7)).toBe(31)
  })

  it('valide une date ISO, et rejette un 31 dans un mois court', () => {
    expect(isValidISO('2026-07-31')).toBe(true)
    expect(isValidISO('2026-02-29')).toBe(false)
    expect(isValidISO('2024-02-29')).toBe(true)
    expect(isValidISO('2026-13-01')).toBe(false)
    expect(isValidISO('2026-7-1')).toBe(false)
    expect(isValidISO('pas une date')).toBe(false)
  })
})

describe('date — arithmétique civile', () => {
  it('fait l’aller-retour par le jour d’époque', () => {
    for (const iso of ['1970-01-01', '2000-02-29', '2026-07-30', '2100-03-01']) {
      expect(fromEpochDay(toEpochDay(iso))).toBe(iso)
    }
  })

  it('cale le jour d’époque sur son origine', () => {
    expect(toEpochDay('1970-01-01')).toBe(0)
    expect(toEpochDay('1969-12-31')).toBe(-1)
  })

  it('ajoute des jours à travers un changement de mois et d’année', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29')
  })

  it('ne dérive jamais d’un jour, quel que soit le fuseau', () => {
    // Le calcul est purement civil : aucun passage par un instant UTC.
    for (let i = 0; i < 400; i++) {
      const forward = addDays('2026-01-01', i)
      expect(diffDays('2026-01-01', forward)).toBe(i)
    }
  })

  it('borne au dernier jour du mois quand on ajoute un mois', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
    expect(addMonths('2026-05-31', 1)).toBe('2026-06-30')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
  })

  it('compte les jours entre deux dates, dans les deux sens', () => {
    expect(diffDays('2026-07-01', '2026-07-31')).toBe(30)
    expect(diffDays('2026-07-31', '2026-07-01')).toBe(-30)
    expect(diffDays('2026-07-01', '2026-07-01')).toBe(0)
  })
})

describe('date — jour de la semaine', () => {
  it('numérote de 1 (lundi) à 7 (dimanche)', () => {
    // 2026-07-30 est un jeudi.
    expect(dayOfWeek('2026-07-30')).toBe(4)
    expect(dayOfWeek('2026-08-03')).toBe(1)
    expect(dayOfWeek('2026-08-02')).toBe(7)
  })

  it('reste dans [1, 7] avant l’époque', () => {
    for (let i = -400; i < 0; i++) {
      const day = dayOfWeek(addDays('1970-01-01', i))
      expect(day).toBeGreaterThanOrEqual(1)
      expect(day).toBeLessThanOrEqual(7)
    }
  })
})

describe('date — mois', () => {
  it('extrait, construit et valide un mois', () => {
    expect(ymOf('2026-07-30')).toBe('2026-07')
    expect(ym(2026, 7)).toBe('2026-07')
    expect(isValidYm('2026-07')).toBe(true)
    expect(isValidYm('2026-13')).toBe(false)
  })

  it('borne le mois à ses extrémités', () => {
    expect(startOfMonth('2026-02')).toBe('2026-02-01')
    expect(endOfMonth('2026-02')).toBe('2026-02-28')
    expect(endOfMonth('2024-02')).toBe('2024-02-29')
    expect(endOfMonth('2026-04')).toBe('2026-04-30')
  })

  it('décale un mois en franchissant l’année', () => {
    expect(addMonthsToYm('2026-12', 1)).toBe('2027-01')
    expect(addMonthsToYm('2026-01', -1)).toBe('2025-12')
    expect(addMonthsToYm('2026-07', 12)).toBe('2027-07')
  })

  it('compte les mois, dans les deux sens', () => {
    expect(diffMonths('2026-01', '2026-12')).toBe(11)
    expect(diffMonths('2026-12', '2026-01')).toBe(-11)
    expect(diffMonths('2025-11', '2026-02')).toBe(3)
  })

  it('énumère une suite de mois sans trou', () => {
    expect(monthRange('2026-11', '2027-02')).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ])
    expect(monthRange('2026-07', '2026-07')).toEqual(['2026-07'])
    expect(monthRange('2026-07', '2026-06')).toEqual([])
  })

  it('énumère les jours d’un mois court comme d’un mois long', () => {
    expect(daysOfMonth('2026-02')).toHaveLength(28)
    expect(daysOfMonth('2024-02')).toHaveLength(29)
    expect(daysOfMonth('2026-07')).toHaveLength(31)
    expect(daysOfMonth('2026-02').at(-1)).toBe('2026-02-28')
  })
})

describe('date — comparaisons', () => {
  it('compare lexicographiquement, ce qui suffit en ISO', () => {
    expect(compareISO('2026-07-01', '2026-07-02')).toBe(-1)
    expect(compareISO('2026-07-02', '2026-07-01')).toBe(1)
    expect(compareISO('2026-07-01', '2026-07-01')).toBe(0)
  })

  it('teste l’appartenance à un intervalle, bornes incluses', () => {
    expect(isWithin('2026-07-01', '2026-07-01', '2026-07-31')).toBe(true)
    expect(isWithin('2026-07-31', '2026-07-01', '2026-07-31')).toBe(true)
    expect(isWithin('2026-08-01', '2026-07-01', '2026-07-31')).toBe(false)
  })

  it('parse en composantes', () => {
    expect(parseISO('2026-07-30')).toEqual({ y: 2026, m: 7, d: 30 })
    expect(() => parseISO('30/07/2026')).toThrow(TypeError)
  })

  it('formate avec zéros de tête', () => {
    expect(toISO(2026, 7, 3)).toBe('2026-07-03')
  })
})
