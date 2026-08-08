/**
 * Remet un fichier à la feuille de partage du système — AirDrop, Partage à
 * proximité, une messagerie. La sœur de `download` : le même fichier, une autre
 * sortie, et toujours rien qui passe par un serveur de l'app.
 *
 * **Rien d'asynchrone avant `share()`.** L'API exige une activation
 * transitoire : le navigateur n'ouvre la feuille que si l'appel appartient
 * encore à la tâche du clic. Un `await` glissé au-dessus la consomme, et Safari
 * iOS — lui seul, ce qui rend la panne indétectable ailleurs — lève alors
 * `NotAllowedError`. D'où la chaîne de promesses plutôt qu'une fonction
 * `async` : celle-ci ne *peut* pas attendre quoi que ce soit avant d'appeler.
 *
 * **La disponibilité se demande à `canShare`, jamais à `'share' in
 * navigator`.** Les navigateurs filtrent les types partageables, et
 * `application/json` n'est pas sur toutes les listes blanches : la présence de
 * l'API ne dit rien de ce fichier-là.
 */

/** Ce qu'a donné la feuille. Fermer n'est pas rater — voir `shareFile`. */
export type ShareResult = 'shared' | 'dismissed' | 'failed'

/**
 * La fermeture de la feuille, que le navigateur rejette en `AbortError`.
 *
 * Le nom seul, sans `instanceof` : une `DOMException` ne descend pas d'`Error`
 * dans tous les contextes — jsdom est le premier à le montrer, un autre realm
 * ferait pareil dans un navigateur —, et un test d'appartenance qui échoue là
 * transformerait un renoncement en échec.
 */
function isDismissal(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) return false
  return error.name === 'AbortError'
}

/**
 * Vrai si un fichier de ce nom et de ce type peut partir.
 *
 * La sonde est un fichier **vide** : `canShare` ne regarde que le nom et le
 * type, et sérialiser l'export entier pour répondre à une question d'affichage
 * coûterait cher pour rien. Elle porte la même forme de charge que l'envoi —
 * `files` seul — sans quoi elle validerait autre chose que ce qui partira.
 */
export function canShareFile(filename: string, type: string): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({ files: [new File([], filename, { type })] })
  } catch {
    return false
  }
}

/**
 * Ouvre la feuille, et dit ce qu'il en est ressorti.
 *
 * `dismissed` quand elle a été fermée sans rien choisir : ce n'est pas une
 * erreur — l'appelant ne doit ni s'en excuser ni compter l'envoi comme fait.
 * Tout autre rejet est un `failed`, où il reste le téléchargement.
 */
export function shareFile(file: File): Promise<ShareResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return Promise.resolve('failed')
  }
  return navigator
    .share({ files: [file] })
    .then((): ShareResult => 'shared')
    .catch((error: unknown): ShareResult => (isDismissal(error) ? 'dismissed' : 'failed'))
}
