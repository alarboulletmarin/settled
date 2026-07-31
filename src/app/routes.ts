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

/* La saisie d'une entrée est un écran plein, pas une feuille : elle a donc une
   URL. Elle ne figure pas dans la navigation, on n'y va que par une action. */
export const ENTRY_NEW_PATH = '/depense'
export const entryPath = (id: string): string => `${ENTRY_NEW_PATH}/${id}`
