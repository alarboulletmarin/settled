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

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
