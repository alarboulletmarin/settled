import { useState } from 'react'

/**
 * Le prénom d'un membre, modifiable sur place.
 *
 * Même geste que le libellé d'une catégorie ou le nom du foyer : on tape dans le
 * mot, il n'y a pas de bouton « modifier » ni de champ qui s'ouvre. Le champ n'a
 * donc aucun décor tant qu'on ne l'a pas touché — c'est un nom qu'on lit, et
 * accessoirement qu'on corrige.
 *
 * Un garde-fou que le renommage d'une catégorie n'a pas : le prénom vide n'est
 * jamais enregistré. Il resterait une ligne blanche dont le bouton de retrait
 * s'annoncerait « Retirer  », et rien à l'écran ne dirait plus qui elle est. On
 * accepte donc le champ vide le temps de retaper — sinon on ne pourrait pas
 * effacer pour recommencer — mais le foyer garde le dernier prénom valide, et
 * la sortie du champ le remet à l'écran.
 *
 * Les espaces sont rognés à la sortie du champ, pas à la frappe : rognés à la
 * frappe, l'espace de « Jean Paul » ne pourrait jamais être tapé.
 */
export function MemberNameInput({
  label,
  name,
  onRename,
}: {
  /** Nom accessible du champ : la liste en compte un par membre. */
  label: string
  name: string
  onRename: (name: string) => void
}) {
  const [draft, setDraft] = useState(name)
  const [seen, setSeen] = useState(name)

  /* Le prénom peut changer sans passer par ce champ — un import, une remise à
     zéro. Ajusté au rendu : React relance aussitôt, rien ne s'affiche entre les
     deux. C'est la règle que suit déjà la liste du mois quand son axe cesse
     d'être proposé. */
  if (name !== seen) {
    setSeen(name)
    setDraft(name)
  }

  return (
    <input
      aria-label={label}
      value={draft}
      maxLength={24}
      className="t-body h-11 min-w-0 flex-1 bg-transparent outline-none"
      onChange={(event) => {
        const next = event.target.value
        setDraft(next)
        if (next.trim() !== '') onRename(next)
      }}
      onBlur={() => {
        const clean = draft.trim()
        if (clean === '') {
          setDraft(name)
          return
        }
        if (clean !== name) onRename(clean)
        setDraft(clean)
      }}
    />
  )
}
