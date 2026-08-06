/* ============================================================================
 * Toutes les chaînes de l'app. Aucun composant n'écrit de texte en dur.
 * Français, casse normale, pas de majuscule décorative (DS §7).
 * ==========================================================================*/

export const fr = {
  app: {
    name: 'Tout compte fait',
    tagline: 'Les finances du foyer, sur ton appareil.',
  },

  landing: {
    /* La promesse est déjà `app.tagline` — la répéter ici en ferait une seconde
       vérité. Ce qui suit dit le mécanisme, parce que « suivi des finances du
       foyer » ne distingue cette app d'aucune autre. */
    intro:
      'Tu écris une fois ce qui revient chaque mois — loyer, abonnements, salaires. Le mois suivant s’ouvre déjà rempli de ce qui est prévu, et tu confirmes au fil de l’eau ce qui est réellement tombé.',
    /* Pas « Commencer » : c'est déjà le libellé du dernier bouton des deux
       questions (`onboarding.start`). Le DS §7 veut qu'une action garde son nom
       dans le flux — donc que deux actions différentes ne le partagent pas. */
    start: 'Créer mon foyer',
    open: 'Ouvrir mon mois',
    exampleHint: 'Juste voir à quoi ça ressemble ? Un foyer d’exemple, complet, en un clic.',
    privacy: 'Pas de compte, pas de serveur. Deux questions, et l’app est utilisable.',

    /* L'installation se propose juste sous cette phrase-là, et c'est le seul
       endroit où elle a un sens : « pas de serveur » vient d'être écrit, donc
       la question « et si je change de navigateur » vient d'être posée. Le
       texte dit ce que l'installation apporte — pas qu'elle est possible, ce
       que le bouton dit déjà.
       La purge de Safari est nommée en clair. Le cahier §5 la connaît, et une
       app dont toute la promesse est que les données restent sur l'appareil
       doit dire ce qui, sur cet appareil, peut les effacer. */
    installTitle: 'Installe-la sur ton appareil',
    installBody:
      'Elle s’ouvre en plein écran, fonctionne hors ligne, et surtout : un site non installé voit ses données effacées par Safari après une semaine sans visite. Installée, elle les garde.',
    installAction: 'Installer',

    /* L'app est hors-ligne d'abord et ne le disait jamais. Le chip ne s'affiche
       que hors ligne : en ligne, il n'aurait rien à apprendre. Il dit ce qui
       continue, pas ce qui manque — c'est une app dont c'est justement
       l'argument, pas un service en panne. */
    offline: 'Hors ligne — tout continue de fonctionner',

    /* Ce que portent les tuiles : une étiquette, un chiffre, une lecture
       secondaire. Le raisonnement de chacune est plus bas, en `principles`, où
       rien ne le coupe par le bas (DS §5). */
    monthTitle: 'Prévu, puis confirmé',
    monthHint: 'confirmé sur prévu',
    monthRing: 'Part du mois déjà confirmée',
    monthRingRead: '68 % du mois est confirmé, soit 1 240 € sur 1 820 €.',
    monthOf: '%s sur %s',
    incomeHint: 'salaires et allocations du mois',
    splitTitle: 'Chacun sa part',
    privacyTitle: 'Rien ne sort d’ici',
    privacyShort: 'Pas de compte, pas de serveur.',

    /* Les quatre idées qui font l'app, en prose et hors de la grille : elles
       demandent trois lignes chacune, et une tuile qui en porte trois n'est plus
       une tuile. */
    principles: 'Ce qui distingue cette app',
    monthBody:
      'Le mois s’ouvre seul avec tout ce qui revient. Tu coches ce qui est tombé ; le reste continue de s’afficher comme prévu, sans disparaître de la prévision.',
    splitBody:
      'Les charges communes se répartissent entre les membres au prorata de leurs revenus, et la somme des parts vaut exactement le total, au centime près. Ce qu’une seule personne a avancé se régularise le mois suivant.',
    privacyBody:
      'Pas de compte, pas de serveur, pas de mesure d’audience. Tes données vivent dans ce navigateur, et l’export est la seule porte de sortie — c’est toi qui l’ouvres.',

    /* Quatrième principe, et non plus une tuile. « QUATRE NATURES, UN SEUL
       FLUX » fait 28 caractères : sur une 4×1 à 320px, la pilule en demandait
       244 pour 246 disponibles. Deux pixels de marge, c'est-à-dire le même
       débordement que « CAPACITÉ D'ÉPARGNE », mais en sursis. En prose, l'idée
       a de toute façon la place d'être dite en entier. */
    kindsTitle: 'Quatre natures, un seul flux',
    kindsBody:
      'Rien n’est rangé en comptes bancaires : tout est une entrée ou une sortie, sous l’une des quatre natures. Le sens dit si l’argent entre ou sort, la nature dit ce qu’il devient — un virement sur un livret sort du compte comme un plein d’essence, mais l’un est déplacé et l’autre consommé.',

    /* La seule chose qui empêche la grille de mentir. En texte lisible et non
       en filigrane : un avertissement qu'on ne peut pas lire n'en est pas un. */
    sample: 'Les chiffres ci-dessus sont ceux d’un foyer d’exemple.',

    /* Deux, et non trois : la troisième — celle qui veut seulement voir — est
       servie tout en haut, à côté du bouton principal. C'est une porte d'entrée,
       pas un recours, et le même bouton deux fois sur un même écran ne se lit
       plus comme deux occasions mais comme une redite. */
    doors: 'Deux façons de ne pas commencer par une page blanche',
    /* Déplacées depuis `onboarding` avec les contrôles qu'elles décrivent : une
       clé qui ment sur son lieu d'emploi se retrouve un jour modifiée pour un
       écran qu'elle ne sert plus. */
    importTitle: 'Restaurer un export',
    importHint: 'Tu as déjà un fichier Tout compte fait ? Restaure-le sans passer par les questions.',
    schemaTitle: 'Partir de tes notes',
    schemaHint:
      'Tes comptes sont déjà écrits quelque part ? Donne ce schéma à un assistant avec tes notes, il t’en fera un fichier à importer.',
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
    /* Le retour arrière d'un message. Pas « Annuler » : c'est déjà le bouton
       qui ferme une boîte de dialogue, et les deux se seraient répondu dans la
       même — la raison qui fait dire « remettre à confirmer » plutôt
       qu'« annuler la confirmation ». « Rétablir » dit d'ailleurs ce qui se
       passe : l'état d'avant revient tel quel. */
    undo: 'Rétablir',
  },

  /* La garde de brouillon des quatre formulaires. La question dit ce qui se
     passe si l'on continue, jamais « êtes-vous sûr » (cahier §4.8), et le verbe
     qui reste n'est pas « Annuler » : on arrive dans cette boîte en cliquant
     « Annuler » sur le formulaire, et le même mot y voudrait dire l'inverse. */
  unsaved: {
    title: 'Saisie non enregistrée',
    question: 'Ce que tu viens de saisir sera perdu.',
    leave: 'Abandonner',
    stay: 'Continuer la saisie',
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
    about: 'À propos',
    landing: 'La présentation',
  },

  shell: {
    loading: 'Ouverture de tes données',
    /* Le bouton flottant, sous 1024px. Il nomme ce qu'il ouvre — trois portes
       de saisie — et non « Ajouter », qui promettrait une action alors qu'il
       en propose trois. La fermeture porte son propre nom : le même bouton
       change de sens, il doit changer d'étiquette. */
    quickEntry: 'Saisir une ligne',
    quickEntryClose: 'Fermer les portes de saisie',
    quickEntryLabel: 'Portes de saisie',
    filterByMember: 'Filtrer par membre',
    /* « Tout le monde » sur le filtre, « Tout le foyer » sur la saisie : ce
       n'est pas la même chose, et une seule chaîne le disait des deux côtés.
       Ici c'est tout ce qui a eu lieu, le pot et les lignes de chacun ; là-bas
       c'est une ligne que personne ne porte, donc commune. Le filtre « Commun »
       rend la différence visible.
       Pas « Tout » non plus : la liste du mois porte déjà une pilule de ce nom,
       et deux « Tout » sur un même écran ne filtrent pas la même chose. */
    all: 'Tout le monde',
    common: 'Commun',
    commonNote:
      'Le pot commun seul, à son montant plein : les charges et les crédits que personne ne s’est attribués, plus ce qui est coché « à partager ». Aucune part n’est calculée ici — chacun verse la sienne sur l’écran Répartition.',
    everyone: 'Tout le foyer',
    /* Les chiffres d'un membre comprennent sa part des charges communes : sans
       elle, chacun se lirait comme s'il vivait sans loyer. La liste des
       échéances, elle, garde les lignes réelles — on confirme une échéance
       entière, jamais une part. */
    prorata: 'Chiffres à la part de %s : sa part des charges communes est comprise, au prorata des revenus. Les listes gardent les échéances entières.',
    /* Le membre seul porte 100 % sans qu'aucun revenu soit exigé : « au
       prorata des revenus » serait un mensonge poli, et la vraie information
       est ailleurs — ses chiffres sont ceux du foyer entier. */
    prorataSolo:
      'Seul du foyer, %s porte tout le commun : ses chiffres sont ceux du foyer entier. Les listes gardent les échéances entières.',
    prorataMissingOne:
      'Charges communes non réparties, faute de connaître le revenu de %s : seules les lignes à son nom sont comptées.',
    prorataMissingMany:
      'Charges communes non réparties, faute de connaître les revenus de %s : seules les lignes à son nom sont comptées.',
    prorataOnlyOwn:
      'Charges communes non réparties : seules les lignes à son nom sont comptées.',
    /* « Ce mois-ci » et non « Aujourd'hui » : on revient à un mois, pas à un
       jour, et le DS §7 veut que les libellés nomment ce qu'on manipule. Sur
       l'écran du calendrier, « Aujourd'hui » aurait de surcroît promis de
       ramener au jour, ce que ce bouton ne fait pas. */
    thisMonth: 'Ce mois-ci',
    /* En infobulle et non dans le libellé : le nom accessible d'un bouton doit
       contenir son texte visible, et « Revenir à août 2026 » ne contient pas
       « Ce mois-ci ». Le mois de destination reste utile à savoir avant de
       cliquer, il se dit donc en description. */
    thisMonthTitle: 'Revenir à %s',
  },

  /* La frontière avec le navigateur. Tout ce qui s'y passe mal doit se dire :
     les données ne vivent nulle part ailleurs, et un échec silencieux se
     découvre au moment où il est trop tard. Chaque message dit ce qui s'est
     passé et quoi faire — jamais « une erreur est survenue ». */
  storage: {
    readFailed:
      'Les données n’ont pas pu être lues. Tu peux repartir de zéro ou importer un export.',
    writeFailed: 'Les modifications ne s’enregistrent plus',
    writeFailedBody:
      'Ce que tu vois à l’écran est intact, mais plus rien ne s’écrit sur cet appareil. Exporte maintenant : c’est la seule copie qui survivra à la fermeture de l’onglet.',
    writeFailedLabel: 'Échec d’enregistrement',
    exportNow: 'Exporter maintenant',

    /* Les trois incidents de connexion. Chacun dit ce qu'il faut faire, et
       aucun ne dit « rechargez la page » sans expliquer pourquoi. */
    blocking:
      'Un autre onglet met la base à jour. Cet onglet-ci n’enregistre plus rien tant qu’il n’est pas rechargé.',
    blocked:
      'Un autre onglet utilise une version différente de l’app. Ferme-le, puis recharge cette page.',
    terminated:
      'Le navigateur a fermé la base sous l’app. Recharge la page — et exporte d’abord, par précaution.',
    readTimeout:
      'La base de données ne répond pas. Un autre onglet la bloque peut-être : ferme-le, puis recharge.',

    /* Ce que dit l'onglet qui n'était plus à jour. En passant, jamais en
       modale : il n'a rien perdu au-delà de ce qu'il tapait à l'instant, et
       l'arrêter pour le lui dire serait pire que le lui dire au vol. */
    otherTab: 'Mis à jour depuis un autre onglet.',
    otherTabCleared: 'Les données ont été effacées depuis un autre onglet.',

    /* Le chemin de sortie d'un document qu'on ne sait pas ouvrir. Les recours
       sont dans l'ordre de ce qu'ils sauvent : importer récupère, recharger ne
       coûte rien à essayer, effacer ne se défait pas. */
    recoverTitle: 'Tes données ne se lisent pas',
    recoverImport: 'Importer un export',
    recoverImportHint:
      'C’est le seul recours qui ne perd rien. Si tu as un fichier d’export, c’est le moment.',
    recoverRaw: 'Télécharger la copie brute',
    recoverRawHint:
      'Le contenu tel qu’il est stocké, avant toute lecture. Un document que cette version de l’app ne sait pas ouvrir n’est pas forcément perdu — garde-le avant d’effacer quoi que ce soit.',
    recoverRawEmpty: 'Il n’y a rien de stocké à copier.',
    recoverRawDone: 'Copie brute téléchargée',
    recoverReload: 'Recharger',
    recoverReloadHint:
      'Une base momentanément occupée se relit souvent au deuxième essai. Ça ne coûte rien.',
    discard: 'Effacer et repartir de zéro',
    discardHint:
      'En dernier. Ce qui est stocké part définitivement, et personne ne sait ce qu’il y avait dedans.',
    discardConfirm1:
      'Ce qui est stocké sur cet appareil sera effacé, sans qu’on ait pu le lire ni te dire ce qu’il contenait.',
    discardConfirm2: 'Il n’y a pas de retour. Tu as téléchargé la copie brute ?',
    discarded: 'Données effacées',

    /* L'écran de secours. Il n'a qu'une chose importante à faire faire, et ce
       n'est pas de comprendre ce qui s'est passé. */
    crashTitle: 'L’app s’est arrêtée',
    crashBody:
      'Tes données sont toujours là, sur cet appareil. Récupère-les d’abord : c’est le seul geste qui ne se rattrape pas si tu ne le fais pas maintenant.',
    crashExport: 'Récupérer mes données',
    crashExportEmpty: 'Il n’y a rien de stocké sur cet appareil.',
    crashExportFailed: 'La base n’a pas répondu. Recharge, puis réessaie.',
    crashReload: 'Recharger l’app',
    crashCaches: 'Réinstaller l’app',
    crashCachesHint:
      'Si l’écran revient cassé à chaque rechargement, c’est la version en cache qui est en cause. Ceci la retélécharge. Tes données ne sont pas touchées : elles ne vivent pas dans le cache.',

    /* La section des réglages. Elle parle de **ce navigateur** — la place qu'il
       prête, ce qu'il promet de garder — là où « Données » parle des fichiers
       qui en sortent. */
    title: 'Sur cet appareil',
    persisted: 'Le navigateur s’est engagé à garder tes données.',
    notPersisted:
      'Le navigateur n’a rien promis : il peut effacer tes données s’il manque de place. Un export régulier reste la vraie protection.',
    persistAsk: 'Demander à les garder',
    persistGranted: 'C’est accordé.',
    persistRefused: 'Le navigateur a refusé. Rien n’est perdu — exporte plus souvent.',
    usage: '%s occupés sur %s disponibles.',
    usageUnknown: 'Ce navigateur ne dit pas la place qu’il te laisse.',

    backups: 'Sauvegardes locales',
    backupsHint:
      'Une sauvegarde par jour de saisie, les cinq dernières. Chacune porte l’état d’avant les modifications du jour. Elles vivent dans ce navigateur : elles ne remplacent pas un export.',
    backupsEmpty: 'Aucune sauvegarde pour l’instant. La première arrive à la prochaine journée de saisie.',
    backupContents: '%s entrées, %s récurrences',
    backupRestore: 'Restaurer',
    backupConfirm1:
      'Cette sauvegarde remplacera intégralement les données actuelles — %s, du %s.',
    backupConfirm2: 'Tout ce qui a été saisi depuis sera perdu.',
    backupRestored: 'Sauvegarde restaurée',
  },

  settings: {
    themeHint: 'Le thème suit ton système, ou reste sur ton choix.',

    currency: 'Devise',
    /* La phrase dit surtout ce que ce réglage **ne fait pas**. Un sélecteur de
       devise invite à croire qu'on convertit ; l'app ne convertit rien et ne le
       fera pas — le cahier §2 laisse la multi-devise hors v1. Ne rien dire
       aurait laissé quelqu'un changer de devise en pensant que ses montants
       suivraient. */
    currencyHint:
      'Le symbole sous lequel tes montants s’affichent. Rien n’est converti : les chiffres saisis restent les mêmes.',
    aboutLink: 'Le projet, le code et la licence',

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
    memberRemoved: '%s a été retiré du foyer',
    memberRemoveHint: 'Ses entrées sont conservées, simplement sans étiquette.',
    memberRemoveConfirm:
      'Ses entrées et ses récurrences repassent au foyer : rien n’est effacé. Retirer %s ?',
    /* Une avance est toujours à quelqu'un : elle ne peut pas repasser au foyer
       comme le reste, donc elle part. C'est la seule chose que ce geste efface,
       et la question ne peut pas la taire — les mensualités déjà revenues sur
       le livret, elles, restent. */
    memberRemoveConfirmAdvanceOne:
      'Ses entrées et ses récurrences repassent au foyer. Son avance, elle, ne peut appartenir à personne : elle est supprimée, ses mensualités déjà versées restent. Retirer %s ?',
    memberRemoveConfirmAdvances:
      'Ses entrées et ses récurrences repassent au foyer. Ses %s avances, elles, ne peuvent appartenir à personne : elles sont supprimées, leurs mensualités déjà versées restent. Retirer %s ?',
    membersEmpty: 'Aucun membre. Le foyer fonctionne très bien en solo.',
    /* Le revenu ne se saisit pas ici : il se lit sur les récurrences de
       ressources du membre. Le stocker à côté en ferait une seconde vérité.
       Reste à dire *pourquoi* il ne se lit pas, quand c'est le cas : les deux
       causes n'appellent pas le même geste, et « aucun revenu enregistré »
       envoyait créer une récurrence qui existait déjà. */
    memberNoIncome: 'aucun revenu enregistré',
    memberIncomeUnpriced: 'revenu à montant variable, pas encore chiffré',
    memberIncomeUnpricedFix: 'Indiquer un montant habituel',
    /* Un revenu chiffré à zéro n'est pas un revenu de zéro : c'est un chiffre
       qu'on ne sait pas lire. Sans ce message, la personne se voyait attribuer
       0 % des charges communes — un résultat, donc introuvable. */
    memberIncomeZero: 'revenu déclaré à zéro',
    memberIncomeZeroFix: 'Corriger le montant',
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
    /* Quarante-six catégories sous onze familles repliées : retrouver
       « Carburant » demandait de deviner qu'elle est rangée sous Transport. */
    categorySearch: 'Rechercher une catégorie',
    categorySearchPlaceholder: 'Carburant',
    categorySearchEmpty: 'Aucune catégorie ne correspond à « %s ».',

    data: 'Données',
    export: 'Exporter mes données',
    exportHint: 'Un fichier .json contenant tout, à ranger où tu veux.',
    exported: 'Export téléchargé',
    lastExport: 'Dernier export : %s',
    neverExported: 'Jamais exporté.',
    import: 'Importer un fichier',
    importHint: 'Remplace intégralement les données actuelles.',
    importConfirm: 'Remplacer toutes les données par ce fichier ?',
    /* Un import est un effacement déguisé : le fichier arrive, tout le reste
       part. Il se confirme donc deux fois, comme un remplacement, sans aller
       jusqu'aux trois de la réinitialisation — il reste quelque chose après. */
    importConfirm2: 'Le foyer, les récurrences et les entrées actuels seront perdus. Confirmer ?',
    imported: 'Données importées',
    importMigrated: 'Données importées et mises à jour depuis un format plus ancien',
    /* Un import qui n'aboutit pas et qui ne le dit pas est la pire des pertes :
       on vient d'accepter d'effacer ce qu'il remplace. */
    importFailed: 'L’import n’a pas abouti. Recharge la page avant de réessayer.',

    /* Ce que la lecture a écarté et réparé, dit avant qu'on confirme.
       Jusqu'ici une dépense illisible disparaissait en silence dans un geste
       qui remplace tout le document : le meilleur moyen de ne jamais s'en
       apercevoir, puisque le fichier, lui, a l'air d'être passé. */
    reportDiscardedOne: '1 ligne ne sera pas importée :',
    reportDiscarded: '%s lignes ne seront pas importées :',
    reportRepairedOne: '1 lien ne menait nulle part et a été rattaché :',
    reportRepaired: '%s liens ne menaient nulle part et ont été rattachés :',
    reportMore: '… et %s de plus.',
    /* « Entrée « Loyer » — montant illisible », ou son rang à défaut de nom. */
    reportLine: '%s — %s',
    reportNamed: '%s « %s »',
    reportRanked: '%s n° %s',

    reportCollection: {
      members: 'Membre',
      families: 'Famille',
      categories: 'Catégorie',
      recurrences: 'Récurrence',
      entries: 'Entrée',
      debts: 'Crédit',
      advances: 'Avance',
      months: 'Mois',
    },
    reportReason: {
      shape: 'ligne illisible',
      amount: 'montant illisible',
      principal: 'capital illisible',
      date: 'date inexistante',
      month: 'mois inexistant',
      noMember: 'sans personne à qui elle est',
      period: 'période à l’envers',
      duplicateId: 'identifiant en double',
      unknownCategory: 'catégorie introuvable, rangée dans « À ranger »',
      unknownFamily: 'famille introuvable',
      unknownMember: 'membre introuvable, rendue au foyer',
      unknownRecurrence: 'récurrence introuvable, lien retiré',
    },

    /* Le pendant de l'import : le seul moyen d'obtenir un fichier importable
       était jusqu'ici d'avoir déjà saisi ce qu'on cherche à saisir. */
    schema: 'Schéma de données',
    schemaHint:
      'Le modèle complet, à donner à un assistant avec tes notes : il te rendra un fichier à importer ici.',
    schemaCopy: 'Copier le schéma',
    schemaDownload: 'Télécharger le schéma',
    schemaCopied: 'Schéma copié',
    schemaCopyFailed: 'La copie a échoué. Télécharge le fichier à la place.',
    /* Les deux modules chargés à la demande. Hors ligne, la requête échoue et
       les boutons restaient désactivés pour toujours, sans un mot. */
    schemaUnavailable: 'Le schéma n’a pas pu être chargé. Vérifie ta connexion, puis recharge.',

    example: 'Jeu d’exemple',
    exampleHint:
      'Un foyer complet — deux salaires, trois crédits, une avance, plus d’un an d’historique — pour voir l’app pleine sans rien saisir.',
    exampleLoad: 'Charger l’exemple',
    /* Un exemple remplace tout, exactement comme un import : deux questions, ni
       une de moins ni les trois de l'effacement, puisqu'il reste quelque chose
       après. Au premier lancement, en revanche, il n'y a rien à perdre et on
       n'en pose aucune. */
    exampleConfirm: 'Remplacer toutes les données par le jeu d’exemple ?',
    exampleConfirm2: 'Le foyer, les récurrences et les entrées actuels seront perdus. Confirmer ?',
    exampleLoaded: 'Jeu d’exemple chargé',
    exampleFailed: 'Le jeu d’exemple n’a pas pu être chargé. Vérifie ta connexion, puis réessaie.',

    reset: 'Tout effacer',
    resetHint: 'Efface le foyer, les récurrences et toutes les entrées. Sans retour.',
    /* Trois questions, et trois questions différentes : ce qui part, le fait
       qu'il n'y a pas de retour, puis la dernière chance d'exporter. Trois fois
       la même phrase ne se lit pas, elle se clique. */
    resetConfirm1: 'Effacer toutes les données de cet appareil ?',
    resetConfirm2:
      'Le foyer, les membres, les récurrences, les crédits et toutes les entrées partent. Il n’y a pas de retour.',
    resetConfirm3: 'Dernière question. Exporte d’abord si tu veux garder une trace.',
    resetDone: 'Données effacées',
    resetFailed: 'L’effacement n’a pas abouti. Recharge la page et réessaie.',

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
    /* Les deux bornes de la fenêtre, pour le nom accessible du graphique : elle
       s'arrête au mois courant, quoi qu'on regarde ailleurs dans l'app. */
    trailingRange: 'de %s à %s',
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
    /* Le nom accessible d'un mois du graphique. Il porte les trois chiffres :
       c'est lui la lecture, la ligne visible au-dessus n'en est que le double
       à l'œil. */
    srMonthRead: '%s : entrées %s, sorties %s, solde %s',
    /* Un mois sans donnée n'est pas un mois à zéro (cahier §4.7). Il se dit, il
       ne se chiffre pas. */
    srMonthNoData: '%s : aucune donnée',
    /* Le cumul porte une ou deux années : la partie variable est assemblée par
       le graphique, comme `srTrailing` l'est par la page. */
    srCumulativeRead: '%s : %s',
    noData: 'Aucune donnée sur cette période.',
    /* Sur un foyer neuf, les trois tuiles empilaient trois phrases d'excuse —
       pas assez pour une courbe, pas deux mois à comparer, pas d'année
       complète. Trois façons de dire la même chose, et aucune ne disait quoi
       faire. Un seul état vide les remplace tant que rien n'a été saisi, comme
       sur les autres écrans. */
    /* Retrouver une ligne se faisait mois par mois, ou pas du tout. La
       recherche vit ici et non derrière un sixième onglet — la barre en porte
       cinq et n'en tient pas six à 320px — et c'est de toute façon l'écran de
       la question : « ce prélèvement de mars » est un regard en arrière. */
    search: 'Retrouver une ligne',
    searchLabel: 'Rechercher par libellé',
    searchPlaceholder: 'EDF',
    searchHint: 'Tous mois confondus, récurrences comprises.',
    searchEntries: 'Entrées',
    searchRecurrences: 'Récurrences',
    searchEmpty: 'Aucune ligne ne correspond à « %s ».',
    /* Sans « précise la recherche » : c'était un conseil, pas une commande, et
       il ne servait à rien quand tout ce qui dépasse porte réellement le même
       mot. Le bouton d'à côté fait ce que la phrase demandait. */
    searchMore: '… et %s de plus.',
    searchShowAll: 'Tout afficher',
    empty: 'L’historique se remplit tout seul, à mesure que les mois passent.',
    emptyHint:
      'Il n’y a encore rien à comparer : la courbe, l’écart entre deux mois et le cumul annuel arrivent avec les premières entrées.',
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
    upcoming: 'Prochaines échéances',
    inflow: 'Entrées',
    outflow: 'Sorties',
    /* « Charge ni crédit », pas « sortie » : la tuile compte par nature, hors
       épargne, et un mois où l'on n'a fait que verser sur un livret a bien vu
       des sorties — simplement rien qui parte du foyer. */
    noBreakdown: 'Aucune charge ni crédit ce mois-ci.',
    /* La tuile ne s'arrête pas au mois affiché : elle lit les règles au-delà
       des mois déjà ouverts. Son vide dit donc qu'il n'y a plus rien du tout. */
    noUpcoming: 'Aucune échéance à venir.',
    progress: 'Jour %s sur %s',
    monthAhead: 'Mois à venir',
    monthDone: 'Mois terminé',
    capacity: 'Capacité d’épargne',
    capacityHint: 'ressources − charges − crédits',
    /* La seconde lecture porte le reste à placer, et non le taux d'épargne : le
       taux décrit le mois passé, le reste appelle un geste — c'est lui qui fait
       ouvrir l'écran. Le taux s'y lit, à côté de sa ventilation. */
    savingLeft: 'reste %s à placer',
    /* Ce que le mois verse, dit avec ou sans filtre. La condition tombe : elle
       valait pour le *reste à placer*, qui appelle un geste et se décide sur un
       compte à la fois — au foyer, la somme de deux restes ne se décide nulle
       part. Le versement, lui, est un constat, et l'écran de l'épargne
       l'additionne déjà au foyer sans que ça pose de question.
       Le mois entier, comme la capacité et le reste qui l'encadrent : les deux
       clauses sont les deux moitiés du chiffre, elles doivent le redonner. Au
       seul confirmé — plus juste sur le mot « versé », et tentant pour ça — il
       manquerait à l'écran ce qui est programmé sans être parti, et l'écran de
       l'épargne annoncerait un autre montant sous le même mot.
       « Versé » et non « placé », comme `savings.placedTotal` et `entry.savingIn` :
       le même geste garde le même mot d'un écran à l'autre.
       Deux versions, parce que l'épargne se compte en net : le mois où une
       avance est posée, le livret rend plus qu'il ne reçoit, et « −510 € versé »
       ne se lit pas — c'est une reprise, elle se nomme. */
    savingPlaced: '%s versé',
    savingWithdrawn: '%s repris de l’épargne',
    showSavings: 'Voir où placer %s',
    spending: 'Où part l’argent',
    spendingHint: 'charges et crédits, hors épargne',
    credits: 'Crédits',
    creditsRemaining: 'capital restant dû',
    creditsRunningOne: '%s crédit en cours',
    creditsRunningMany: '%s crédits en cours',
    showCredits: 'Voir le détail des %s',
    /* Sur chaque part de l'anneau. La croix seule dirait « ferme », le
       pourcentage seul ne dit pas qu'on peut l'ouvrir : le nom accessible porte
       le geste, et il nomme le poste pour que sept boutons ne s'annoncent pas
       sept fois de la même façon. */
    showFamily: 'Voir les lignes de %s',
    noCredits: 'Aucun crédit en cours.',
    split: 'Répartition',
    splitHint: 'charges communes du mois',
    /* Le nom du lien posé au coin de ces deux tuiles-là, et non celui de leur
       eyebrow : elles ne sont plus cliquables d'un bloc — leur contenu est une
       liste, qu'un bouton aplatirait — et le repère du coin porte seul le
       geste. Un lecteur d'écran sait lister les liens d'une page hors de leur
       contexte : ce nom-ci doit donc tenir tout seul, là où le chevron affiché
       se suffit du voisinage de l'eyebrow. */
    showSplit: 'Voir le détail de la répartition',
    showMemberShare: 'Voir le détail du calcul de la part',

    /* La contrepartie de la tuile Répartition, sous un filtre par membre :
       celle-ci montre les parts de tout le monde, celle-là ce que la personne
       filtrée porte du pot commun — et le coefficient qui le produit, qui
       n'apparaissait nulle part sur son mois.

       Le montant à virer est le chiffre de tête, et non une ligne parmi trois.
       C'est le geste que la tuile sert : un virement sur le compte joint, dont
       la somme se recopie telle quelle. Le total des charges communes du foyer
       en est parti — c'est un chiffre qu'on ne doit pas, et il se lit encore
       sur l'écran Répartition, qui est fait pour ça. */
    /* L'eyebrow nomme le chiffre plutôt que la tuile : « Part du foyer » puis
       « À verser sur le commun » juste en dessous disaient deux fois la même
       chose, et cette redite valait les trente pixels qui débordaient. */
    memberShare: 'À verser sur le commun',
    memberShareOwn: 'Charges perso',
    memberShareTotal: 'Total à payer',
    /* Le report a sa tuile, et non une cinquième ligne dans celle-ci : le DS §5
       plafonne une tuile à un eyebrow, un chiffre, une lecture secondaire et une
       visualisation, puis tranche — « si elle en demande un cinquième, c'est
       deux tuiles ». La ligne qu'il portait ici passait à la ligne sur mobile,
       dans une colonne de 222px, et se faisait couper par le bas. */
    settlement: 'Régularisation',
    /* Le mois sans son année, et la direction en deux mots : une 4×1 fait 88px
       de haut dont 56 utiles, et sur un écran de 320 elle n'offre que 143px à
       droite du montant. « de juillet 2026 · à verser en moins » y passait à la
       ligne, et la seconde ligne se faisait couper par le bas. */
    settlementLess: '%s · en moins',
    settlementMore: '%s · en plus',
    srSettlement: 'Régularisation %s : %s sur ce que %s verse au commun ce mois-ci.',
    /* La lecture de la jauge, et elle seule : les trois montants qu'elle
       accompagnait se lisent maintenant ligne à ligne dans la tuile, qui n'est
       plus un bouton derrière lequel tout disparaissait. Le nom du membre y
       reste, lui : rien dans le contenu ne le porte, il vient du filtre. */
    srMemberShare: '%s porte %s des charges communes du foyer.',

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
        /* La question la plus fréquente devant ce chiffre est celle de
           l'épargne : elle sort du compte, donc elle pèse ici — et c'est la
           capacité d'épargne qui la remet à part. Sans cette phrase, mettre
           300 € de côté se lit comme 300 € dépensés, sans un mot. */
        apart:
          'Une échéance encore prévue n’y compte pas : elle n’a pas eu lieu. C’est toute la différence avec le prévisionnel, qui les compte. Un versement d’épargne, lui, y compte comme une sortie — l’argent quitte bien le compte ; c’est la capacité d’épargne qui le met à part.',
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
    // Le nom accessible compte comme l'anneau : charges et crédits, hors épargne.
    srBreakdown: 'Répartition des charges et des crédits : %s',
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
    /* Confirmer n'est pas un aller simple. Le geste s'appelle « remettre à
       confirmer » et non « annuler » : « Annuler » est déjà le bouton qui ferme
       une boîte de dialogue, et les deux se seraient répondu dans la même. */
    unconfirm: 'Remettre à confirmer',
    unconfirmed: 'Échéance remise à confirmer',
    unconfirmAll: 'Remettre le mois à confirmer',
    unconfirmAllConfirm:
      'Les %s échéances confirmées de ce mois repassent dans « À confirmer », avec leurs montants.',
    unconfirmedAll: 'Mois remis à confirmer',
    entries: 'Ce mois',
    empty: 'Rien pour ce mois. Ajoute ta première dépense.',
    groupBy: 'Regrouper par',
    byDay: 'Jour',
    byCategory: 'Catégorie',
    byMember: 'Personne',
    /* Le filtre venu de l'anneau « Où part l'argent ». Il se nomme parce qu'il
       se retire : une liste réduite par un geste fait deux écrans plus haut, et
       qu'aucune commande visible ne défait, se lit comme un mois où il manque
       des lignes. « Poste » plutôt que « famille » — c'est le mot que la tuile
       emploie déjà pour désigner ce que l'anneau découpe. */
    familyFilter: 'Poste :',
    familyFilterClear: 'Retirer ce filtre',
    /* Le sens ne regroupe pas, il filtre. Un axe de plus aurait rendu une
       lecture — deux blocs dont le tableau de bord donne déjà les totaux ;
       un filtre les multiplie, puisqu'il se combine aux trois axes : les
       charges par poste, les revenus par personne, les charges au jour le
       jour. Les mots sont ceux des deux tuiles, juste au-dessus. */
    show: 'Montrer',
    showAll: 'Tout',
    /* Des natures, jamais des sens : un versement d'épargne sort du compte
       mais n'est pas une charge, et une reprise n'est pas un revenu. Les mots
       sont ceux des tuiles — qui comptent par nature et excluent l'épargne —
       et de la saisie, dont l'épargne a sa propre position. */
    showOut: 'Charges',
    showIn: 'Revenus',
    showSaving: 'Épargne',
    showEmptyOut: 'Aucune charge confirmée ce mois-ci.',
    showEmptyIn: 'Aucun revenu confirmé ce mois-ci.',
    showEmptySaving: 'Aucun mouvement d’épargne confirmé ce mois-ci.',
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
    removeConfirm: 'Elle disparaît du mois et de l’historique, sans retour. Supprimer ?',
    amount: 'Montant',
    category: 'Catégorie',
    date: 'Date',
    label: 'Libellé',
    labelPlaceholder: 'Courses',
    categoryPlaceholder: 'Choisis une catégorie',
    shared: 'Charge commune, à partager entre les membres',
    sharedHint: 'Elle entre dans la répartition au prorata des revenus.',
    /* Sur « tout le foyer », la case ne se décoche pas : une charge que
       personne ne s'attribue est commune par règle, et la décocher sans dire à
       qui elle est la ferait sortir du compte du foyer sans apparaître dans le
       mois de personne. La case reste, cochée, pour dire ce qui se passe. */
    sharedLocked: 'Personne ne s’attribue cette ligne : elle est commune, et se répartit au prorata.',
    member: 'Membre',
    note: 'Note',
    direction: 'Sens',

    /* L'écran demande ce qu'on enregistre, pas le sens de trésorerie : verser
       200 € sur un livret sortait du compte, donc se saisissait par
       « Dépense », et il fallait aller chercher « Livrets » entre les courses
       et le carburant. On ne dépense pas son épargne, on la déplace. */
    nature: 'Nature',
    natureExpense: 'Dépense',
    natureIncome: 'Revenu',
    natureSaving: 'Épargne',
    savingMovement: 'Mouvement',
    /* Dit du point de vue de l'épargne, pas du compte courant : « je place »
       et « je reprends » se comprennent sans savoir dans quel sens l'argent
       traverse. Le second n'existait pas — on pouvait verser sur un livret,
       jamais y reprendre. */
    savingIn: 'Je place',
    savingOut: 'Je reprends',
    addSaving: 'Mouvement d’épargne',
    editSaving: 'Modifier le mouvement',
    addedSaving: 'Mouvement d’épargne enregistré',
    updatedSaving: 'Mouvement d’épargne modifié',
    removedSaving: 'Mouvement d’épargne supprimé',
    newSaving: 'Épargne',
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
    /* Le total suit la pastille : un total qui ne compterait que les sorties
       sans le dire décrirait mal la liste qu'il surplombe.

       Et il dit son périmètre, parce qu'un total sans périmètre ne se vérifie
       pas. Deux questions restaient sans réponse à l'écran : de qui, et de
       quoi. Cette page ne connaît pas le filtre par membre — elle montre les
       règles du foyer — et le sens « ce qui sort » ramasse les charges, les
       crédits et les versements d'épargne. */
    totalMonthly: 'Total par mois',
    totalScopeOut: 'Tout le foyer · ce qui sort chaque mois, épargne et crédits compris',
    totalScopeIn: 'Tout le foyer · ce qui rentre chaque mois',
    /* Sous une pilule, le total se borne à sa nature : « Charges » compte
       comme la tuile du même nom — sans l'épargne — et l'épargne se compte en
       net, reprises déduites, comme partout. */
    totalScopeSpending: 'Tout le foyer · charges et crédits chaque mois, épargne à part',
    totalScopeSaving: 'Tout le foyer · ce qui part sur l’épargne chaque mois, reprises déduites',
    totalAnnual: 'Total annuel',
    perMonth: '%s par mois',
    groupBy: 'Regrouper par',
    byCategory: 'Catégorie',
    byMember: 'Personne',
    /* L'ordre était toujours imposé par le domaine — par prochaine échéance,
       qui répond à « qu'est-ce qui tombe bientôt ». C'est cet écran qui porte
       l'autre question : « qu'est-ce qui me coûte le plus ». */
    sortBy: 'Trier par',
    byDue: 'Échéance',
    byAmount: 'Montant',
    /* Le sens ne regroupe pas, il filtre — la règle qu'applique déjà la liste
       du mois. En axe, il rendait deux blocs dont le total en tête de page
       donne déjà les chiffres ; en filtre, il se combine aux deux axes qui
       restent : les charges par poste, les revenus par personne. Les mots sont
       ceux de la page du mois, à la lettre. */
    show: 'Montrer',
    showAll: 'Tout',
    /* Des natures, comme sur la liste du mois : la mensualité d'épargne n'est
       pas une charge, elle a sa pilule. */
    showOut: 'Charges',
    showIn: 'Revenus',
    showSaving: 'Épargne',
    showEmptyOut: 'Aucune charge récurrente.',
    showEmptyIn: 'Aucun revenu récurrent.',
    showEmptySaving: 'Aucune récurrence d’épargne.',
    groupCountOne: '%s récurrence',
    groupCount: '%s récurrences',
    collapseAll: 'Tout replier',
    expandAll: 'Tout déplier',
    unknownAmounts: '%s à montant variable, non chiffré%s',
    variable: 'Montant variable',
    variableHint: 'Le montant sera demandé à chaque échéance.',
    fixedAmount: 'Montant fixe',
    priceChanged: 'Le prix a changé : %s → %s',
    // Un virement d'épargne n'a pas de prix : son montant change, sans alarme.
    amountChanged: 'Le montant a changé : %s → %s',
    priceChangedSince: 'depuis le %s',
    stop: 'Arrêter la récurrence',
    stopAction: 'Arrêter',
    stopConfirm:
      'Ses échéances à venir sont retirées, les confirmées restent, et la récurrence pourra être reprise. Arrêter ?',
    stopped: 'Récurrence arrêtée',
    resume: 'Reprendre la récurrence',
    remove: 'Supprimer la récurrence',
    /* Les deux moitiés, parce que l'ancienne copie n'en disait qu'une : la
       règle disparaît vraiment de la liste, et ce qui a été payé reste. */
    removeConfirm:
      'La récurrence disparaît avec ses échéances à venir. Celles déjà confirmées restent dans l’historique.',
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
      everyWeeks: 'Toutes les combien de semaines',
      everyMonths: 'Tous les combien de mois',
      everyYears: 'Tous les combien d’années',
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
      /* La seconde phrase n'est pas une redite de la première : elle dit le
         geste. Le jour est borné et jamais reporté, si bien que 31 *est* « le
         dernier jour » — encore fallait-il que quelqu'un l'écrive, plutôt que
         de laisser deviner qu'on demande la fin du mois en saisissant 31. */
      monthDayHint:
        'Un jour qui n’existe pas est ramené au dernier jour du mois. Saisis 31 pour dire « le dernier jour », quel que soit le mois.',
    },
    periods: {
      weekly: 'Hebdomadaire',
      /* Le rythme d'une paie sur deux et de bien des prélèvements. Le modèle le
         portait depuis toujours ; seul le formulaire ne savait pas le dire. */
      everyNWeeks: 'Toutes les n semaines',
      monthly: 'Mensuelle',
      quarterly: 'Trimestrielle',
      yearly: 'Annuelle',
      everyNMonths: 'Tous les n mois',
      everyNYears: 'Tous les n ans',
    },
    summary: {
      weekly: 'chaque %s',
      everyNWeeks: 'le %s, toutes les %s semaines',
      monthly: 'le %s de chaque mois',
      everyN: 'le %s, tous les %s mois',
      yearly: 'chaque année le %s',
      everyNYears: 'tous les %s ans, le %s',
      /* Un jour d'échéance au 31 *est* le dernier jour du mois : il tombe le 31
         en janvier, le 28 en février et le 30 en avril, parce que le jour est
         borné et jamais reporté. Annoncer « le 31 de chaque mois » sur une
         échéance qui tombe le 28 décrivait la saisie, pas ce qui se passe. */
      lastDay: 'dernier jour',
    },
  },

  split: {
    title: 'Répartition',
    subtitle: 'Ce que chacun verse sur les charges communes, au prorata des revenus.',
    /* Seul du foyer, « au prorata des revenus » n'explique rien : la part vaut
       100 % et n'a demandé aucun revenu. L'écran garde sa raison d'être — le
       pot se vérifie ligne à ligne. */
    subtitleSolo: 'Seul du foyer, tu portes tout le commun : ta part vaut 100 %.',
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
    collapseAll: 'Tout replier',
    expandAll: 'Tout déplier',
    advancedBy: 'avancé par %s',
    /* Le report du mois précédent. Une charge commune réglée par une seule
       personne lui fait porter plus que sa part : le mois suivant le rattrape,
       l'un verse un peu plus, l'autre un peu moins. */
    /* Le « de » vit dans le mois, pas dans le gabarit : « d'octobre » et
       « de septembre » ne s'écrivent pas pareil — c'est `SplitPage` qui l'élide,
       comme il le fait déjà pour les prénoms. */
    settlement: 'Régularisation %s',
    settlementShare: 'Sa part du mois',
    settlementDetail: 'Ce qui a été avancé en %s',
    settlementHint:
      'Ces charges communes ont été réglées par une seule personne. Chacun en portait sa part : le mois se rattrape ici, et la somme des versements vaut toujours le total.',
    /* Le report ne déplace pas un coût : ce que le mois a coûté à chacun est
       arrêté au mois où la dépense a eu lieu. Ce qui se rattrape est un
       virement, et c'est pour ça qu'il ne touche à aucun total de charges. */
    settlementNotACost:
      'Un report ne change pas ce que le mois a coûté à quelqu’un, seulement ce qu’il verse.',
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
    /* Le chiffre existe, et il vaut zéro. Un prorata dont un terme est nul n'a
       pas plus de sens qu'un prorata sans terme : il donnerait 0 % des charges
       à quelqu'un, en silence. Le « de » s'élide comme au-dessus. */
    zeroOne: 'Le revenu %s est déclaré à zéro.',
    zeroMany: 'Les revenus %s sont déclarés à zéro.',
    zeroHint:
      'Corrige le montant de la récurrence, ou celui de son échéance : un revenu nul ne se répartit pas, il ne dit rien.',
    goToIncome: 'Ajouter un revenu',
    goToSubscriptions: 'Voir les récurrences',
    /* Le cas du foyer sans membre — un seul suffit désormais : sa part vaut
       100 %, et l'écran montre le pot. */
    soloTitle: 'La répartition demande au moins un membre.',
    soloHint: 'Ajoute qui compose le foyer. Une personne suffit : seule, elle porte tout le commun.',
    goToSettings: 'Aller aux réglages',
    srShares: 'Parts de chacun : %s',
  },

  advances: {
    title: 'Avances',
    /* Le mot dit le geste : tu as avancé de l'argent, tu te le rembourses. La
       liste vit sous les récurrences parce que c'en est une — la mensualité
       qui remet l'épargne en place. */
    section: 'Avances',
    sectionHint:
      'Une charge payée en une fois depuis l’épargne, que tu te remets sur ton livret mois par mois.',
    add: 'Ajouter une avance',
    added: 'Avance ajoutée',
    deleted: 'Avance retirée',
    empty: 'Aucune avance en cours.',

    label: 'Ce que tu as payé',
    labelPlaceholder: 'Assurance auto',
    labelRequired: 'Donne un libellé à cette avance.',
    amount: 'Montant payé',
    amountHint: 'Le versement unique, en entier.',
    amountRequired: 'Indique ce que tu as payé.',
    paidOn: 'Payé le',
    category: 'Nature de la charge',
    categoryRequired: 'Dis de quelle charge il s’agit.',
    /* Le support est une catégorie d'épargne, et pas n'importe laquelle : c'est
       celui qu'on a vidé, donc celui qu'on remplit. */
    savingCategory: 'Repris sur',
    savingCategoryHint: 'Le livret ou le plan qui a payé, et qu’on reconstitue.',
    savingCategoryRequired: 'Dis sur quel support tu as pris l’argent.',
    member: 'Avancé par',
    memberRequired: 'Dis qui a avancé : une épargne est toujours à quelqu’un.',
    memberNone: 'Ajoute un membre au foyer pour enregistrer une avance.',
    from: 'Du mois de',
    to: 'Au mois de',
    periodInvalid: 'Le dernier mois ne peut pas précéder le premier.',

    monthly: 'Mensualité',
    monthlyOf: '%s par mois sur %s mois',
    restored: 'Déjà remis',
    remaining: 'Reste à remettre',
    settled: 'Entièrement reconstituée',
    over: 'Couvre %s → %s',
    remove: 'Retirer l’avance',
    removeConfirm:
      'Les mensualités déjà remises sur le livret sont conservées. Seule la mensualité à venir s’arrête. Retirer cette avance ?',

    /* Ce que l'écran doit dire une fois, sinon le chiffre paraît sorti de
       nulle part : la reprise est une entrée d'argent, la dépense qu'elle a
       financée reste à saisir comme n'importe quelle autre. */
    method: 'Comment c’est enregistré',
    methodDrawdown:
      'Le jour du paiement, l’app enregistre une reprise sur ton épargne : le livret baisse du montant avancé, et cet argent redevient disponible.',
    methodInstalments:
      'Chaque mois de la période, une mensualité repart sur le même support. Elle compte dans ton épargne, jamais dans tes charges — la charge, elle, a déjà eu lieu.',
    methodExpense:
      'La dépense que cette reprise a financée se saisit comme les autres, à sa date. L’app ne l’invente pas à ta place.',
    methodShared:
      'Cochée « à partager », la mensualité entre dans les charges communes : chacun en porte sa part au prorata, et celui qui a avancé se retrouve remboursé.',

    srStatus: '%s : %s remis sur %s, il reste %s.',
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
    /* Le mois où une avance est posée : le livret a payé une charge de l'année,
       et il a donc rendu plus qu'il n'a reçu. Sans cette phrase, le chiffre
       négatif au-dessus se lit comme une erreur. */
    withdrawn: 'Plus repris que placé ce mois-ci — une avance est passée par là.',

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
    /* Le nom du lien posé au coin de chaque ligne. La ligne n'est plus un
       bouton — elle empile un anneau et quatre chiffres —, et ce nom-ci se lit
       hors de la liste : « Ouvrir › » n'y dirait pas lequel. */
    open: 'Ouvrir le crédit %s',
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
    /* Rien à perdre au premier lancement — aucune entrée n'existe encore —,
       mais un retrait se demande partout de la même façon : apprendre ici que
       la croix agit sans prévenir se paierait plus tard, ailleurs. */
    membersRemoveConfirm: 'Retirer %s du foyer ?',
    solo: 'Je suis seul·e',
    start: 'Commencer',
    privacy: 'Tes données restent sur cet appareil. Rien n’est envoyé nulle part.',

    /* En PWA installée il n'y a pas de bouton retour du navigateur : chaque
       étape porte le sien, sans quoi on n'a plus qu'à répondre ou à fermer. */
    backToLanding: 'Revenir à la présentation',
    backToStep: 'Revenir à l’étape 1',
    progress: 'Progression : étape %s sur 2',

    /* L'aperçu montre la réponse à son emplacement réel plutôt que de la
       décrire : ce qu'on tape à l'étape 1 est ce qu'on lira en haut de chaque
       écran, et le montrer là est plus court que de le promettre. */
    previewHousehold: 'Ce que tu liras en haut de chaque écran',
    previewMembersEmpty:
      'Sans personne ici, tout t’est attribué — le foyer fonctionne très bien en solo.',
    previewMembers:
      'Une fois leurs revenus posés, les charges communes se partagent entre eux au prorata.',
  },

  about: {
    what: 'Ce que c’est',
    whatBody:
      'Tout compte fait suit les finances d’un foyer : ce qui rentre, ce qui sort, ce qu’il reste, et qui paie quoi.',
    whatNotBank:
      'Ce n’est pas une banque. Aucun compte n’y est relié, aucun relevé n’y est lu : tu écris ce que tu sais, l’app tient les comptes.',
    whatOffline:
      'Une fois ouverte, elle fonctionne sans réseau et s’installe sur l’écran d’accueil comme une app.',

    how: 'Comment ça marche',
    howRecurring:
      'Ce qui revient chaque mois s’écrit une fois. Loyer, abonnement, salaire : l’app pose leurs échéances dans les mois à venir.',
    howForecast:
      'Le mois arrive déjà écrit, en prévision. Tu confirmes chaque échéance quand elle tombe, et le solde suit.',
    howSplit:
      'Les charges communes se partagent au prorata des revenus. Ce qu’une seule personne a avancé se rend le mois suivant.',
    howKinds:
      'Rien n’est rangé en comptes bancaires : tout est une entrée ou une sortie, sous l’une des quatre natures — ressources, charges, crédits, versements.',

    data: 'Tes données',
    dataBody:
      'Tout est enregistré dans ce navigateur, et nulle part ailleurs : ni compte, ni serveur, ni mesure d’audience.',
    /* La promesse et sa contrepartie dans la même tuile : « rien ne sort d'ici »
       et « rien ne revient si tu vides le navigateur » sont la même phrase, et
       n'en garder qu'une moitié se paierait un jour. */
    dataLimit:
      'C’est aussi la contrepartie : vider les données du navigateur les efface, et personne ne peut te les rendre. Exporte de temps en temps — l’app te le rappelle au bout de trente jours.',

    project: 'Le projet',
    projectBody:
      'Le code est ouvert, sous licence AGPL-3.0 : tu peux le lire, le copier, le faire tourner chez toi. À une condition — ce que tu en publies reste ouvert à ton tour, même si tu te contentes de le mettre en ligne.',
    repo: 'Le code sur GitHub',
    license: 'La licence AGPL-3.0',
    version: 'Version %s',
    /* Annoncé aux lecteurs d'écran, jamais à l'œil : le soulignement dit déjà
       que c'est un lien, rien ne dit qu'il quitte l'app — et en mode installé,
       il n'y a pas de bouton retour pour revenir d'un site ouvert par erreur. */
    newWindow: '(s’ouvre dans une nouvelle fenêtre)',

    seeLanding: 'Revoir la présentation',
    /* La version affichée ne disait pas ce qu'elle apporte, et `UpdatePrompt`
       demandait d'accepter une mise à jour sans la nommer. Sur une app qui
       refuse par principe de se remplacer dans le dos de qui l'utilise, c'est
       la moitié manquante du geste. */
    changelog: 'Ce qui a changé',
    /* Le cahier des charges et le design system sont la source de vérité du
       projet, et son meilleur argument de sérieux : ils n'étaient liés de nulle
       part côté produit. */
    docs: 'La documentation du projet',
  },

  /* Les trois pages juridiques. Seulement leurs noms et le châssis commun : la
     prose vit dans `i18n/legal.ts`, qui se charge avec les écrans qui la
     rendent. Ces libellés-ci, eux, sont écrits par le pied de page sur tous les
     écrans — ils ne peuvent pas attendre un morceau chargé à la demande. */
  legal: {
    notice: 'Mentions légales',
    privacy: 'Confidentialité',
    terms: 'Conditions d’utilisation',
    /* Le pied de page n'a pas la place de trois libellés entiers à 320px. */
    shortNotice: 'Mentions',
    shortTerms: 'Conditions',
    updated: 'À jour en %s.',
    alsoRead: 'À lire aussi',
    thirdParty: 'Licences des composants tiers',
    /* Sur « à propos », là où l'on vient de lire que rien ne sort de l'appareil :
       c'est la phrase que la page de confidentialité développe, et le seul
       endroit où elle a une chance d'être ouverte. */
    aboutLead:
      'Le détail de ce qui est enregistré et de ce qui ne l’est pas, l’identité de l’éditeur et de l’hébergeur, et ce que le service promet.',
  },

  styleguide: {
    title: 'Styleguide',
    subtitle: 'Chaque token et chaque composant du design system, dans les deux thèmes.',
    sections: {
      base: 'Palette de base',
      semantic: 'Tokens sémantiques',
      categories: 'Palette catégories',
      members: 'Palette membres',
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
    /* Le vert pomme est --accent, donc le signal « actif » et la couleur du
       commun. Le premier membre le portait : sa pastille se lisait comme une
       sélection, et disparaissait dans une pilule de filtre active. */
    membersNote:
      'Les mêmes teintes, moins le vert pomme, qui reste à l’accent et donc au commun. Un membre ne le porte jamais.',
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
    /* Où atterrit une ligne dont la catégorie n'existait pas. Le nom dit ce
       qu'il reste à faire, plutôt que ce qui s'est passé : « à ranger » est un
       geste, « catégorie introuvable » est un constat. */
    repairedCategory: 'À ranger',
  },

  a11y: {
    skipToContent: 'Aller au contenu',
    ringLabel: 'Anneau de progression',
    /* Le nom du curseur d'un graphique, et non celui du graphique : l'image
       porte déjà le sien. Celui-ci dit ce qu'on peut faire, pas ce qu'on
       regarde. */
    chartCursor: 'Choisir le mois à lire',
    /* Un raccourci que personne ne découvre ne sert personne — la règle qui
       fait dire les flèches du mois en infobulle. Ici il n'y a aucun bouton à
       survoler : ça se dit donc au lecteur d'écran, sur le curseur. */
    chartCursorHint:
      'Flèches gauche et droite pour changer de mois, Origine et Fin pour les extrémités.',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    /* Un raccourci que personne ne découvre ne sert personne. Il se dit en
       infobulle sur le geste qu'il double — c'est-à-dire au survol, donc
       exactement là où un clavier est branché. Le nom accessible, lui, ne le
       porte pas : « flèche gauche » annoncé par un lecteur d'écran décrit une
       touche, pas ce que le bouton fait. */
    previousMonthKey: 'Mois précédent (←)',
    nextMonthKey: 'Mois suivant (→)',
    newEntryKey: 'Ajouter une dépense (n)',
  },
} as const

export type Strings = typeof fr
