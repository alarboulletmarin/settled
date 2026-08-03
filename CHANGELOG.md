# Journal des modifications

Toutes les évolutions notables de ce projet sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le
versionnage la [gestion sémantique de version](https://semver.org/lang/fr/).

Une remarque propre à cette app : comme les données vivent dans le navigateur,
toute évolution du modèle de données passe par une **migration de schéma**. Les
versions qui en portent une le disent explicitement — c'est ce qui garantit
qu'un fichier exporté aujourd'hui se rouvre demain.

## [Non publié]

Le chantier de la fiabilité du stockage. La promesse de l'app est que tout vit
sur l'appareil ; rien n'instrumentait la frontière avec le navigateur, et
quatre façons de tout perdre en silence coexistaient.

**Aucune migration de document** : `schemaVersion` reste à 6, et un export
d'aujourd'hui se rouvre à l'identique. La base IndexedDB, elle, passe de la
version 1 à la version 2 pour accueillir les sauvegardes locales — sans perte,
et sans rien transformer. Un onglet resté ouvert sur la version précédente doit
être fermé pour que le passage se fasse ; l'app le dit désormais au lieu de
tourner indéfiniment sur son écran de démarrage.

### Ajouté

- **Flush à la fermeture** : la file d'écriture est vidée sur `pagehide` et
  quand la page passe en arrière-plan — les deux seuls événements sur lesquels
  un téléphone rende la main.
- **Bandeau d'échec d'écriture**, persistant et non écartable, avec un export
  immédiat. Il s'affiche partout, y compris sur un écran de saisie : c'est
  précisément là qu'on est en train de perdre du travail.
- **Écran de récupération** sur la page d'arrivée quand le document stocké ne
  se lit pas : import, téléchargement de la copie brute, rechargement, puis
  effacement derrière deux confirmations.
- **Coordination entre onglets** par `BroadcastChannel` : l'onglet en retard
  annule son écriture en attente, relit, et le dit.
- **Persistance demandée au navigateur** (`navigator.storage.persist()`) à la
  création du foyer et après un import.
- **Réglages › Sur cet appareil** : l'engagement du navigateur, la place
  occupée, et les sauvegardes locales avec leur restauration.
- **Cinq sauvegardes locales tournantes**, une par jour de saisie, chacune
  portant l'état d'avant les modifications du jour.
- **Écran de secours** en cas d'exception au rendu, qui propose d'abord de
  récupérer les données, puis de réinstaller l'app.

### Corrigé

- Les écritures pouvaient **se recouvrir** : deux transactions ouvertes en
  parallèle sur la même clé commettent dans l'ordre du moteur, si bien que la
  dernière saisie pouvait être écrasée par l'avant-dernière.
- Un **échec d'écriture était avalé** : quota plein, navigation privée ou base
  évincée, on saisissait sans que rien ne s'enregistre ni ne le dise.
- Une **saisie faite dans les 400 ms** précédant la fermeture de l'onglet était
  perdue.
- Le message d'échec de lecture était **rédigé et jamais affiché**, et créer un
  foyer **écrasait alors le document illisible** — qu'une simple mise à jour de
  l'app aurait parfois suffi à rouvrir.
- Deux onglets ouverts **s'écrasaient mutuellement**, au dernier qui écrit.
- Une connexion coupée par le navigateur faisait **rejeter toutes les écritures
  suivantes** jusqu'au rechargement, sans un mot.
- Une ouverture de base bloquée laissait **l'écran de démarrage tourner sans
  fin**.
- Une exception au rendu donnait un **écran blanc**, reproduit à l'identique à
  chaque rechargement puisque le service worker resservait la même version.

### Ajouté — revenir au mois courant

- **« Ce mois-ci »** dans le bandeau du mois, à droite de la navigation. Parti
  en février 2025 depuis un mois d'août, il fallait douze chevrons pour rentrer,
  ou recharger la page. Le bouton n'apparaît que lorsqu'on n'est pas sur le mois
  courant, et il vaut pour tous les écrans rattachés à un mois — le mois, le
  calendrier, la répartition.

### Tenu — les promesses du design system

Le README fait du design system une source de vérité : « le code lui obéit, et
un écart est un bug ». Cinq de ses promesses n'étaient pas tenues. Aucune ne
touche au document : `schemaVersion` reste à 6.

- **L'anneau du mois est sur l'écran du mois.** Le DS §1 en fait la signature de
  l'app, la page de présentation le démontrait aux visiteurs « comme sur le
  mois », et le vrai tableau de bord n'en avait pas : la progression s'y lisait
  en une phrase. Il se pose sur la tuile Solde, sur la phrase qu'il dessine —
  mesuré, une 2×2 n'offre pas la largeur de le mettre à côté du chiffre héros.
- **Les grands nombres comptent au premier affichage**, et une seule fois : le
  DS §4 le promettait sans que rien ne l'implémente. Jamais sur mise à jour,
  donc jamais en changeant de mois, et rien du tout sous « réduire les
  animations ». Les montants de liste, eux, restent immobiles — quarante lignes
  qui s'égrènent ne sont pas une arrivée.
- **Les graphiques se lisent.** Une période focusable par mois sur les douze
  derniers mois comme sur le comparatif d'années, à la souris et au clavier
  (flèches, `Origine`, `Fin`), avec les valeurs du mois lu au-dessus du tracé et
  un axe des ordonnées qui manquait tout à fait. La légende y a été absorbée :
  elle disait les mêmes mots sans les chiffres.
- **« Tout replier » sur la répartition**, comme le DS §6 le promet et comme le
  font déjà le mois, les abonnements et les catégories.
- **Un glyphe par concept**, déclaré une seule fois (DS §9.2) : trois paires
  d'icônes se partageaient un même trait, dont deux pour un seul et même
  concept. Le catalogue du styleguide, qui se disait entier, en montre enfin
  la totalité.

### Corrigé — au passage

- Le **cumul du solde décalait ses points** d'une demi-tranche : il les ancrait
  aux bords quand la bande des mois sous lui découpe la largeur en douze parts
  égales, si bien que janvier se lisait à gauche de la lettre qui le nomme.
- La **bande des mois des douze derniers mois débordait de 71px à 320** et se
  faisait trancher par sa tuile : douze libellés courts en mono ne rétrécissent
  pas. L'initiale suffit tant que la place manque.
- Un **raccourci clavier de l'app se déclenchait par-dessus** un composant qui
  avait déjà répondu à la même touche.

### Corrigé — domaine et import

Issus d'un audit complet du code, revérifiés point par point. Aucun ne change le
format du document : `schemaVersion` reste à 6.

- **Retirer un membre laissait ses avances derrière**, avec l'identifiant d'un
  porteur disparu — `Advance.memberId` n'est pas facultatif, donc elles ne
  pouvaient pas repasser au foyer comme le reste. Elles sont supprimées, la
  confirmation l'annonce, et la récurrence qui reconstitue le livret reste.
- **Un revenu chiffré à zéro donnait 0 % des charges communes** au membre qui le
  portait, en silence : la répartition ne refusait de répondre que si la *somme*
  des revenus était nulle. Elle refuse désormais dès qu'une source vaut zéro, et
  les écrans disent laquelle des trois raisons c'est.
- **Une ressource déclarée pour dans cinq ans pesait dès aujourd'hui** dans le
  prorata. L'horizon est borné à un trimestre.
- **Le montant saisi sur une échéance prévue** était écrasé par la règle dès
  qu'on éditait la récurrence.
- **La tuile des prochaines échéances pouvait en compter une deux fois**, quand
  un document importé portait une échéance prévue dans un mois jamais ouvert.
- **Un montant au-delà de 2^53 centimes s'enregistrait faux** sans que rien ne
  puisse l'attraper. La saisie est plafonnée.
- **Une avance pouvait se terminer avant de commencer** — rien ne revenait alors
  jamais sur le livret. Refusé à la saisie comme à l'import.
- **Un mois « 2026-13 » passait la validation** et s'affichait sans nom.
- **L'import était muet sur ce qu'il écartait** : une entrée illisible
  disparaissait sans un mot, au seul moment où l'on pouvait encore le voir. La
  confirmation affiche désormais le détail, ligne par ligne.
- **Aucune vérification référentielle à l'import** : une catégorie inconnue
  rendait une dépense commune et partagée, un membre inconnu la faisait
  disparaître des vues filtrées, et deux lignes pouvaient porter le même
  identifiant. Les liens sont recollés, coupés ou redirigés vers « À ranger »,
  et le rapport le dit.
- **Effacer ses données laissait la date du dernier export** derrière elle :
  l'app repartait de zéro en annonçant la sauvegarde d'un document disparu.
- **Quatre chemins asynchrones sans filet** : l'import et l'effacement
  annonçaient une réussite qui n'avait pas eu lieu, le jeu d'exemple et le
  schéma laissaient un clic sans effet hors ligne.
- **Les toasts d'erreur étaient annoncés poliment** aux lecteurs d'écran, donc
  après tout le reste — y compris « les modifications ne s'enregistrent plus ».
- **Replier une liste laissait des sections ouvertes** : les événements émis
  dans le même tour se recouvraient.
- **L'export n'était fiable que sur Chrome** — ancre jamais posée dans le
  document, URL révoquée trop tôt.
- **Les identifiants repartaient de zéro à chaque rechargement** hors contexte
  sécurisé, par exemple en testant l'app sur son téléphone en `http://`.

### Ajouté — les gestes qui manquaient

Issus du même audit, côté usage cette fois. Aucun ne change le format du
document : `schemaVersion` reste à 6.

- **Défaire une suppression.** Onze gestes passaient par une confirmation et
  aucun n'offrait de retour arrière : une entrée supprimée était irrécupérable.
  Le message qui l'annonce porte désormais « Rétablir », huit secondes durant.
  Il remet l'état d'avant tel quel, y compris pour un retrait de membre, qui
  touche à dix endroits à la fois. La confirmation reste : elle se pose avant,
  le retour arrière rattrape le oui donné trop vite.
- **Garde de brouillon** sur les quatre écrans de saisie — entrée, récurrence,
  crédit, avance. « Annuler » et le retour jetaient la saisie sans prévenir. Un
  formulaire ouvert puis quitté sans rien changer ne demande toujours rien.
- **Recherche par libellé sur l'historique**, tous mois confondus, entrées et
  récurrences : retrouver « ce prélèvement de mars » imposait de naviguer mois
  par mois. Accents et casse mis de côté, chaque résultat mène à sa fiche.
- **Filtre du catalogue de catégories** dans les réglages : quarante-six
  catégories sous onze familles repliées, et il fallait deviner que
  « Carburant » est rangée sous Transport.
- **Tri des récurrences par montant**, à côté du tri par prochaine échéance.
  C'est l'écran de « qu'est-ce qui me coûte le plus », et il ne savait pas y
  répondre.
- **Raccourcis clavier** — `←` / `→` changent de mois, `n` ouvre une dépense,
  `Échap` referme le panneau du jour au calendrier. L'app n'en avait aucun.
  Chacun se dit en infobulle sur le geste qu'il double.
- **Navigation entre mois sur l'écran Répartition**, qui lisait le mois affiché
  sans offrir d'en changer : vérifier la répartition de juillet imposait de
  repasser par l'écran du mois.

### Modifié

- **« Reste à vivre » ne s'affiche plus hors du mois courant.** Le chiffre
  arrête le prévisionnel à la prochaine rentrée d'argent à partir
  d'aujourd'hui : sur un mois passé ou à venir, il se calculait quand même et ne
  voulait rien dire.
- **Le mois se balaie aussi à la souris et au stylet**, comme le rappel
  d'export : le geste était en TouchEvents, donc réservé au doigt.
- **Les renommages n'écrivent plus à chaque frappe** — catégorie, famille, nom
  du foyer, prénom d'un membre —, mais à la sortie du champ, comme tous les
  formulaires de l'app.
- **L'historique d'un foyer neuf** montre une seule invitation au lieu de trois
  phrases d'excuse empilées.

## [1.0.0] — 2026-08-02

Première version publique. Le périmètre est celui de la v1 du
[cahier des charges](docs/CAHIER-DES-CHARGES.md).

### Ajouté

- **Récurrences** à montant fixe ou variable — salaires, loyer, abonnements,
  mensualités — rangées en quatre natures : Ressources, Charges, Crédits,
  Versements.
- **Ouverture du mois** automatique et idempotente : afficher un mois non passé
  génère ses échéances prévues, qu'on confirme au fil de l'eau.
- **Dépenses et recettes ponctuelles**, avec catégories rangées en familles.
- **Crédits** avec capital restant dû calculé — jamais stocké — depuis le nombre
  de mensualités confirmées.
- **Répartition des charges communes** entre membres au prorata des revenus,
  par plus forts restes, et **régularisation** sur le mois suivant quand une
  charge commune a été avancée par une seule personne.
- **Avances** : une charge payée en une fois depuis l'épargne, remboursée mois
  par mois.
- **Capacité d'épargne**, ventilation par support et reste à placer, par
  personne.
- **Calendrier** des échéances, **historique** des mois passés et comparatifs
  mois/mois et année/année.
- **Export / import** du fichier de données, avec validation à l'import et
  rappel d'export tous les trente jours.
- **Schéma de données** à copier ou télécharger, dérivé du code, pour faire
  transcrire des notes déjà écrites par un assistant.
- **Jeu d'exemple** de quinze mois, construit à la date du jour plutôt que figé.
- **Thème clair et sombre**, **PWA** installable et utilisable hors ligne.
- **Styleguide** à `/styleguide` — chaque token et chaque composant dans les
  deux thèmes.

### Sécurité

- Aucune requête réseau ne transporte de donnée du foyer : l'app n'en émet
  aucune. Pas de compte, pas de serveur, pas d'analytics, pas de cookie tiers.

[Non publié]: https://github.com/alarboulletmarin/tout-compte-fait/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/alarboulletmarin/tout-compte-fait/releases/tag/v1.0.0
