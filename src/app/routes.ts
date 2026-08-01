import { fr } from '@/i18n/fr'
import {
  type IconComponent,
  NavCalendar,
  NavHistory,
  NavMonth,
  NavRecurrences,
  NavSettings,
} from '@/ui/Icons'

export type RouteDef = { path: string; label: string; icon: IconComponent }

/* Déclaré avant la table : un `const` ne remonte pas, et `NAV_ROUTES` le lit à
   l'évaluation du module. */
export const RECURRENCES_PATH = '/recurrences'
/* Segment fixe : React Router le classe avant `/recurrences/:id`, une
   récurrence ne peut donc pas éclipser le formulaire de création. */
export const RECURRENCE_NEW_PATH = `${RECURRENCES_PATH}/nouveau`
export const recurrencePath = (id: string): string => `${RECURRENCES_PATH}/${id}`
export const recurrenceEditPath = (id: string): string => `${RECURRENCES_PATH}/${id}/modifier`

/**
 * L'ordre fait foi : il pilote la barre d'onglets comme la colonne latérale.
 * Chaque destination porte son glyphe ici, en un seul endroit, pour que les
 * deux navigations ne puissent pas diverger.
 */
export const NAV_ROUTES: RouteDef[] = [
  { path: '/', label: fr.nav.month, icon: NavMonth },
  { path: '/calendrier', label: fr.nav.calendar, icon: NavCalendar },
  { path: RECURRENCES_PATH, label: fr.nav.subscriptions, icon: NavRecurrences },
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

/* La nature voyage à côté du sens, et en clair elle aussi : un virement
   d'épargne s'ouvre déjà réglé dessus, depuis l'écran du mois comme depuis
   celui de l'épargne. Le sens reste utile même en épargne — il dit si l'on
   place ou si l'on reprend. */
export const NATURE_PARAM = 'nature'
const SAVING_NATURE = 'epargne'

export function natureFromParam(
  nature: string | null,
  direction: string | null,
): 'expense' | 'income' | 'saving' {
  if (nature === SAVING_NATURE) return 'saving'
  return directionFromParam(direction) === 'in' ? 'income' : 'expense'
}

export function entryNewPath(
  options: { direction?: 'in' | 'out'; date?: string; saving?: boolean } = {},
): string {
  const params = new URLSearchParams()
  if (options.direction !== undefined) params.set(DIRECTION_PARAM, DIRECTION_VALUE[options.direction])
  if (options.saving === true) params.set(NATURE_PARAM, SAVING_NATURE)
  if (options.date !== undefined) params.set('date', options.date)
  const query = params.toString()
  return query === '' ? ENTRY_NEW_PATH : `${ENTRY_NEW_PATH}?${query}`
}

export const CREDITS_PATH = '/credits'

/* Hors navigation, pour la même raison que les crédits : six onglets ne
   tiennent pas à 320px. On y accède par la tuile Répartition de l'écran du
   mois, qui s'efface tant qu'il n'y a rien à répartir. */
export const SPLIT_PATH = '/repartition'

/* Même règle, même porte : la tuile Capacité d'épargne du mois y mène, et elle,
   ne s'efface jamais — un mois sans versement est justement celui où la
   question « où je place » se pose. */
export const SAVINGS_PATH = '/epargne'

/* Une avance se pose depuis la liste des récurrences, où elle vit : sa
   mensualité en est une. L'écran de saisie est plein, comme tous les
   formulaires — d'où une URL, hors navigation. */
export const ADVANCE_NEW_PATH = '/avances/nouveau'

/**
 * Écrans qui n'ont qu'une chose à montrer — une saisie, une fiche. Aucune
 * bannière ne s'y intercale au-dessus du titre.
 */
export function isFocusScreen(pathname: string): boolean {
  return (
    pathname.startsWith(ENTRY_NEW_PATH) ||
    pathname.startsWith(ADVANCE_NEW_PATH) ||
    (pathname.startsWith(`${RECURRENCES_PATH}/`) && pathname !== `${RECURRENCES_PATH}/`) ||
    (pathname.startsWith(`${CREDITS_PATH}/`) && pathname !== `${CREDITS_PATH}/`)
  )
}

export const CREDIT_NEW_PATH = `${CREDITS_PATH}/nouveau`
export const creditEditPath = (id: string): string => `${CREDITS_PATH}/${id}`
