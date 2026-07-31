import { describe, expect, it } from 'vitest'
import { money } from '@/domain/money'
import { formatMoney, moneyParts } from './format'

/* Les espaces de la mise en forme française sont insécables : les tests les
   normalisent plutôt que de les recopier, sans quoi ils passent ou échouent
   selon le caractère qu'a laissé l'éditeur. */
const plain = (text: string): string => text.replace(/[\u00A0\u202F]/g, ' ')

describe('mise en forme d’un montant', () => {
  it('rend les centimes à part, pour que le DS puisse les réduire', () => {
    const parts = moneyParts(money(128_450), 'EUR')
    expect(plain(parts.integer)).toBe('1 284')
    expect(parts.fraction).toBe('50')
  })

  it('porte le signe négatif, jamais le positif', () => {
    expect(moneyParts(money(-4_290), 'EUR').sign).toBe('−')
    expect(moneyParts(money(4_290), 'EUR').sign).toBe('')
  })

  it('écrit un montant complet', () => {
    expect(plain(formatMoney(money(206_690), 'EUR'))).toBe('2 066,90 €')
  })

  /* Tronquer ferait lire « reste 56 € à payer » sur 56,69 € — une erreur
     systématiquement en faveur de qui la lit. */
  it('arrondit l’unité quand les centimes ne s’affichent pas', () => {
    expect(plain(formatMoney(money(5_669), 'EUR', false))).toBe('57 €')
    expect(plain(formatMoney(money(5_620), 'EUR', false))).toBe('56 €')
    expect(plain(formatMoney(money(5_650), 'EUR', false))).toBe('57 €')
  })

  it('arrondit de la même façon de part et d’autre de zéro', () => {
    expect(plain(formatMoney(money(-5_669), 'EUR', false))).toBe('−57 €')
  })

  it('n’arrondit pas l’unité tant que les centimes s’affichent', () => {
    expect(plain(formatMoney(money(5_669), 'EUR'))).toBe('56,69 €')
  })
})
