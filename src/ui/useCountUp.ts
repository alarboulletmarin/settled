import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '@/lib/reveal'

/* DS §4 — 160ms pour un geste, 240 pour l'entrée d'une vue. Un chiffre qui
   s'égrène n'est ni l'un ni l'autre : à 160ms il clignote au lieu de compter.
   600, c'est la durée où on le lit monter sans attendre qu'il arrive. */
const DURATION = 600

/* Une sortie douce, et pas une entrée : un compteur qui démarre lentement donne
   l'impression d'un écran qui peine. Il part vite et se pose. */
const easeOut = (t: number): number => 1 - (1 - t) ** 3

/**
 * Un montant qui s'égrène de zéro jusqu'à sa valeur, **au premier affichage
 * seulement**.
 *
 * C'est la lettre du DS §4 : « les nombres s'animent en comptant uniquement au
 * premier affichage d'un écran, jamais sur mise à jour ». Le montage est ce
 * premier affichage, et la distinction n'a rien de théorique : changer de mois
 * ne démonte pas les tuiles du tableau de bord, il change leurs valeurs. Passer
 * de juin à juillet ne relance donc rien, et une confirmation d'échéance qui
 * fait bouger le solde le fait bouger d'un coup.
 *
 * Ce que l'état retient est **l'avancement, pas le montant**. Le montant s'en
 * déduit à chaque rendu, ce qui donne deux propriétés qu'un compteur de
 * centimes n'aurait pas : arrivé à un, c'est la cible elle-même qui est rendue,
 * jamais un arrondi qui laisserait « 1 234,99 € » pour toujours là où le mois
 * vaut 1 235 ; et une valeur qui change en cours de route est suivie sans
 * qu'aucun garde ait à le prévoir.
 *
 * La préférence de mouvement est lue au montage : c'est le seul instant où elle
 * décide de quelque chose ici, et s'y abonner relancerait une animation
 * terminée à chaque bascule du système.
 */
export function useCountUp(target: number, enabled = true): number {
  const animated = enabled && !prefersReducedMotion()
  const [progress, setProgress] = useState(animated ? 0 : 1)

  useEffect(() => {
    if (!animated) return undefined

    let frame = 0
    /* `null` et non zéro : `requestAnimationFrame` passe l'horloge du document,
       qui vaut justement zéro sur la toute première image d'une page. Avec zéro
       pour sentinelle, le départ se réancrait à chaque image et le compteur
       restait à zéro pour toujours. */
    let start: number | null = null
    const step = (now: number): void => {
      /* L'horloge part à la première image et non à l'effet : entre les deux,
         le navigateur peut avoir posé une longue tâche, et le compteur
         apparaîtrait alors déjà à mi-course. */
      start ??= now
      const elapsed = Math.min((now - start) / DURATION, 1)
      setProgress(elapsed)
      if (elapsed < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [animated])

  return progress >= 1 ? target : Math.round(target * easeOut(progress))
}
