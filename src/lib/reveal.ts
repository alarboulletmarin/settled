/**
 * Amène un élément en haut de la zone visible.
 *
 * L'animation se décide ici et non en CSS : l'option `behavior` de
 * `scrollIntoView` l'emporte sur la propriété `scroll-behavior`, et le
 * `!important` que `base.css` pose sous `prefers-reduced-motion` ne suffit donc
 * pas à la neutraliser (DS §4). La préférence se relit à chaque appel — elle
 * peut changer sans que la page soit rechargée.
 */
export function reveal(element: Element | null): void {
  if (element === null) return
  element.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

/**
 * Ramène la page en haut.
 *
 * C'est ce qu'on attend d'un onglet, qu'on y soit déjà ou non : le logo d'un
 * site renvoie à l'accueil, et l'onglet actif à la tête de sa section. Sans
 * ça, revenir sur « Le mois » depuis le calendrier rouvrait l'écran là où on
 * l'avait quitté, à mi-liste — et retoucher l'onglet ne faisait rien du tout.
 *
 * C'est le document qui défile, pas `<main>` : la coquille ne pose aucun
 * conteneur de défilement, et la barre d'onglets est en `fixed`.
 *
 * La préférence de mouvement se relit ici pour la raison qui la fait relire
 * dans `reveal` — l'option `behavior` l'emporte sur la propriété CSS.
 */
export function scrollToTop(): void {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
