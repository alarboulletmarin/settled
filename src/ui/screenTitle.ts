import { createContext, use, useEffect } from 'react'

/** Ce que la coquille fait du titre d'un écran qui arrive. */
export type ScreenTitle = { announce: (title: string) => void }

/* Hors coquille — le styleguide, les deux questions du début, un test —,
   personne n'écoute : un titre s'affiche alors sans rien annoncer. */
const SILENT: ScreenTitle = { announce: () => undefined }

export const ScreenTitleContext = createContext<ScreenTitle>(SILENT)

/**
 * Fait dire le titre de l'écran par la région live de la coquille.
 *
 * Appelé depuis `PageTitle`, et de nulle part ailleurs : c'est le seul endroit
 * qui connaisse le titre d'un écran, et un second appelant finirait par annoncer
 * autre chose que ce qui est écrit.
 */
export function useAnnounceScreen(title: string): void {
  const { announce } = use(ScreenTitleContext)

  useEffect(() => {
    announce(title)
  }, [announce, title])
}
