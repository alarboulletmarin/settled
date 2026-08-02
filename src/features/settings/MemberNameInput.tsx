import { useDraftField } from '@/ui/useDraftField'

/**
 * Le prénom d'un membre, modifiable sur place.
 *
 * Même geste que le libellé d'une catégorie ou le nom du foyer : on tape dans le
 * mot, il n'y a pas de bouton « modifier » ni de champ qui s'ouvre. Le champ n'a
 * donc aucun décor tant qu'on ne l'a pas touché — c'est un nom qu'on lit, et
 * accessoirement qu'on corrige.
 *
 * Le prénom vide n'est jamais enregistré : il resterait une ligne blanche dont
 * le bouton de retrait s'annoncerait « Retirer  », et rien à l'écran ne dirait
 * plus qui elle est. On accepte le champ vide le temps de retaper — sinon on ne
 * pourrait pas effacer pour recommencer — mais le foyer garde le dernier prénom
 * valide, et la sortie du champ le remet à l'écran. C'est ce que fait
 * `useDraftField` sans `allowEmpty`, avec le reste de la mécanique : la frappe
 * locale, le rognage à la sortie, la reprise d'un changement venu d'ailleurs.
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
  const draft = useDraftField(name, onRename, { allowEmpty: false })

  return (
    <input
      aria-label={label}
      maxLength={24}
      className="t-body h-11 min-w-0 flex-1 bg-transparent outline-none"
      {...draft}
    />
  )
}
