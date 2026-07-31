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

  nav: {
    label: 'Navigation principale',
    credits: 'Crédits',
    month: 'Le mois',
    calendar: 'Calendrier',
    subscriptions: 'Récurrences',
    history: 'Historique',
    settings: 'Réglages',
    styleguide: 'Styleguide',
  },

  shell: {
    loading: 'Ouverture de tes données',
    filterByMember: 'Filtrer par membre',
    everyone: 'Tout le foyer',
    /* Les chiffres d'un membre comprennent sa part des charges communes : sans
       elle, chacun se lirait comme s'il vivait sans loyer. La liste des
       échéances, elle, garde les lignes réelles — on confirme une échéance
       entière, jamais une part. */
    prorata: 'Chiffres à la part de %s : sa part des charges communes est comprise, au prorata des revenus. Les listes gardent les échéances entières.',
    prorataMissingOne:
      'Charges communes non réparties, faute de connaître le revenu de %s : seules les lignes à son nom sont comptées.',
    prorataMissingMany:
      'Charges communes non réparties, faute de connaître les revenus de %s : seules les lignes à son nom sont comptées.',
    prorataOnlyOwn:
      'Charges communes non réparties : seules les lignes à son nom sont comptées.',
  },

  settings: {
    themeHint: 'Le thème suit ton système, ou reste sur ton choix.',

    household: 'Foyer',
    householdName: 'Nom du foyer',
    householdPlaceholder: 'Maison',
    members: 'Membres',
    memberAdd: 'Ajouter un membre',
    memberName: 'Prénom',
    memberPlaceholder: 'Alix',
    /* Le prénom se corrige sur place, comme le libellé d'une catégorie. Le nom
       accessible porte celui qu'on modifie : la liste compte un champ par
       membre, et « Prénom » seul les annoncerait tous pareil. */
    memberRename: 'Prénom de %s',
    memberRemove: 'Retirer %s',
    memberRemoveHint: 'Ses entrées sont conservées, simplement sans étiquette.',
    membersEmpty: 'Aucun membre. Le foyer fonctionne très bien en solo.',
    /* Le revenu ne se saisit pas ici : il se lit sur les récurrences de
       ressources du membre. Le stocker à côté en ferait une seconde vérité.
       Reste à dire *pourquoi* il ne se lit pas, quand c'est le cas : les deux
       causes n'appellent pas le même geste, et « aucun revenu enregistré »
       envoyait créer une récurrence qui existait déjà. */
    memberNoIncome: 'aucun revenu enregistré',
    memberIncomeUnpriced: 'revenu à montant variable, pas encore chiffré',
    memberIncomeUnpricedFix: 'Indiquer un montant habituel',
    memberIncomeHint:
      'Le revenu de chacun se lit sur ses récurrences de salaire ou d’allocation, et sert à répartir les charges communes au prorata.',
    memberIncomeLink: 'Ajouter un revenu',
    /* Un salaire resté « tout le foyer » ne compte dans le revenu de personne,
       et c'est la première explication d'une répartition qui ne se calcule pas. */
    incomeUnassignedOne: '%s n’est à personne : ce revenu ne compte dans aucune part.',
    incomeUnassignedMany: '%s ne sont à personne : ces revenus ne comptent dans aucune part.',
    incomeUnassignedFix: 'Attribue-les à quelqu’un pour qu’ils pèsent dans le prorata.',
    memberShareOf: '%s des charges communes',
    /* La seule porte de la répartition était une tuile du mois, qui se retire
       sous un filtre par membre. Ici elle est toujours là, et c'est l'endroit
       où l'on se demande qui verse quoi : les coefficients sont juste au-dessus. */
    splitLink: 'Voir la répartition du mois',

    categories: 'Catégories',
    families: 'Familles',
    familyAdd: 'Ajouter une famille',
    familyName: 'Nom de la famille',
    familyPlaceholder: 'Animaux',
    familyKind: 'Nature',
    familyOf: 'Famille',
    categoryAdd: 'Ajouter une catégorie',
    categoryName: 'Libellé',
    categoryPlaceholder: 'Loisirs',
    categoryArchive: 'Archiver %s',
    categoryRestore: 'Réactiver %s',
    familyCountOne: '%s catégorie',
    familyCount: '%s catégories',
    collapseAll: 'Tout replier',
    expandAll: 'Tout déplier',
    archive: 'Archiver',
    restore: 'Réactiver',
    categoryDirection: 'Sens',
    categoryArchived: 'Archivées',
    categoriesHint:
      'Une catégorie n’est jamais effacée : elle est archivée, et les entrées passées la gardent.',

    data: 'Données',
    export: 'Exporter mes données',
    exportHint: 'Un fichier .json contenant tout, à ranger où tu veux.',
    exported: 'Export téléchargé',
    lastExport: 'Dernier export : %s',
    neverExported: 'Jamais exporté.',
    import: 'Importer un fichier',
    importHint: 'Remplace intégralement les données actuelles.',
    importConfirm: 'Remplacer toutes les données par ce fichier ?',
    imported: 'Données importées',
    importMigrated: 'Données importées et mises à jour depuis un format plus ancien',
    reset: 'Tout effacer',
    resetHint: 'Efface le foyer, les récurrences et toutes les entrées. Sans retour.',
    resetConfirm1: 'Effacer toutes les données de cet appareil ?',
    resetConfirm2: 'Vraiment tout effacer ? Exporte d’abord si tu veux garder une trace.',
    resetDone: 'Données effacées',

    reminderTitle: 'Ton dernier export date de plus de 30 jours.',
    reminderTitleNever: 'Tes données ne sont enregistrées que dans ce navigateur.',
    reminderBody: 'Les données vivent dans ce navigateur. Un export les met à l’abri.',
    reminderDismiss: 'Plus tard',
    reminderLabel: 'Rappel de sauvegarde — balaie vers le haut pour l’écarter',

    updateAvailable: 'Une nouvelle version est prête.',
    updateAction: 'Recharger',
  },

  history: {
    title: 'Historique',
    trailing: 'Douze derniers mois',
    trailingEmpty: 'Pas encore assez de données pour tracer une courbe.',
    legendIn: 'Entrées',
    legendOut: 'Sorties',
    legendBalance: 'Solde',
    compare: 'Comparer deux mois',
    compareLeft: 'Mois de référence',
    compareRight: 'Mois comparé',
    compareEmpty: 'Ces deux mois n’ont aucune sortie à comparer.',
    compareSingleMonth:
      'Un seul mois de données pour l’instant. La comparaison arrivera avec le deuxième.',
    category: 'Catégorie',
    delta: 'Écart',
    years: 'Comparer deux années',
    year: 'Année',
    yearsEmpty: 'Pas encore d’année complète à comparer.',
    yearCurrent: '%s',
    yearPrevious: '%s',
    cumulative: 'Cumul du solde, mois après mois',
    srTrailing: 'Solde mensuel : %s',
    srYears: 'Cumul %s contre %s : %s',
    noData: 'Aucune donnée sur cette période.',
  },

  dashboard: {
    balance: 'Solde du mois',
    income: 'Revenus',
    incomeLeft: 'dont %s encore à venir',
    incomeAllIn: 'tout est déjà rentré',
    incomeNone: 'aucun revenu ce mois-ci',
    charges: 'Charges',
    chargesLeft: 'reste %s à payer',
    chargesAllPaid: 'tout est payé',
    chargesNone: 'rien à payer ce mois-ci',
    forecast: 'Prévisionnel',
    forecastHint: 'échéances prévues comprises',
    remaining: 'Reste à vivre',
    remainingHint: 'jusqu’à la prochaine rentrée d’argent',
    remainingNoIncome: 'jusqu’à la fin du mois',
    breakdown: 'Répartition',
    breakdownHint: 'sorties du mois',
    upcoming: 'Prochaines échéances',
    subscriptions: 'Récurrences',
    subscriptionsHint: '%s par an',
    inflow: 'Entrées',
    outflow: 'Sorties',
    noBreakdown: 'Aucune sortie ce mois-ci.',
    noUpcoming: 'Plus d’échéance ce mois-ci.',
    progress: 'Jour %s sur %s',
    monthAhead: 'Mois à venir',
    monthDone: 'Mois terminé',
    capacity: 'Capacité d’épargne',
    capacityHint: 'ressources − charges − crédits',
    /* La seconde lecture porte le reste à placer, et non le taux d'épargne : le
       taux décrit le mois passé, le reste appelle un geste — c'est lui qui fait
       ouvrir l'écran. Le taux s'y lit, à côté de sa ventilation. */
    savingLeft: 'reste %s à placer',
    showSavings: 'Voir où placer %s',
    spending: 'Où part l’argent',
    spendingHint: 'charges et crédits, hors épargne',
    savedThisMonth: 'Mis de côté : %s',
    credits: 'Crédits',
    creditsRemaining: 'capital restant dû',
    noCredits: 'Aucun crédit en cours.',
    split: 'Répartition',
    splitHint: 'charges communes du mois',

    /* La contrepartie de la tuile Répartition, sous un filtre par membre :
       celle-ci montre les parts de tout le monde, celle-là ce que la personne
       filtrée porte du pot commun — et le coefficient qui le produit, qui
       n'apparaissait nulle part sur son mois.

       Le montant à virer est le chiffre de tête, et non une ligne parmi trois.
       C'est le geste que la tuile sert : un virement sur le compte joint, dont
       la somme se recopie telle quelle. Le total des charges communes du foyer
       en est parti — c'est un chiffre qu'on ne doit pas, et il se lit encore
       sur l'écran Répartition, qui est fait pour ça. */
    memberShare: 'Part du foyer',
    memberShareToTransfer: 'À verser sur le commun',
    memberShareOwn: 'Charges perso',
    memberShareTotal: 'Total à payer',
    memberShareHint: 'au prorata des revenus',
    srMemberShare: '%s porte %s des charges communes, soit %s à verser. Avec %s de charges personnelles, le mois lui coûte %s.',

    /* Quatre soldes qui se ressemblent à l'œil sans dire la même chose. Chacun
       dit son calcul, puis ce qui le sépare de son voisin — c'est la question
       qu'on se pose devant la grille, pas la définition isolée. */
    explain: 'Comprendre : %s',
    /* Les deux flux, eux, ne s'expliquent pas : ils mènent à leurs lignes. Un
       total dont on peut lire le détail n'a pas besoin qu'on le définisse. */
    showLines: 'Voir les lignes : %s',
    info: {
      /* La phrase avant le calcul : lire d'abord la formule, c'est ouvrir sur
         du vocabulaire qu'on n'a pas encore de quoi comprendre. */
      calculationLabel: 'Le calcul',
      apartLabel: 'Ce qui le distingue',
      balance: {
        lead: 'Ce qui a réellement eu lieu ce mois-ci, et rien d’autre.',
        calculation: 'Les entrées confirmées, moins les sorties confirmées.',
        apart:
          'Une échéance encore prévue n’y compte pas : elle n’a pas eu lieu. C’est toute la différence avec le prévisionnel, qui les compte.',
      },
      forecast: {
        lead: 'Là où le mois atterrit si tout ce qui est prévu se passe comme prévu.',
        calculation: 'Le solde du mois, plus les échéances encore prévues, des deux côtés.',
        apart:
          'Le solde du mois s’en tient à ce qui a eu lieu ; celui-ci y ajoute ce qui doit encore tomber. En début de mois les deux sont très éloignés — c’est normal, presque rien n’a encore eu lieu.',
      },
      remaining: {
        lead: 'Ce dont tu disposes d’ici la prochaine rentrée d’argent, une fois payé tout ce qui tombe avant elle.',
        calculation: 'Le prévisionnel, arrêté la veille de la prochaine rentrée d’argent.',
        apart:
          'C’est le prévisionnel arrêté plus tôt : lui va jusqu’au bout du mois, celui-ci s’arrête au prochain salaire. Sans rentrée en vue, les deux se rejoignent — l’horizon devient la fin du mois.',
      },
      /* La capacité d'épargne n'a plus sa feuille : elle ouvre son écran, où le
         calcul est posé terme par terme et suivi de ce qu'il reste à placer.
         Devant un chiffre qui appelle un geste, définir n'était pas la
         réponse. */
    },
    srBreakdown: 'Répartition des sorties : %s',
    empty: 'Ce mois est encore vide. Ouvre-le, ou ajoute une dépense.',
  },

  calendar: {
    title: 'Calendrier',
    dayLabel: '%s — %s',
    noEntry: 'aucune échéance',
    oneEntry: '1 échéance',
    someEntries: '%s échéances',
    selected: 'Jour sélectionné',
    emptyDay: 'Rien ce jour-là.',
    empty: 'Aucune échéance ce mois-ci.',
    more: '+%s',
    today: 'Aujourd’hui',
    closeDay: 'Fermer le jour',
  },

  month: {
    title: 'Le mois',
    toConfirm: 'À confirmer',
    confirmAll: 'Confirmer le mois',
    confirmedAll: 'Mois confirmé',
    confirmOne: 'Confirmer',
    confirmedOne: 'Échéance confirmée',
    /* Sur la ligne elle-même, à côté du champ : une explication en tête de
       section est oubliée le temps d'arriver au champ qu'elle décrit. */
    toFill: 'à saisir',
    confirmAllHint: 'Les montants à saisir restent à confirmer un par un.',
    openEntry: 'Modifier %s',
    done: 'Tout est confirmé pour ce mois.',
    entries: 'Ce mois',
    empty: 'Rien pour ce mois. Ajoute ta première dépense.',
    groupBy: 'Regrouper par',
    byDay: 'Jour',
    byCategory: 'Catégorie',
    byMember: 'Personne',
    /* Le sens ne regroupe pas, il filtre. Un axe de plus aurait rendu une
       lecture — deux blocs dont le tableau de bord donne déjà les totaux ;
       un filtre les multiplie, puisqu'il se combine aux trois axes : les
       charges par poste, les revenus par personne, les charges au jour le
       jour. Les mots sont ceux des deux tuiles, juste au-dessus. */
    show: 'Montrer',
    showAll: 'Tout',
    showOut: 'Charges',
    showIn: 'Revenus',
    showEmptyOut: 'Aucune charge confirmée ce mois-ci.',
    showEmptyIn: 'Aucun revenu confirmé ce mois-ci.',
    groupCountOne: '%s ligne',
    groupCount: '%s lignes',
    collapseAll: 'Tout replier',
    expandAll: 'Tout déplier',
    balance: 'Solde',
    forecast: 'Prévisionnel',
    remaining: 'Reste à vivre',
    progress: 'Progression',
    dayOf: 'jour %s sur %s',
  },

  entry: {
    add: 'Ajouter une dépense',
    addOut: 'Ajouter une dépense',
    addIn: 'Ajouter un revenu',
    /* Formes courtes des barres d'action, où les deux sens tiennent côte à
       côte. Le sens ne se devine plus derrière un libellé unique. */
    newOut: 'Dépense',
    newIn: 'Revenu',
    edit: 'Modifier l’entrée',
    editOut: 'Modifier la dépense',
    editIn: 'Modifier le revenu',
    addedOut: 'Dépense ajoutée',
    addedIn: 'Revenu ajouté',
    updatedOut: 'Dépense modifiée',
    updatedIn: 'Revenu modifié',
    removedOut: 'Dépense supprimée',
    removedIn: 'Revenu supprimé',
    remove: 'Supprimer l’entrée',
    amount: 'Montant',
    category: 'Catégorie',
    date: 'Date',
    label: 'Libellé',
    labelPlaceholder: 'Courses',
    categoryPlaceholder: 'Choisis une catégorie',
    shared: 'Charge commune, à partager entre les membres',
    sharedHint: 'Elle entre dans la répartition au prorata des revenus.',
    member: 'Membre',
    note: 'Note',
    direction: 'Sens',
    amountRequired: 'Indique un montant supérieur à zéro.',
    categoryRequired: 'Choisis une catégorie.',
    labelRequired: 'Donne un libellé à cette entrée.',
    /* Sans propriétaire ni partage, la ligne n'apparaîtrait dans le mois de
       personne, et la somme des soldes cesserait de valoir celui du foyer. */
    memberRequired:
      'Dis à qui est cette ligne : elle n’entre pas dans les charges communes, donc sans propriétaire elle n’apparaîtrait dans le mois de personne.',
    planned: 'Prévue',
    confirmed: 'Confirmée',

    /* Ponctuel ou récurrent — la bascule du cahier §4.4. */
    rhythm: 'Rythme',
    once: 'Ponctuel',
    recurring: 'Récurrence',
    firstDate: 'Première échéance',
    recurringHint:
      'Celle-ci est enregistrée comme payée, les suivantes arrivent à confirmer chaque mois.',
  },

  recurrences: {
    title: 'Récurrences',
    add: 'Ajouter une récurrence',
    edit: 'Modifier la récurrence',
    added: 'Récurrence ajoutée',
    updated: 'Récurrence modifiée',
    resumed: 'Récurrence reprise',
    deleted: 'Récurrence supprimée',
    empty: 'Aucune récurrence pour l’instant. Ajoute la première.',
    /* La seule porte des crédits était une tuile du mois qui se retire tant
       qu'aucun crédit n'est suivi : on ne pouvait donc jamais créer le premier.
       Elle est ici, parce que c'est une récurrence qui pose les mensualités. */
    creditsHint: 'Une mensualité de crédit est une récurrence comme une autre. Pour suivre en plus le capital qu’il reste à devoir :',
    emptyStopped: 'Aucune récurrence arrêtée.',
    showStopped: 'Voir les récurrences arrêtées',
    hideStopped: 'Masquer les récurrences arrêtées',
    stoppedBadge: 'Arrêtée',
    nextDue: 'Prochaine échéance',
    noNextDue: 'Plus d’échéance',
    monthlyCost: 'Par mois',
    annualCost: 'Par an',
    perYear: '%s par an',
    totalMonthly: 'Total récurrences',
    totalAnnual: 'Total annuel',
    perMonth: '%s par mois',
    /* Le sens en titre de section : dans une liste qui les mêle, le « + » des
       entrées ne suffit pas à distinguer un salaire d'une charge. */
    inflow: 'Ce qui rentre',
    outflow: 'Ce qui sort',
    groupBy: 'Regrouper par',
    bySense: 'Sens',
    byCategory: 'Catégorie',
    byMember: 'Personne',
    groupCountOne: '%s récurrence',
    groupCount: '%s récurrences',
    collapseAll: 'Tout replier',
    expandAll: 'Tout déplier',
    unknownAmounts: '%s à montant variable, non chiffré%s',
    variable: 'Montant variable',
    variableHint: 'Le montant sera demandé à chaque échéance.',
    fixedAmount: 'Montant fixe',
    priceChanged: 'Le prix a changé : %s → %s',
    priceChangedSince: 'depuis le %s',
    stop: 'Arrêter la récurrence',
    stopped: 'Récurrence arrêtée',
    resume: 'Reprendre la récurrence',
    remove: 'Supprimer la récurrence',
    removeConfirm:
      'Les échéances déjà confirmées sont conservées. Supprimer cette récurrence ?',
    stopHint: 'Les échéances déjà confirmées restent dans l’historique.',
    form: {
      label: 'Libellé',
      labelPlaceholder: 'Loyer',
      direction: 'Sens',
      category: 'Catégorie',
      member: 'Membre',
      amount: 'Montant',
      amountKind: 'Type de montant',
      /* Un montant variable ne vaut rien tant qu'aucune échéance n'est tombée.
         Pour un salaire, ça suffit à laisser tout le foyer sans répartition :
         ce champ est le seul endroit où l'on peut s'avancer avant. */
      estimate: 'Montant habituel',
      estimateHint:
        'Sert d’ordre de grandeur — pour le total des récurrences, et pour répartir les charges communes au prorata s’il s’agit d’un revenu. Chaque échéance chiffrée prend aussitôt le dessus.',
      period: 'Périodicité',
      everyMonths: 'Tous les combien de mois',
      weekday: 'Jour de la semaine',
      monthDay: 'Jour du mois',
      startedOn: 'Première échéance',
      note: 'Note',
      notePlaceholder: 'Résiliable en ligne',
      categoryPlaceholder: 'Choisis une catégorie',
      shared: 'Charge commune, à partager entre les membres',
      labelRequired: 'Donne un libellé à cette récurrence.',
      amountRequired: 'Indique un montant, ou choisis « montant variable ».',
      categoryRequired: 'Choisis une catégorie.',
      /* Une récurrence pose une échéance par mois : sans propriétaire ni
         partage, il creuse le trou à chaque fois. */
      memberRequired:
        'Dis à qui est cette récurrence : elle n’entre pas dans les charges communes, donc sans propriétaire ses échéances n’apparaîtraient dans le mois de personne.',
      monthDayHint: 'Un jour qui n’existe pas est ramené au dernier jour du mois.',
    },
    periods: {
      weekly: 'Hebdomadaire',
      monthly: 'Mensuelle',
      quarterly: 'Trimestrielle',
      yearly: 'Annuelle',
      everyNMonths: 'Tous les n mois',
    },
    summary: {
      weekly: 'chaque %s',
      monthly: 'le %s de chaque mois',
      everyN: 'le %s, tous les %s mois',
      yearly: 'chaque année le %s',
    },
  },

  split: {
    title: 'Répartition',
    subtitle: 'Ce que chacun verse sur les charges communes, au prorata des revenus.',
    total: 'Charges communes',
    totalHint: 'échéances prévues comprises',
    share: 'Part',
    due: 'À verser',
    income: 'Revenu',
    checkTotal: 'Total des parts',
    checkHint: 'La somme des parts vaut le total au centime près.',
    detail: 'Ce qui est partagé',
    detailCountOne: '%s ligne',
    detailCount: '%s lignes',
    advancedBy: 'avancé par %s',
    method: 'Comment c’est calculé',
    methodFormula: 'Part de chacun = son revenu ÷ revenus du foyer.',
    /* Le revenu est dérivé des récurrences de ressources, jamais déclaré à
       part : une seconde vérité finirait par diverger de la première. */
    methodIncome:
      'Le revenu vient des récurrences de salaire et d’allocation de chacun, ramenées au mois. Une prime ponctuelle ne le déplace pas — elle a lieu, mais elle ne dit rien de ce qu’on gagne.',
    methodVariable:
      'Un salaire à montant variable vaut sa dernière échéance chiffrée, à défaut son montant habituel. Une récurrence laissée « tout le foyer » ne compte dans le revenu de personne.',
    methodIncluded: 'Les charges et les crédits que personne ne s’est attribués.',
    methodFlagged: 'Les dépenses cochées « à partager ».',
    methodExcluded:
      'L’épargne n’est pas partagée : elle sort du compte, mais elle reste à qui la met de côté.',
    nothing: 'Aucune charge commune ce mois-ci.',
    /* Ce qui manque est nommé plutôt que remplacé par un zéro : un prorata au
       dénominateur incomplet ne vaut pas zéro, il ne veut rien dire. */
    /* Le « de » vit dans le nom, pas dans le gabarit : « d'Alice » et
       « de Camille » ne s'écrivent pas pareil, et la phrase ne peut pas
       en décider — c'est `SplitPage` qui l'élide. */
    missingOne: 'Ajoute le revenu %s pour répartir les charges.',
    missingMany: 'Ajoute les revenus %s pour répartir les charges.',
    /* Chacun porte bien une ressource, mais toutes à zéro : personne n'est à
       nommer, et le prorata n'a pas de dénominateur pour autant. */
    missingNone: 'Ajoute un revenu à chacun pour répartir les charges.',
    missingHint:
      'Une récurrence de salaire ou d’allocation à son nom suffit. À montant variable, elle se lit sur la dernière échéance chiffrée.',
    /* Le cas où la récurrence existe déjà : envoyer « ajouter un revenu » ferait
       créer un doublon là où il ne manque qu'un chiffre. Le « de » s'élide
       comme au-dessus, et pour la même raison. */
    unpricedOne: 'Le revenu %s est à montant variable et pas encore chiffré.',
    unpricedMany: 'Les revenus %s sont à montant variable et pas encore chiffrés.',
    unpricedHint:
      'Confirme une échéance, ou indique un montant habituel sur la récurrence : la répartition se calcule dès qu’un chiffre existe.',
    goToIncome: 'Ajouter un revenu',
    goToSubscriptions: 'Voir les récurrences',
    soloTitle: 'La répartition demande au moins deux membres.',
    soloHint: 'Ajoute quelqu’un au foyer pour partager les charges.',
    goToSettings: 'Aller aux réglages',
    srShares: 'Parts de chacun : %s',
  },

  savings: {
    title: 'Épargne',
    subtitle: 'Ce que le mois dégage, et où ça se place.',

    /* La cascade, terme par terme. Le résultat seul se croit sur parole ; les
       trois lignes qui le produisent se vérifient, et disent surtout *quoi
       changer* — un crédit qui mange la moitié de la capacité se voit ici, et
       nulle part ailleurs. */
    flow: 'Ce que le mois dégage',
    flowIncome: 'Revenus',
    flowCharges: 'Charges',
    flowDebts: 'Crédits',
    capacity: 'Capacité d’épargne',
    capacityHint: 'échéances prévues comprises',
    capacityNegative: 'Les charges dépassent les revenus : il n’y a rien à placer ce mois-ci.',

    placed: 'Où ça se place',
    placedTotal: 'Versé ce mois',
    placedEmpty: 'Aucun versement ce mois-ci.',
    /* Un versement au foyer entier n'est à personne, et l'épargne ne se partage
       pas : il ne compte donc dans la capacité de personne. C'est le pendant
       exact du salaire resté « tout le foyer » sur la répartition. */
    placedUnassigned:
      'Un versement laissé « tout le foyer » n’entre dans l’épargne de personne. Attribue-le pour qu’il compte.',

    left: 'Reste à placer',
    leftHint: 'capacité − versements',
    leftNone: 'Toute la capacité est placée.',
    /* Verser plus qu'on ne dégage n'est pas une erreur de saisie : c'est une
       lecture, et celle qu'on vient chercher. */
    over: 'Dépassement',
    overHint: 'les versements dépassent la capacité de %s',
    rate: '%s des ressources mises de côté',
    rateNone: 'aucune ressource ce mois-ci',

    /* Chacun décide sur son compte : une somme des capacités ne se place nulle
       part. Hors filtre, l'écran montre donc les colonnes plutôt qu'un total. */
    byMember: 'Chacun de son côté',
    byMemberHint: 'L’épargne ne se partage pas : chacun place ce qu’il dégage.',

    method: 'Comment c’est calculé',
    methodFormula: 'Capacité = revenus − charges − crédits.',
    methodExcluded:
      'Un versement n’est pas une charge : il sort du compte, mais il reste à qui le fait. Il ne pèse donc ni dans les charges du mois, ni dans le partage du foyer.',
    methodShared:
      'Sous un filtre, la capacité tient compte de la part des charges communes que la personne porte — au prorata des revenus, comme partout ailleurs.',
    methodBalance:
      'Le solde du mois, lui, compte le versement comme une sortie : c’est exact en trésorerie, et c’est pour ça que les deux chiffres diffèrent.',

    empty: 'Rien à placer tant que le mois n’a ni revenu ni charge.',
    srMemberSaving: '%s dégage %s, en place %s, il lui reste %s.',
  },

  credits: {
    title: 'Crédits et dettes',
    add: 'Ajouter un crédit',
    edit: 'Modifier le crédit',
    added: 'Crédit ajouté',
    updated: 'Crédit modifié',
    removed: 'Crédit retiré du suivi',
    remove: 'Retirer du suivi',
    removeConfirm:
      'Les mensualités déjà versées sont conservées, ainsi que la récurrence qui les pose. Seul le suivi du capital s’arrête. Retirer ce crédit ?',
    empty: 'Aucun crédit suivi. Ajoute le premier pour voir ce qu’il te reste à devoir.',
    remaining: 'Capital restant dû',
    principal: 'Capital emprunté',
    paid: 'Déjà versé',
    monthly: 'Mensualité',
    rate: 'Taux annuel',
    ratePlaceholder: '4,5',
    rateHint: 'Laisse vide pour un prêt sans intérêt : le capital décroît alors du montant versé, exactement.',
    startedOn: 'Première mensualité',
    endsOn: 'Dernière mensualité',
    monthsLeft: '%s mensualité%s restante%s',
    settled: 'Soldé',
    linked: 'Récurrence qui le rembourse',
    linkedNone: 'Aucun — le capital ne bougera pas',
    linkedHint:
      'C’est la récurrence qui pose les mensualités et fait décroître le capital. Sans elle, seul le montant emprunté est connu.',
    total: 'Reste à devoir',
    totalMonthly: 'Mensualités',
    progress: '%s remboursé',
    labelPlaceholder: 'Prêt voiture',
    principalRequired: 'Indique le capital emprunté.',
    labelRequired: 'Donne un libellé à ce crédit.',
    categoryRequired: 'Choisis une catégorie.',
  },

  onboarding: {
    step: 'Étape %s sur 2',
    householdTitle: 'Comment s’appelle ton foyer ?',
    householdHint: 'Tu pourras le changer plus tard.',
    householdLabel: 'Nom du foyer',
    householdPlaceholder: 'Maison',
    householdEmpty: 'Donne un nom à ton foyer pour continuer.',
    membersTitle: 'Qui vit ici ?',
    membersHint:
      'Les membres servent d’étiquette sur les dépenses. Tu peux passer et rester en solo.',
    membersLabel: 'Prénom',
    membersPlaceholder: 'Alix',
    membersAdd: 'Ajouter',
    membersEmpty: 'Personne pour l’instant. Ajoute un prénom, ou passe.',
    membersRename: 'Prénom de %s',
    membersRemove: 'Retirer %s',
    solo: 'Je suis seul·e',
    start: 'Commencer',
    importHint: 'Tu as déjà un fichier Settled ? Restaure-le sans passer par ici.',
    privacy: 'Tes données restent sur cet appareil. Rien n’est envoyé nulle part.',
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
      icons: 'Icônes',
      kinds: 'Natures',
      bento: 'Grille bento',
    },
    baseNote: 'Ces valeurs ne sont jamais consommées directement par un composant.',
    semanticNote: 'La seule couche que les composants consomment.',
    categoriesNote:
      'Six teintes, dans cet ordre. Au-delà, les suivantes basculent en gris sous « Autres ».',
    typeNote: 'Archivo pour ce qui se lit, Geist Mono pour les libellés utilitaires.',
    shapesNote: 'Base 4px. Mouvement 160ms, 240ms à l’entrée d’une vue.',
    bentoNote: 'Formats autorisés : 2×1, 2×2, 4×1, 4×2, 6×2. Rien d’autre.',
    iconsNote:
      'Phosphor, graisse bold. Deux emplois et pas un de plus : agir, ou se repérer.',
    iconAction: 'Action — sur un contrôle',
    iconMarker: 'Repère — onglet, tuile, section',
    kindsNote:
      'Le sens dit si l’argent entre ou sort ; la nature dit ce qu’il devient. Une famille porte la nature, ses catégories en héritent.',
    themePreview: 'Aperçu forcé',
    sampleAmount: 'Montant',
    sampleRing: 'Anneau',
    sampleEmpty: 'Aucune récurrence pour l’instant. Ajoute la première.',
    sampleEmptyAction: 'Ajouter une récurrence',
    variants: 'Variantes',
    states: 'États',
  },

  /** Les quatre natures, telles qu'elles se disent à l'écran. */
  kinds: {
    resource: 'Ressources',
    charge: 'Charges',
    debt: 'Crédits et dettes',
    saving: 'Versements',
    resourceShort: 'Ressources',
    chargeShort: 'Charges',
    debtShort: 'Crédits',
    savingShort: 'Épargne',
  },

  /**
   * Jeu de familles et de catégories créé au premier lancement, modifiable
   * ensuite. Les libellés suivent le vocabulaire d'un budget familial, pas
   * celui d'un plan comptable.
   */
  defaultFamilies: {
    resources: 'Ressources',
    housing: 'Logement',
    communication: 'Communication',
    transport: 'Transport',
    daily: 'Vie courante',
    health: 'Santé',
    family: 'Famille et scolarité',
    taxes: 'Impôts et taxes',
    leisure: 'Loisirs et divers',
    credits: 'Crédits et dettes',
    savings: 'Versements',
  },

  defaultCategories: {
    // Ressources
    salary: 'Salaires, retraites ou indemnités',
    benefits: 'Allocations diverses',
    familyBenefits: 'Prestations familiales',
    alimonyIn: 'Pensions alimentaires reçues',
    housingAid: 'Aide au logement',
    rentalIncome: 'Revenus fonciers',

    // Logement
    rent: 'Loyer et charges',
    energy: 'Énergies (électricité, gaz, eau)',
    homeInsurance: 'Assurance habitation',
    housingTax: 'Taxe d’habitation',
    propertyTax: 'Taxe foncière',

    // Communication
    mobile: 'Téléphone mobile',
    internet: 'Internet et téléphone fixe',
    streaming: 'Abonnements TV et streaming',

    // Transport
    fuel: 'Carburant',
    carInsurance: 'Assurance véhicule',
    carMaintenance: 'Entretien et réparations',
    publicTransport: 'Transports en commun',
    tolls: 'Péages et stationnement',

    // Vie courante
    groceries: 'Alimentation',
    clothing: 'Habillement',
    household: 'Produits d’entretien',
    hygiene: 'Coiffure et hygiène',

    // Santé
    healthInsurance: 'Mutuelle',
    medical: 'Frais médicaux',
    pharmacy: 'Pharmacie',

    // Famille et scolarité
    childcare: 'Frais de garde',
    school: 'Scolarité et études',
    alimonyOut: 'Pensions alimentaires versées',
    childActivities: 'Activités des enfants',

    // Impôts et taxes
    incomeTax: 'Impôt sur le revenu',
    otherTaxes: 'Redevance et autres taxes',

    // Loisirs et divers
    outings: 'Sorties et vacances',
    culture: 'Sport et culture',
    gifts: 'Dons et cadeaux',
    misc: 'Divers',

    // Crédits et dettes
    carLoan: 'Automobile',
    mortgage: 'Immobilier',
    leasing: 'Location longue durée',
    consumerLoan: 'Crédits d’achat',
    otherLoan: 'Autres crédits',

    // Versements
    passbook: 'Livrets (A, LEP, CSL)',
    plans: 'Plans (PEL, PEA, compte-titres)',
    lifeInsurance: 'Assurance vie',
    retirement: 'Épargne retraite',
    companySavings: 'Épargne entreprise',

    // Conservées pour les documents antérieurs aux familles
    legacyLeisure: 'Loisirs',
    legacySubscriptions: 'Abonnements',
    otherIncome: 'Autres revenus',
  },

  defaults: {
    householdName: 'Maison',
  },

  a11y: {
    skipToContent: 'Aller au contenu',
    ringLabel: 'Anneau de progression',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
  },
} as const

export type Strings = typeof fr
