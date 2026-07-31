import { fr } from '@/i18n/fr'

export type RouteDef = { path: string; label: string }

/** L'ordre fait foi : il pilote la barre d'onglets comme la colonne latérale. */
export const NAV_ROUTES: RouteDef[] = [
  { path: '/', label: fr.nav.month },
  { path: '/calendrier', label: fr.nav.calendar },
  { path: '/abonnements', label: fr.nav.subscriptions },
  { path: '/historique', label: fr.nav.history },
  { path: '/reglages', label: fr.nav.settings },
]

export const STYLEGUIDE_ROUTE: RouteDef = { path: '/styleguide', label: fr.nav.styleguide }

/* Saisies et fiches sont des écrans pleins, pas des feuilles : elles ont donc
   une URL. Aucune ne figure dans la navigation, on n'y va que par une action. */
export const ENTRY_NEW_PATH = '/depense'
export const entryPath = (id: string): string => `${ENTRY_NEW_PATH}/${id}`

const RECURRENCES_PATH = '/abonnements'
/* Segment fixe : React Router le classe avant `/abonnements/:id`, un
   abonnement ne peut donc pas éclipser le formulaire de création. */
export const RECURRENCE_NEW_PATH = `${RECURRENCES_PATH}/nouveau`
export const recurrencePath = (id: string): string => `${RECURRENCES_PATH}/${id}`
export const recurrenceEditPath = (id: string): string => `${RECURRENCES_PATH}/${id}/modifier`

/**
 * Écrans qui n'ont qu'une chose à montrer — une saisie, une fiche. Aucune
 * bannière ne s'y intercale au-dessus du titre.
 */
export function isFocusScreen(pathname: string): boolean {
  return (
    pathname.startsWith(ENTRY_NEW_PATH) ||
    (pathname.startsWith(`${RECURRENCES_PATH}/`) && pathname !== `${RECURRENCES_PATH}/`)
  )
}
