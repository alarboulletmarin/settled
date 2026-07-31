import { fr } from '@/i18n/fr'
import {
  type IconComponent,
  NavCalendar,
  NavHistory,
  NavMonth,
  NavSettings,
  NavSubscriptions,
} from '@/ui/Icons'

export type RouteDef = { path: string; label: string; icon: IconComponent }

/**
 * L'ordre fait foi : il pilote la barre d'onglets comme la colonne latérale.
 * Chaque destination porte son glyphe ici, en un seul endroit, pour que les
 * deux navigations ne puissent pas diverger.
 */
export const NAV_ROUTES: RouteDef[] = [
  { path: '/', label: fr.nav.month, icon: NavMonth },
  { path: '/calendrier', label: fr.nav.calendar, icon: NavCalendar },
  { path: '/abonnements', label: fr.nav.subscriptions, icon: NavSubscriptions },
  { path: '/historique', label: fr.nav.history, icon: NavHistory },
  { path: '/reglages', label: fr.nav.settings, icon: NavSettings },
]

export const STYLEGUIDE_ROUTE = { path: '/styleguide', label: fr.nav.styleguide }

/* Saisies et fiches sont des écrans pleins, pas des feuilles : elles ont donc
   une URL. Aucune ne figure dans la navigation, on n'y va que par une action. */
export const ENTRY_NEW_PATH = '/depense'
export const entryPath = (id: string): string => `${ENTRY_NEW_PATH}/${id}`

/* Le sens voyage dans l'URL, en clair : une saisie de revenu s'ouvre déjà
   réglée sur « Entrée » au lieu de demander de corriger un formulaire de
   dépense. `date` sert au calendrier, qui connaît déjà le jour visé. */
export const DIRECTION_PARAM = 'sens'
const DIRECTION_VALUE = { in: 'entree', out: 'sortie' } as const

export function directionFromParam(value: string | null): 'in' | 'out' {
  return value === DIRECTION_VALUE.in ? 'in' : 'out'
}

export function entryNewPath(options: { direction?: 'in' | 'out'; date?: string } = {}): string {
  const params = new URLSearchParams()
  if (options.direction !== undefined) params.set(DIRECTION_PARAM, DIRECTION_VALUE[options.direction])
  if (options.date !== undefined) params.set('date', options.date)
  const query = params.toString()
  return query === '' ? ENTRY_NEW_PATH : `${ENTRY_NEW_PATH}?${query}`
}

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
