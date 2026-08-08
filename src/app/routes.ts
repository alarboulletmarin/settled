import { fr } from '@/i18n/fr'
import {
  HistoryIcon,
  type IconComponent,
  NavCalendar,
  NavMonth,
  NavSettings,
  RecurrencesIcon,
} from '@/ui/Icons'

export type RouteDef = { path: string; label: string; icon: IconComponent }

/* Déclaré avant la table : un `const` ne remonte pas, et `NAV_ROUTES` le lit à
   l'évaluation du module. */
export const RECURRENCES_PATH = '/recurrences'
export const SETTINGS_PATH = '/reglages'
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
  { path: RECURRENCES_PATH, label: fr.nav.subscriptions, icon: RecurrencesIcon },
  { path: '/historique', label: fr.nav.history, icon: HistoryIcon },
  { path: SETTINGS_PATH, label: fr.nav.settings, icon: NavSettings },
]

export const STYLEGUIDE_ROUTE = { path: '/styleguide', label: fr.nav.styleguide }

/* La présentation et « à propos » ne parlent pas d'un foyer, elles parlent de
   l'app : elles répondent donc dans les deux états, avant comme après sa
   création. Les deux questions, elles, n'ont de sens que tant qu'il n'existe
   pas — d'où une URL à part, qui disparaît avec l'état qui la justifie. */
export const LANDING_PATH = '/bienvenue'
export const ONBOARDING_PATH = '/demarrer'
export const ABOUT_PATH = '/a-propos'

/* Les trois pages juridiques. Elles répondent dans les deux états, comme la
   présentation et « à propos » : elles parlent du site, pas d'un foyer, et
   l'obligation de se rendre identifiable ne commence pas à la création du
   premier foyer.
   Leurs libellés vivent ici et non dans `i18n/legal.ts`, qui porte la prose et
   se charge à la demande : le pied de page les nomme sur tous les écrans, il ne
   peut pas attendre un morceau chargé à la demande pour savoir quoi écrire. */
export const LEGAL_NOTICE_PATH = '/mentions-legales'
export const PRIVACY_PATH = '/confidentialite'
export const TERMS_PATH = '/conditions'

export const LEGAL_ROUTES: { path: string; label: string }[] = [
  { path: LEGAL_NOTICE_PATH, label: fr.legal.notice },
  { path: PRIVACY_PATH, label: fr.legal.privacy },
  { path: TERMS_PATH, label: fr.legal.terms },
]

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

/* Les réglages ne sont plus un écran mais une section.
 *
 * Ils tenaient dans une seule page : les personnes, le catalogue entier des
 * catégories, le thème, la devise, le stockage, l'export, l'import, le schéma,
 * le jeu d'exemple, l'effacement et « à propos », formulaires ouverts compris.
 * On y cherchait un réglage en faisant défiler une page d'administration.
 *
 * Une page d'entrée, donc, et huit vues qu'on n'ouvre qu'en les demandant.
 * Chacune porte son URL — c'est ce qui rend le retour du navigateur, le partage
 * d'un lien et le bouton « retour » de l'écran identiques à ceux du reste de
 * l'app, plutôt qu'un état de composant qu'aucune de ces trois choses ne
 * connaît. « À propos » n'en fait pas partie : la page existe déjà, elle parle
 * de l'app et non d'un foyer, et la dupliquer sous `/reglages` aurait donné
 * deux adresses au même texte. */
export const SETTINGS_PEOPLE_PATH = `${SETTINGS_PATH}/personnes`
/* Segment fixe avant `:id`, comme pour les récurrences : React Router le classe
   d'abord, un membre ne peut donc pas éclipser le formulaire de création. */
export const SETTINGS_MEMBER_NEW_PATH = `${SETTINGS_PEOPLE_PATH}/nouveau`
export const settingsMemberPath = (id: string): string => `${SETTINGS_PEOPLE_PATH}/${id}`

export const SETTINGS_CATEGORIES_PATH = `${SETTINGS_PATH}/categories`
export const SETTINGS_FAMILY_NEW_PATH = `${SETTINGS_CATEGORIES_PATH}/nouvelle`
export const settingsFamilyPath = (id: string): string => `${SETTINGS_CATEGORIES_PATH}/${id}`
/* La création d'une catégorie vit sous sa famille : celle-ci porte la nature et
   la teinte, et l'écran n'a donc plus à redemander ce qu'on vient de choisir en
   ouvrant la famille. */
export const settingsCategoryNewPath = (familyId: string): string =>
  `${SETTINGS_CATEGORIES_PATH}/${familyId}/nouvelle`

export const SETTINGS_STORAGE_PATH = `${SETTINGS_PATH}/stockage`
export const SETTINGS_DATA_PATH = `${SETTINGS_PATH}/donnees`

/**
 * Écrans qui n'ont qu'une chose à montrer — une saisie, une fiche. Aucune
 * bannière ne s'y intercale au-dessus du titre.
 */
export function isFocusScreen(pathname: string): boolean {
  return (
    pathname.startsWith(ENTRY_NEW_PATH) ||
    pathname.startsWith(ADVANCE_NEW_PATH) ||
    (pathname.startsWith(`${RECURRENCES_PATH}/`) && pathname !== `${RECURRENCES_PATH}/`) ||
    (pathname.startsWith(`${CREDITS_PATH}/`) && pathname !== `${CREDITS_PATH}/`) ||
    /* Les vues des réglages, et non la page d'entrée. Chacune n'a qu'un sujet,
       son propre retour, et le plus souvent sa propre action principale —
       « Ajouter un membre », « Ajouter une famille », « Ajouter une catégorie ».
       Le bouton flottant y poserait une seconde action principale sur le même
       écran, à trois centimètres de la première et sans rapport avec elle ; et
       le rappel d'export s'intercalerait au-dessus d'un titre qui, sur la vue
       des données, mène justement à l'export. La page d'entrée reste une
       destination de la barre d'onglets : elle garde les deux. */
    pathname.startsWith(`${SETTINGS_PATH}/`)
  )
}

export const CREDIT_NEW_PATH = `${CREDITS_PATH}/nouveau`
export const creditEditPath = (id: string): string => `${CREDITS_PATH}/${id}`
