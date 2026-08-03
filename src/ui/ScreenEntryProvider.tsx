import { type ReactNode, useEffect, useRef, useState } from 'react'
import { type ScreenEntry, ScreenEntryContext } from './screenEntry'

/**
 * Marque le premier affichage d'un écran, pour ce qui ne doit s'y produire
 * qu'une fois — le comptage des nombres du DS §4.
 *
 * Le DS dit « au premier affichage d'un **écran** », et la nuance est tout le
 * sujet : posé dans `Amount`, le comptage suivait le premier affichage d'un
 * *composant*, ce qui n'est pas la même chose. Une tuile de la grille apparaît
 * et disparaît pour des raisons qui n'ont rien d'une arrivée — le filtre
 * « Commun » en retire cinq, « Reste à vivre » ne vit que sur le mois courant,
 * et une tuile de flux change d'élément HTML selon qu'elle est cliquable ou
 * non, ce qui la remonte. Chacune de ces bascules relançait le compteur des
 * tuiles remontées pendant que leurs voisines, restées en place, se contentaient
 * de changer de valeur. Ça se voyait exactement comme un défaut : sur un même
 * geste, le solde et les revenus s'égrenaient, les charges sautaient.
 *
 * **Doit vivre sous une clé qui change avec l'écran** — le `key={pathname}` du
 * `<main>` d'`AppShell`. C'est ce qui le remonte, et son remontage est la seule
 * définition d'« arrivée » qu'on ait.
 *
 * Les enfants lisent le drapeau pendant leur rendu, donc avant l'effet
 * ci-dessous : la lecture est juste sans qu'aucun ordre d'effets n'ait à être
 * supposé. Le nettoyage le remet, parce que `StrictMode` rejoue les effets au
 * montage — sans lui, le second passage laisserait l'écran croire qu'il est
 * déjà arrivé.
 */
export function ScreenEntryProvider({ children }: { children: ReactNode }) {
  const entering = useRef(true)
  /* `useState` plutôt qu'une seconde référence : il faut un objet stable *et*
     lisible au rendu, et une référence lue au rendu est précisément ce que le
     linter refuse — à raison, puisque la lire ne re-rend rien. Ici c'est voulu,
     et c'est la fermeture qui porte la lecture, pas le rendu du fournisseur. */
  const [api] = useState<ScreenEntry>(() => ({ isEntering: () => entering.current }))

  useEffect(() => {
    entering.current = false
    return () => {
      entering.current = true
    }
  }, [])

  return <ScreenEntryContext value={api}>{children}</ScreenEntryContext>
}
