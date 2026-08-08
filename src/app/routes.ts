import { fr } from '@/i18n/fr'
import {
  CreditsIcon,
  HistoryIcon,
  type IconComponent,
  InfoIcon,
  NavCalendar,
  NavMonth,
  NavMore,
  NavSettings,
  RecurrencesIcon,
  SavingsIcon,
  SplitIcon,
} from '@/ui/Icons'

export type RouteDef = { path: string; label: string; icon: IconComponent }

/* Déclaré avant la table : un `const` ne remonte pas, et `NAV_ROUTES` le lit à
   l'évaluation du module. */
export const RECURRENCES_PATH = '/recurrences'
export const SETTINGS_PATH = '/reglages'
/* Le quatrième onglet : tout ce que la barre ne peut pas porter. Voir
   `MORE_SECTIONS` plus bas, qui dit ce qu'on y trouve et pourquoi. */
export const MORE_PATH = '/plus'
/* Segment fixe : React Router le classe avant `/recurrences/:id`, une
   récurrence ne peut donc pas éclipser le formulaire de création. */
export const RECURRENCE_NEW_PATH = `${RECURRENCES_PATH}/nouveau`
export const recurrencePath = (id: string): string => `${RECURRENCES_PATH}/${id}`
export const recurrenceEditPath = (id: string): string => `${RECURRENCES_PATH}/${id}/modifier`

/**
 * Les quatre onglets de la barre du bas, dans l'ordre.
 *
 * **Quatre et non cinq.** La barre en portait cinq — le mois, le calendrier,
 * les récurrences, l'historique, les réglages —, et cette liste-là n'était pas
 * une hiérarchie : elle mettait « Récurrences », qu'on écrit une fois, au même
 * rang que « Le mois », qu'on ouvre tous les jours, et surtout elle décidait
 * *par sa longueur* que quatre écrans réels de l'app — l'épargne, la
 * répartition, les crédits, les avances — n'auraient aucune porte de
 * navigation. On n'y arrivait que par une tuile du mois, laquelle s'efface
 * précisément quand il n'y a rien à y montrer : un écran atteignable seulement
 * quand on n'en a pas besoin.
 *
 * Restent donc les trois lectures qu'on ouvre pour regarder — ce mois, les
 * jours, les mois d'avant — et une quatrième porte, « Plus », qui range le
 * reste au lieu de le laisser sans adresse (`MORE_SECTIONS`).
 *
 * Le prix est assumé : les récurrences et les réglages passent de un à deux
 * appuis. Les premières restent à un appui depuis l'état vide du mois, qui est
 * l'endroit où l'on va justement en poser une.
 *
 * Chaque destination porte son glyphe ici, en un seul endroit, pour que les
 * deux navigations ne puissent pas diverger.
 */
export const NAV_ROUTES: RouteDef[] = [
  { path: '/', label: fr.nav.month, icon: NavMonth },
  { path: '/calendrier', label: fr.nav.calendar, icon: NavCalendar },
  { path: '/historique', label: fr.nav.history, icon: HistoryIcon },
  { path: MORE_PATH, label: fr.nav.more, icon: NavMore },
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

/* La tuile Répartition de l'écran du mois y mène — mais elle s'efface tant
   qu'il n'y a rien à répartir, et c'est exactement le moment où l'on cherche
   comment répartir. D'où sa rangée dans « Gérer » (`MANAGE_ROUTES`). */
export const SPLIT_PATH = '/repartition'

/* Même porte, même raison : la tuile Capacité d'épargne du mois y mène, et
   elle, ne s'efface jamais — un mois sans versement est justement celui où la
   question « où je place » se pose. */
export const SAVINGS_PATH = '/epargne'

/* Les avances ont leur écran, pour la raison qui donne le sien aux crédits :
   elles vivent sous les récurrences — leur mensualité en est une — mais ce
   qu'elles ajoutent est un suivi à part, qu'on ouvre quand on le cherche. En
   section sous la liste, elles posaient une tuile pleine par avance au bas d'un
   écran qui en avait déjà beaucoup, et une deuxième action « Ajouter » sans
   rapport avec la première. La liste des récurrences n'en garde qu'une rangée.

   Le segment fixe se déclare après le chemin qu'il prolonge, et React Router le
   classe de toute façon avant un paramètre — il n'y en a pas ici. */
export const ADVANCES_PATH = '/avances'
export const ADVANCE_NEW_PATH = `${ADVANCES_PATH}/nouveau`

/* --- Le rangement de la navigation ---------------------------------------*/

/**
 * Ce qu'on tient, par opposition à ce qu'on regarde.
 *
 * Les quatre écrans du foyer qu'on ouvre quand on les cherche : la règle qui
 * écrit les mois, le support où l'on place, le partage du pot, ce qu'on doit
 * encore. Trois d'entre eux n'avaient aucune adresse dans la navigation, et
 * n'existaient qu'au bout d'une tuile qui s'efface — voir `NAV_ROUTES`.
 *
 * **Les avances n'y sont pas**, et c'est délibéré : elles vivent sous les
 * récurrences, dont leur mensualité est une, et la liste des récurrences porte
 * leur rangée. Une seconde porte au même rang que les quatre autres défferait
 * ce rangement pour ne rien raccourcir.
 *
 * Déclaré ici et non en tête du fichier : un `const` ne remonte pas, et cette
 * table lit quatre chemins déclarés au-dessus.
 */
export const MANAGE_ROUTES: RouteDef[] = [
  { path: RECURRENCES_PATH, label: fr.nav.subscriptions, icon: RecurrencesIcon },
  { path: SAVINGS_PATH, label: fr.nav.savings, icon: SavingsIcon },
  { path: SPLIT_PATH, label: fr.nav.split, icon: SplitIcon },
  { path: CREDITS_PATH, label: fr.nav.credits, icon: CreditsIcon },
]

const SETTINGS_ROUTE: RouteDef = {
  path: SETTINGS_PATH,
  label: fr.nav.settings,
  icon: NavSettings,
}

export type NavGroup = { title?: string; routes: RouteDef[] }

/**
 * La colonne latérale, en trois groupes.
 *
 * Elle alignait cinq entrées à plat, ce qui donnait le même poids à « Le mois »
 * et à « Réglages » — et laissait 224px de colonne à moitié vides pendant que
 * quatre écrans n'y figuraient pas du tout. Le premier groupe est ce qu'on
 * ouvre pour regarder, le deuxième ce qu'on tient, le troisième ce qu'on règle.
 *
 * **Seul celui du milieu porte un titre.** Le premier n'en a pas parce que la
 * colonne doit s'ouvrir sur les destinations quotidiennes, pas sur un mot à
 * lire avant elles ; le dernier n'en a pas parce qu'il ne contient qu'une
 * destination, et qu'un titre « Réglages » posé au-dessus d'un lien « Réglages »
 * est une étiquette qui ne sépare rien de ce qu'elle nomme. Un titre dit qu'on
 * descend d'un cran ; sur un groupe d'un seul, il n'y a pas de cran.
 *
 * **Elle ne montre pas « Plus ».** Cet écran est le repli d'une barre de quatre
 * onglets ; ici la colonne a la place de déplier ce qu'il contient, et un lien
 * vers une page qui redirait la colonne serait un tour sur soi-même.
 */
export const SIDEBAR_GROUPS: NavGroup[] = [
  { routes: NAV_ROUTES.filter((route) => route.path !== MORE_PATH) },
  { title: fr.nav.manage, routes: MANAGE_ROUTES },
  { routes: [SETTINGS_ROUTE] },
]

/**
 * Ce que l'écran « Plus » range, et dans le même ordre que la colonne.
 *
 * Les deux navigations lisent les mêmes tables : ce qui est atteignable au
 * doigt l'est à la souris, et l'inverse. C'est la règle que `NAV_ROUTES` posait
 * déjà pour la barre et la colonne, étendue au cran du dessous.
 *
 * Le second groupe n'a pas de titre, pour la raison qui le lui retire dans la
 * colonne — et « À propos » l'y rejoint, parce que sous 1024px c'est la seule
 * porte vers cette page : la barre ne peut pas la porter, et la colonne, elle,
 * a son propre lien en pied.
 */
export const MORE_SECTIONS: NavGroup[] = [
  { title: fr.nav.manage, routes: MANAGE_ROUTES },
  { routes: [SETTINGS_ROUTE, { path: ABOUT_PATH, label: fr.nav.about, icon: InfoIcon }] },
]

/* Ce que « Plus » recouvre. Sans cette liste, descendre dans l'une des sections
   qu'il range éteignait les quatre onglets d'un coup, sans rien pour dire d'où
   l'on venait — c'est le défaut que le cas particulier d'« à propos » corrigeait
   déjà à la main pour l'onglet des réglages, et qui vaut désormais pour six
   sections. `NavLink` apparie par préfixe, cette table dit lesquels. */
const MORE_PREFIXES = [
  MORE_PATH,
  SETTINGS_PATH,
  RECURRENCES_PATH,
  SAVINGS_PATH,
  SPLIT_PATH,
  CREDITS_PATH,
  ADVANCES_PATH,
  ABOUT_PATH,
]

/** L'onglet « Plus » est-il celui de l'écran affiché ? */
export function isInMoreSection(pathname: string): boolean {
  return MORE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

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

/* L'apparence a sa vue, contrairement au thème seul qui restait sur la page
   d'entrée : trois positions y tenaient, six aperçus non — et une palette ne se
   choisit pas à la lecture de son nom. Le thème l'y suit, parce que les deux
   réglages se regardent ensemble : « Sombre » ne veut rien dire sans savoir de
   quelle palette il est le sombre. */
export const SETTINGS_APPEARANCE_PATH = `${SETTINGS_PATH}/apparence`

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
