/**
 * Ce qu'un changement de membre emporte avec lui, dans les deux formulaires.
 *
 * Revenir à « en commun » efface l'exception de partage : la case y est
 * verrouillée sur « oui » — une charge que personne ne s'attribue est commune
 * par la règle même —, et un `shared: false` posé quand la ligne était à
 * quelqu'un resterait stocké sous une case qui affiche l'inverse. Deux vérités,
 * dont celle qu'on ne voit pas gagne au calcul.
 *
 * Dans un formulaire, « en commun » s'encode par la chaîne vide : c'est la
 * valeur qu'un `<option>` sait porter. Le document, lui, omet la clé.
 */
export function memberPatch(memberId: string): { memberId: string; shared?: boolean | undefined } {
  return memberId === '' ? { memberId, shared: undefined } : { memberId }
}
