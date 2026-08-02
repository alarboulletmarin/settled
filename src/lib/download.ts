/**
 * Enregistre un contenu sur l'appareil, sans passer par un serveur.
 *
 * Deux précautions qui n'en ont pas l'air, et c'est le seul chemin de
 * sauvegarde de l'app — un export qui ne part pas est une perte de données à
 * retardement, pas un défaut d'affichage.
 *
 * **L'ancre est posée dans le document.** Un `click()` sur un élément détaché
 * fonctionne sur Chrome et pas ailleurs : Firefox n'a longtemps rien fait d'un
 * lien qui n'est pas dans l'arbre, et le comportement n'est garanti nulle part.
 * Elle est retirée dans la foulée, donc rien ne se voit.
 *
 * **La révocation est différée.** Le clic déclenche un téléchargement que le
 * navigateur poursuit *après* le retour du gestionnaire ; révoquer l'URL à la
 * ligne suivante coupe la source sous Safari, qui rend alors un fichier vide.
 * Un tour de boucle d'événements suffit à le laisser prendre le contenu, et le
 * blob finit quand même libéré — le garder en fuirait un par export.
 */
export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}
