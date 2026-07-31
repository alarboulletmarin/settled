import type { CategoryKind, Direction } from '@/domain/types'

/**
 * Les natures proposées pour un sens de trésorerie donné.
 *
 * L'épargne n'y est plus, et c'est tout le propos : verser sur un livret sort
 * du compte, donc se saisissait par « Ajouter une dépense », et il fallait
 * aller chercher « Livrets » au milieu des courses et du carburant. Le geste
 * était juste en trésorerie et faux pour qui le fait — on ne dépense pas son
 * épargne, on la déplace. Elle a désormais sa propre position dans la saisie,
 * et cette liste-ci ne parle plus que de ce qu'on paie et de ce qu'on gagne.
 */
export function kindsOfDirection(direction: Direction): readonly CategoryKind[] {
  return direction === 'in' ? ['resource'] : ['charge', 'debt']
}

/** Les supports d'épargne, et rien d'autre. */
export const SAVING_KINDS: readonly CategoryKind[] = ['saving']

/**
 * Ce qu'une saisie enregistre, du point de vue de qui la fait.
 *
 * Le modèle n'a que deux sens — l'argent entre ou il sort — et c'est juste : un
 * virement d'épargne sort bien du compte. Mais deux sens ne suffisent pas à
 * dire ce qu'on fait, parce qu'un virement d'épargne et un plein d'essence
 * sortent tous les deux sans se ressembler. Le sens reste au modèle ; l'écran,
 * lui, demande la nature, et en déduit le sens.
 */
export type EntryNature = 'expense' | 'income' | 'saving'

/** Les natures de catégories qu'une nature de saisie autorise. */
export function kindsOfNature(nature: EntryNature): readonly CategoryKind[] {
  if (nature === 'saving') return SAVING_KINDS
  return kindsOfDirection(nature === 'income' ? 'in' : 'out')
}
