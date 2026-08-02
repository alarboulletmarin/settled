/**
 * Copie un texte dans le presse-papiers, et dit si ça a marché.
 *
 * Faux plutôt que jeté : l'API n'existe qu'en contexte sécurisé et le
 * navigateur peut refuser la permission, deux cas que l'appelant doit rattraper
 * — il a toujours le téléchargement à proposer — mais qui n'ont rien
 * d'exceptionnel au sens du langage.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || navigator.clipboard === undefined) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
