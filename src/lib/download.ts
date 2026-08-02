/**
 * Enregistre un contenu sur l'appareil, sans passer par un serveur.
 *
 * L'URL d'objet est révoquée dans la foulée : le clic sur un lien `download`
 * est synchrone, le navigateur a déjà pris le contenu quand la ligne suivante
 * s'exécute, et la garder ferait fuir un blob par export.
 */
export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
