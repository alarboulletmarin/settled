import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'

/**
 * Au-delà, le doigt a dit « referme » ; en deçà, la feuille remonte à sa place.
 *
 * 96px, et non un pourcentage de la hauteur : une feuille d'un jour vide fait
 * trois cents pixels et une feuille pleine sept cents, et un seuil relatif
 * ferait dire deux choses différentes au même geste, sur le même composant.
 *
 * C'est la hauteur de la zone de prise — poignée et en-tête —, arrondie au pas
 * de l'échelle : on referme quand on a tiré la prise au-delà d'elle-même. La
 * règle vaut déjà pour les deux autres gestes de l'app, dont les seuils sont la
 * hauteur de ce qu'ils déplacent : 56 pour le bandeau d'export, 48 pour le mois.
 */
const THRESHOLD = 96

/**
 * L'autre porte, et pas un raffinement : sans elle, chasser la feuille d'un
 * coup de pouce — le geste naturel — ne ferait rien du tout.
 *
 * La vitesse se mesure sur une fenêtre d'au moins 60ms, jamais sur les deux
 * dernières frames : un doigt qui s'arrête avant de se lever y aurait une
 * vitesse nulle, et un doigt qui tremble une vitesse énorme. Les 24px évitent
 * qu'une secousse sur place referme la feuille.
 */
const FLING = 0.5
const FLING_MIN = 24
const SAMPLE_MS = 60

/**
 * Le pendant en JS du `sm:` de `Sheet` : au-delà, la feuille est une boîte
 * centrée, et tirer une boîte vers le bas ne veut rien dire.
 *
 * Une requête média CSS ne peut pas retirer un gestionnaire d'événement, et
 * lire le `display` calculé de la poignée ne marcherait qu'avec la feuille de
 * style — que les tests n'ont pas (`vite.config.ts`, `test.css: false`). Les
 * deux valeurs sont donc à tenir ensemble à la main, faute d'un module de
 * points de rupture ; en inventer un pour un seul appelant coûterait plus qu'il
 * ne rapporte.
 */
const CENTERED = '(min-width: 640px)'

export type SheetDrag = {
  /** Le geste est-il en vigueur ici et maintenant. */
  live: boolean
  /** Ce que le doigt a parcouru vers le bas, en pixels. */
  offset: number
  dragging: boolean
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
  }
}

/**
 * Tirer une feuille montante vers le bas pour la refermer.
 *
 * Le geste vit sur la zone de prise — la poignée et l'en-tête —, jamais sur le
 * corps : celui-ci défile, et `touch-action` ne peut pas servir un défilement
 * et un glissement sur le même élément. Le contourner demanderait un verrou de
 * défilement écrit à la main, c'est-à-dire exactement ce que `<dialog>` évite
 * d'écrire.
 *
 * Sous `prefers-reduced-motion`, le geste reste vivant : la manipulation
 * directe n'est pas une animation, c'est le doigt qui la conduit. Seul le
 * retour élastique du relâchement est neutralisé, par le token de durée.
 */
export function useSheetDrag({
  open,
  onClose,
  enabled,
}: {
  open: boolean
  onClose: () => void
  enabled: boolean
}): SheetDrag {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [centered, setCentered] = useState(false)
  const from = useRef<{ y: number; id: number } | null>(null)
  const sample = useRef<{ y: number; t: number }>({ y: 0, t: 0 })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(CENTERED)
    const read = (): void => {
      setCentered(media.matches)
    }
    read()
    media.addEventListener('change', read)
    return () => {
      media.removeEventListener('change', read)
    }
  }, [])

  const live = enabled && !centered

  /* Le glissement ne se défait pas en déclenchant la fermeture : la feuille
     sort par où le doigt l'a laissée, et c'est à la réouverture qu'elle
     retrouve sa place. Ajusté au rendu et non dans un effet, comme les portes
     de saisie — un effet montrerait une frame de la transformation d'avant,
     celle-là même où l'animation d'entrée démarre. */
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setOffset(0)
      setDragging(false)
    }
  }

  /* `from` n'est pas remis à zéro ici, et ce n'est pas un oubli : il appartient
     aux gestionnaires, qui sont les seuls à savoir de quel pointeur ils
     parlent. `onPointerDown` l'écrase, `onPointerUp` et `onPointerCancel` le
     vident, et les deux autres refusent tout pointeur qui n'est pas le leur —
     une valeur restée là ne peut donc rien conduire. */

  const end = (event: ReactPointerEvent<HTMLElement>): void => {
    const start = from.current
    if (start === null || start.id !== event.pointerId) return
    from.current = null
    setDragging(false)

    const elapsed = event.timeStamp - sample.current.t
    const speed = elapsed > 0 ? (event.clientY - sample.current.y) / elapsed : 0
    if (offset >= THRESHOLD || (speed > FLING && offset >= FLING_MIN)) onClose()
    else setOffset(0)
  }

  return {
    live,
    offset,
    dragging,
    handlers: {
      onPointerDown: (event) => {
        if (!live) return
        /* Le geste ne part jamais d'un bouton : la croix vit dans la zone de
           prise, et la viser sous une capture attraperait le glissement au lieu
           du clic — c'est le piège que `MonthNav` documente déjà. */
        if ((event.target as HTMLElement).closest('button, a, input, select')) return
        from.current = { y: event.clientY, id: event.pointerId }
        sample.current = { y: event.clientY, t: event.timeStamp }
        setDragging(true)
        // La capture rend le relâchement à la zone de prise, même sorti d'elle.
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove: (event) => {
        const start = from.current
        if (start === null || start.id !== event.pointerId) return
        /* Vers le bas seulement. La feuille est collée au bord bas de l'écran :
           la tirer vers le haut ouvrirait une bande de fond sous elle. */
        setOffset(Math.max(0, event.clientY - start.y))
        if (event.timeStamp - sample.current.t >= SAMPLE_MS) {
          sample.current = { y: event.clientY, t: event.timeStamp }
        }
      },
      onPointerUp: end,
      onPointerCancel: end,
    },
  }
}
