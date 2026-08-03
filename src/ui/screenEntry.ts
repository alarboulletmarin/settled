import { createContext, use } from 'react'

/** Ce qu'un écran répond à « suis-je en train d'arriver ? ». */
export type ScreenEntry = { isEntering: () => boolean }

/* Hors de toute coquille — un test, le styleguide —, tout montage vaut une
   arrivée : c'est le comportement qu'on a quand personne ne dit le contraire. */
const ALWAYS: ScreenEntry = { isEntering: () => true }

export const ScreenEntryContext = createContext<ScreenEntry>(ALWAYS)

/**
 * Vrai tant que l'écran en est à son premier rendu — à ne lire qu'au montage.
 *
 * Une fonction et non une valeur : le drapeau tombe après le premier rendu, et
 * le passer par l'état ferait re-rendre tout l'écran à chaque navigation pour
 * n'afficher rien de différent. Ce qui le lit doit donc le figer chez lui, ce
 * que fait `useCountUp` en le retenant au montage.
 */
export function useIsScreenEntering(): boolean {
  return use(ScreenEntryContext).isEntering()
}
