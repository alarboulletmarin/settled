import type { CategoryKind, Direction } from '@/domain/types'

/**
 * Les natures proposées pour un sens de trésorerie donné.
 *
 * Une sortie n'est pas forcément une charge : rembourser un crédit et verser
 * sur un livret sortent du compte tout autant. Les trois natures sont donc
 * offertes ensemble, et c'est la famille choisie qui tranche.
 */
export function kindsOfDirection(direction: Direction): readonly CategoryKind[] {
  return direction === 'in' ? ['resource'] : ['charge', 'debt', 'saving']
}
