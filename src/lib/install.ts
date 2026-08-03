/* ============================================================================
 * L'invite d'installation du navigateur, gardée le temps qu'on s'en serve.
 *
 * `beforeinstallprompt` est un événement qu'on n'a pas le droit de rater : il
 * se déclenche une fois, tôt — souvent avant que React ait monté quoi que ce
 * soit — et ne se rejoue pas. Un `useEffect` arrive donc trop tard une fois sur
 * deux. L'écouteur est posé à l'évaluation de ce module, importé par
 * `main.tsx` avant le premier rendu ; l'événement est retenu ici, et l'interface
 * vient le chercher quand elle est prête.
 *
 * `preventDefault` sur l'événement empêche la bannière native du navigateur.
 * C'est délibéré : elle apparaît où et quand le navigateur le décide, alors que
 * l'argument de cette app — pas de compte, pas de serveur, et l'installation
 * comme ce qui protège les données d'une purge (cahier §5) — se tient sur la
 * page de présentation, à l'endroit exact où il est déjà écrit.
 *
 * Rien ici n'est proposé quand l'événement ne s'est pas déclenché : ni détection
 * de navigateur, ni marche à suivre écrite d'avance. Un bandeau qui explique
 * comment installer une app déjà installée, ou sur un navigateur qui ne sait pas
 * le faire, coûte plus qu'il ne rapporte.
 * ==========================================================================*/

/** L'événement, que `lib.dom` ne déclare pas — il n'est pas standardisé. */
export type InstallPromptEvent = Event & {
  prompt: () => Promise<unknown>
}

let pending: InstallPromptEvent | null = null
const listeners = new Set<() => void>()

function announce(): void {
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    pending = event as InstallPromptEvent
    announce()
  })

  /* Installée, l'app n'a plus rien à proposer — et le navigateur ne redéclenche
     pas l'événement pour le dire. C'est celui-ci qui referme le bandeau, sur
     l'onglet resté ouvert derrière l'installation. */
  window.addEventListener('appinstalled', () => {
    pending = null
    announce()
  })
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function canInstall(): boolean {
  return pending !== null
}

/**
 * Ouvre l'invite du navigateur, et oublie l'événement dans tous les cas.
 *
 * Un `beforeinstallprompt` ne se consomme qu'une fois : refusé, il ne se
 * rouvre pas. Garder le bandeau après un refus donnerait un bouton qui ne fait
 * plus rien — pire qu'un bandeau absent. La réponse n'est donc pas lue : ce
 * qu'on en ferait — insister — est exactement ce qu'il ne faut pas faire.
 */
export async function promptInstall(): Promise<void> {
  const event = pending
  if (event === null) return
  pending = null
  announce()
  try {
    await event.prompt()
  } catch {
    /* Un navigateur qui refuse d'ouvrir son invite n'a rien à nous apprendre,
       et le bandeau est déjà parti. */
  }
}
