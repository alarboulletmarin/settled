/* ============================================================================
 * Toutes les chaînes de l'app. Aucun composant n'écrit de texte en dur.
 * Français, casse normale, pas de majuscule décorative (DS §7).
 * ==========================================================================*/

export const fr = {
  app: {
    name: 'Settled',
    tagline: 'Les finances du foyer, sur ton appareil.',
  },

  calendarNames: {
    months: [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ],
    monthsShort: [
      'janv.',
      'févr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'août',
      'sept.',
      'oct.',
      'nov.',
      'déc.',
    ],
    /** Index 0 = lundi, conformément à `dayOfWeek` (ISO 8601). */
    weekdaysShort: ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'],
    weekdaysNarrow: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    weekdays: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  },

  common: {
    add: 'Ajouter',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Continuer',
    skip: 'Passer',
    all: 'Tous',
    none: 'Aucun',
    today: "Aujourd'hui",
    optional: 'facultatif',
    required: 'obligatoire',
    loading: 'Chargement',
    yes: 'Oui',
    no: 'Non',
    more: 'Voir plus',
    less: 'Voir moins',
    other: 'Autres',
  },

  direction: {
    in: 'Entrée',
    out: 'Sortie',
    inPlural: 'Entrées',
    outPlural: 'Sorties',
  },

  theme: {
    label: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    toggle: 'Changer de thème',
  },

  styleguide: {
    title: 'Styleguide',
    subtitle: 'Chaque token et chaque composant du design system, dans les deux thèmes.',
    sections: {
      base: 'Palette de base',
      semantic: 'Tokens sémantiques',
      categories: 'Palette catégories',
      type: 'Échelle typographique',
      shapes: 'Formes et mouvement',
      components: 'Composants',
      bento: 'Grille bento',
    },
    baseNote: 'Ces valeurs ne sont jamais consommées directement par un composant.',
    semanticNote: 'La seule couche que les composants consomment.',
    categoriesNote:
      'Six teintes, dans cet ordre. Au-delà, les suivantes basculent en gris sous « Autres ».',
    typeNote: 'Archivo pour ce qui se lit, Geist Mono pour les libellés utilitaires.',
    shapesNote: 'Base 4px. Mouvement 160ms, 240ms à l’entrée d’une vue.',
    bentoNote: 'Formats autorisés : 2×1, 2×2, 4×1, 4×2, 6×2. Rien d’autre.',
    themePreview: 'Aperçu forcé',
    sampleAmount: 'Montant',
    sampleRing: 'Anneau',
    sampleEmpty: 'Aucun abonnement pour l’instant. Ajoute le premier.',
    sampleEmptyAction: 'Ajouter un abonnement',
    variants: 'Variantes',
    states: 'États',
  },

  a11y: {
    skipToContent: 'Aller au contenu',
    ringLabel: 'Anneau de progression',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
  },
} as const

export type Strings = typeof fr
