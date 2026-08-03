import { type ChangeEvent, type KeyboardEvent, useState } from 'react'

export type DraftFieldProps = {
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
}

/**
 * Un champ qu'on corrige sur place, dont seul le résultat s'enregistre.
 *
 * Les renommages écrivaient à chaque frappe : taper « Carburant » posait neuf
 * mutations du document, donc neuf `Data` neufs, neuf rendus de tout ce qui
 * lit le store, et neuf écritures programmées. Le writer les regroupait bien
 * en une ou deux, mais il n'avait rien à regrouper — huit d'entre elles
 * portaient un mot inachevé que personne ne voulait enregistrer.
 *
 * La frappe reste donc locale et part à la sortie du champ. C'est déjà la
 * règle de tous les formulaires de l'app — `EntryPage`, les récurrences, les
 * crédits tiennent leur saisie en état local et n'écrivent qu'à
 * l'enregistrement : les renommages en ligne étaient l'exception, pas le
 * modèle. Ce qu'on perd en fermant l'onglet au milieu d'un mot est donc
 * exactement ce que perd déjà n'importe quel autre champ de l'app.
 *
 * Entrée vaut sortie du champ, pour qui ne quitte pas le clavier : ces champs
 * ne sont dans aucun formulaire, la touche n'y avait donc rien à valider.
 *
 * Le texte peut aussi changer sans passer par le champ — un import, une remise
 * à zéro, un onglet voisin. Il est alors repris au rendu, comme le fait déjà la
 * liste du mois quand son axe cesse d'être proposé : React relance aussitôt, et
 * rien ne s'affiche entre les deux.
 */
export function useDraftField(
  value: string,
  commit: (next: string) => void,
  /**
   * Refuser le vide laisse quand même effacer pour retaper — sans quoi on ne
   * pourrait pas corriger —, mais garde la dernière valeur valide. C'est le cas
   * d'un prénom : vidé, il laisserait une ligne blanche dont le bouton de
   * retrait s'annoncerait « Retirer  ».
   */
  { allowEmpty = true }: { allowEmpty?: boolean } = {},
): DraftFieldProps {
  const [draft, setDraft] = useState(value)
  const [seen, setSeen] = useState(value)

  if (value !== seen) {
    setSeen(value)
    setDraft(value)
  }

  return {
    value: draft,
    onChange: (event) => {
      setDraft(event.target.value)
    },
    /* Les espaces sont rognés ici et non à la frappe : rognés à la frappe,
       l'espace de « Jean Paul » ne pourrait jamais être tapé. */
    onBlur: () => {
      const clean = draft.trim()
      if (clean === '' && !allowEmpty) {
        setDraft(value)
        return
      }
      setDraft(clean)
      if (clean !== value) commit(clean)
    },
    onKeyDown: (event) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      event.currentTarget.blur()
    },
  }
}
