import { useEffect, useRef } from 'react'

/** Ce qu'une touche déclenche, indexé par `KeyboardEvent.key`. */
export type Hotkeys = Record<string, (() => void) | undefined>

/**
 * Vrai quand la frappe appartient à un champ.
 *
 * Sans ce garde, taper « nouveau » dans un libellé partirait créer une dépense
 * à la première lettre, et corriger un montant au curseur changerait de mois.
 */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA'
}

/**
 * Des raccourcis clavier, et le seul endroit qui décide quand ils se taisent.
 *
 * L'app n'en avait aucun — pas un `keydown`, pas un `.focus()`. Ceux-ci sont
 * les trois qui rendent le plus : changer de mois, saisir une dépense, refermer
 * ce qu'on vient d'ouvrir.
 *
 * Trois conditions les font taire, et elles comptent autant que les raccourcis
 * eux-mêmes :
 *
 * — **On tape.** Voir `isTyping`.
 * — **Un modificateur est enfoncé.** `Ctrl+N` ouvre une fenêtre, `⌘←` remonte
 *   dans l'historique du navigateur : ces gestes-là ne nous appartiennent pas,
 *   et les intercepter casserait ce que la personne croyait faire.
 * — **Une feuille est ouverte.** Un `<dialog>` modal capte le focus mais pas
 *   les écouteurs de `window` : sans ce garde, « n » posé pendant une question
 *   de confirmation partirait créer une dépense derrière la boîte, qui resterait
 *   ouverte sur un écran qui a changé.
 * — **La frappe a déjà été consommée.** Un composant qui répond aux flèches
 *   pour son compte — le curseur d'un graphique — appelle `preventDefault`, et
 *   ce raccourci-ci s'efface plutôt que de faire la même touche deux fois, à
 *   deux étages.
 *
 * L'écouteur est posé une fois pour toutes ; les gestes sont relus dans une
 * référence, sans quoi chaque rendu le retirerait pour le reposer.
 */
export function useHotkeys(keys: Hotkeys): void {
  const latest = useRef(keys)

  /* Mis à jour après le rendu, jamais pendant : une référence écrite en plein
     rendu se lit différemment selon que React l'a rejoué ou non. L'effet sans
     dépendances part à chaque rendu, ce qui est exactement ce qu'on veut — il
     ne fait que recopier une valeur. */
  useEffect(() => {
    latest.current = keys
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) return
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (isTyping(event.target)) return
      if (document.querySelector('dialog[open]') !== null) return

      const run = latest.current[event.key]
      if (run === undefined) return
      event.preventDefault()
      run()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
