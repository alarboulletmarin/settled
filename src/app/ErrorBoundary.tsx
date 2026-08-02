import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CrashScreen } from './CrashScreen'

/**
 * La seule classe du dépôt, et pour la seule raison qui l'impose : React
 * n'offre pas de hook pour attraper une exception de rendu.
 *
 * Sans elle, `main.tsx` montait `<App/>` nu et la moindre exception donnait un
 * écran blanc — reproduit à l'identique à chaque rechargement, puisque le
 * service worker resert la même version depuis son cache. Aucune sortie, et
 * des données qui ne vivent nulle part ailleurs.
 *
 * Elle ne réessaie pas de rendre : un rendu qui a levé lève à nouveau, et une
 * boucle de tentatives cacherait l'écran de secours au moment où il sert.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  override state = { crashed: false }

  static getDerivedStateFromError(): { crashed: boolean } {
    return { crashed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Rien ne part vers un serveur — il n'y en a pas. La console est le seul
    // endroit où quelqu'un pourra lire ce qui s'est passé.
    console.error(error, info.componentStack)
  }

  override render(): ReactNode {
    return this.state.crashed ? <CrashScreen /> : this.props.children
  }
}
