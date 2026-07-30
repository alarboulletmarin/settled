import { describe, expect, it } from 'vitest'
import {
  ZERO,
  abs,
  add,
  compare,
  divInt,
  isMoney,
  max,
  min,
  money,
  mulInt,
  neg,
  parseAmount,
  ratio,
  scale,
  sub,
  sum,
  toAmountInput,
} from './money'

describe('money — construction', () => {
  it('accepte un entier de centimes', () => {
    expect(money(1250)).toBe(1250)
    expect(money(-1250)).toBe(-1250)
    expect(money(0)).toBe(0)
  })

  it('refuse un flottant : aucun flottant ne touche un montant', () => {
    expect(() => money(12.5)).toThrow(TypeError)
    expect(() => money(0.1 + 0.2)).toThrow(TypeError)
  })

  it('refuse NaN et l’infini', () => {
    expect(() => money(Number.NaN)).toThrow(TypeError)
    expect(() => money(Number.POSITIVE_INFINITY)).toThrow(TypeError)
  })

  it('reconnaît ce qui peut être un Money', () => {
    expect(isMoney(1250)).toBe(true)
    expect(isMoney(12.5)).toBe(false)
    expect(isMoney('1250')).toBe(false)
    expect(isMoney(null)).toBe(false)
  })
})

describe('money — arithmétique', () => {
  it('additionne et soustrait sans perte', () => {
    expect(add(money(1010), money(2020))).toBe(3030)
    expect(sub(money(1010), money(2020))).toBe(-1010)
  })

  it('somme une liste vide à zéro', () => {
    expect(sum([])).toBe(ZERO)
  })

  it('somme sans dérive, là où des flottants dériveraient', () => {
    const cents = Array.from({ length: 10 }, () => money(10))
    expect(sum(cents)).toBe(100)
    // Les mêmes 0,10 € additionnés en flottant ne retombent pas sur 1 €.
    let drift = 0
    for (let i = 0; i < 10; i++) drift += 0.1
    expect(drift).not.toBe(1)
  })

  it('nie et prend la valeur absolue', () => {
    expect(neg(money(1250))).toBe(-1250)
    expect(neg(money(0))).toBe(0)
    expect(abs(money(-1250))).toBe(1250)
  })

  it('refuse un facteur fractionnaire', () => {
    expect(mulInt(money(1000), 3)).toBe(3000)
    expect(() => mulInt(money(1000), 1.2)).toThrow(TypeError)
  })
})

describe('money — division et amortissement', () => {
  it('arrondit au centime, la moitié s’éloignant de zéro', () => {
    expect(divInt(money(5), 2)).toBe(3)
    expect(divInt(money(-5), 2)).toBe(-3)
    expect(divInt(money(4), 2)).toBe(2)
  })

  it('amortit une annuelle au mois', () => {
    // 119,88 € par an → 9,99 € par mois, pile.
    expect(divInt(money(11988), 12)).toBe(999)
    // 100 € par an → 8,33 € par mois.
    expect(divInt(money(10000), 12)).toBe(833)
  })

  it('refuse un diviseur nul ou fractionnaire', () => {
    expect(() => divInt(money(1000), 0)).toThrow(TypeError)
    expect(() => divInt(money(1000), 2.5)).toThrow(TypeError)
  })

  it('applique un ratio entier sans jamais produire de flottant', () => {
    // 10 € par semaine → 43,33 € par mois (52 semaines sur 12 mois).
    expect(scale(money(1000), 52, 12)).toBe(4333)
    expect(Number.isInteger(scale(money(1000), 52, 12))).toBe(true)
  })

  it('refuse un dénominateur nul', () => {
    expect(() => scale(money(1000), 52, 0)).toThrow(TypeError)
  })
})

describe('money — comparaison', () => {
  it('compare, borne et calcule une part', () => {
    expect(compare(money(100), money(200))).toBeLessThan(0)
    expect(max(money(100), money(200))).toBe(200)
    expect(min(money(100), money(200))).toBe(100)
    expect(ratio(money(25), money(100))).toBe(0.25)
  })

  it('renvoie une part nulle plutôt que NaN sur un total à zéro', () => {
    expect(ratio(money(25), ZERO)).toBe(0)
  })
})

describe('money — saisie utilisateur', () => {
  it('lit les formes françaises et anglaises', () => {
    expect(parseAmount('12,50')).toBe(1250)
    expect(parseAmount('12.50')).toBe(1250)
    expect(parseAmount('12')).toBe(1200)
    expect(parseAmount('12,5')).toBe(1250)
    expect(parseAmount('1 234,56')).toBe(123456)
    expect(parseAmount('-12,50')).toBe(-1250)
    expect(parseAmount('0,01')).toBe(1)
  })

  it('rejette ce qui n’est pas un montant', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('douze')).toBeNull()
    expect(parseAmount('12,345')).toBeNull()
    expect(parseAmount('-')).toBeNull()
    expect(parseAmount('1,2,3')).toBeNull()
  })

  it('fait l’aller-retour avec le champ de saisie', () => {
    for (const value of [0, 1, 999, 1250, 123456, -1250]) {
      expect(parseAmount(toAmountInput(money(value)))).toBe(value)
    }
  })
})
