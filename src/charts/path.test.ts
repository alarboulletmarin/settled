import { describe, expect, it } from 'vitest'
import { type Point, isolatedPoints, polylinePath } from './path'

const at = (x: number, y: number): Point => ({ x, y })

describe('polylinePath', () => {
  it('relie les points d’une série continue', () => {
    expect(polylinePath([at(0, 10), at(10, 20), at(20, 5)])).toBe('M 0 10 L 10 20 L 20 5')
  })

  /* La règle du cahier §4.7 appliquée au trait lui-même : une période sans
     donnée ne vaut pas zéro, le trait s'y coupe au lieu de plonger sur la ligne
     de base — ce qui se lirait comme un mois à zéro. */
  it('coupe le trait à chaque trou', () => {
    expect(polylinePath([at(0, 10), null, at(20, 5)])).toBe('M 0 10 M 20 5')
  })

  it('ne trace rien d’une série entièrement vide', () => {
    expect(polylinePath([null, null])).toBe('')
  })
})

describe('isolatedPoints', () => {
  /* Un point seul entre deux trous ne produit aucun segment : sans marqueur, le
     mois disparaîtrait du graphique alors qu'il porte une donnée. */
  it('retient le point isolé entre deux trous', () => {
    expect(isolatedPoints([null, at(10, 20), null])).toEqual([{ x: 10, y: 20 }])
  })

  it('ne retient pas un point qui a un voisin', () => {
    expect(isolatedPoints([at(0, 10), at(10, 20), null])).toEqual([])
  })

  /* Aux extrémités, l'absence de voisin hors série compte comme un trou : un
     seul mois chiffré sur douze doit se voir. */
  it('retient un point unique en tête de série', () => {
    expect(isolatedPoints([at(0, 10), null, null])).toEqual([{ x: 0, y: 10 }])
  })
})
