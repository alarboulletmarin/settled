# Journal des modifications

Toutes les évolutions notables de ce projet sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le
versionnage la [gestion sémantique de version](https://semver.org/lang/fr/).

Une remarque propre à cette app : comme les données vivent dans le navigateur,
toute évolution du modèle de données passe par une **migration de schéma**. Les
versions qui en portent une le disent explicitement — c'est ce qui garantit
qu'un fichier exporté aujourd'hui se rouvre demain.

## [Non publié]

### Modifié — la licence passe de MIT à AGPL-3.0

MIT autorisait explicitement ce que ce projet ne veut pas : reprendre le code,
le refermer, et le vendre sans que personne ne revoie une ligne. Aucune licence
open source n'interdit l'usage commercial — c'est un critère d'exclusion de la
définition — donc le levier n'est pas l'interdiction, c'est le copyleft.

- **Le dépôt est désormais sous [GNU AGPL-3.0-or-later](LICENSE).** Reprendre,
  modifier, redistribuer et héberger restent libres, y compris commercialement ;
  toute version modifiée doit être publiée sous la même licence. L'article 13
  étend l'obligation à la simple mise en ligne : mettre cette app modifiée sur
  un domaine, c'est en devoir la source, même sans rien distribuer.
- **La bascule ne vaut que pour la suite.** La version `1.0.0` et tout ce qui a
  été publié avant sont sortis sous MIT et le restent : quiconque en a obtenu
  une copie garde ces droits-là pour toujours. C'est l'AGPL qui couvre les
  versions à partir de celle-ci.
- **L'app le dit là où elle tourne**, et pas seulement dans un fichier à la
  racine : « à propos », les mentions légales, les conditions d'utilisation, le
  préambule des licences tierces servies avec l'app, et une notice en tête du
  JavaScript produit. L'article 13 demande que le programme offre sa source à
  qui s'en sert — un `LICENSE` que personne n'ouvre ne le fait pas.
- Les douze paquets embarqués (MIT, ISC, OFL 1.1) sont tous permissifs : aucun
  n'entre en conflit avec le copyleft, et leurs notices ne changent pas.

### Ajouté — ce que l'app doit dire d'elle-même

L'app était irréprochable techniquement et à découvert juridiquement. Ces
pages ne changent rien à ce qu'elle fait ; elles rendent vérifiable ce qu'elle
promet.

- **Licences des composants tiers**, produites depuis `node_modules` par
  `npm run licences` et servies avec l'app. Deux des douze paquets sont des
  fontes sous SIL Open Font License 1.1 — Archivo et Geist Mono —, qui demande
  d'être distribuée avec le logiciel de fonte : les `.woff2` partaient dans
  `dist/assets` sans qu'aucun texte de licence ne les accompagne. Le fichier
  est produit et jamais écrit à la main, et `npm run verify` échoue s'il a pris
  du retard.
- **Mentions légales** (`/mentions-legales`). L'article 1-1 de la LCEN — l'ancien
  6 III, déplacé par la loi du 21 mai 2024 — impose à tout éditeur de se rendre
  identifiable, hébergeur compris.
- **Politique de confidentialité** (`/confidentialite`). L'app ne fait aucune
  requête ; l'hébergeur, lui, journalise des adresses IP, et c'est le seul
  traitement du projet. La page dit aussi **pourquoi il n'y a pas de bandeau
  cookies** — IndexedDB porte les données elles-mêmes, donc l'exemption du
  strictement nécessaire s'applique — plutôt que de laisser cette absence se
  lire comme un oubli.
- **Conditions d'utilisation** (`/conditions`). MIT couvre le code, pas le
  service : sa clause de non-garantie protège qui récupère le dépôt, pas qui
  ouvre le site.
- Les trois répondent avant la création du foyer comme après, et se chargent à
  la demande — leur prose ne pèse sur le premier chargement de personne.
- **Un lien vers le journal des modifications** depuis « à propos » : la version
  s'affichait sans dire ce qu'elle apporte, sur une app qui refuse par principe
  de se mettre à jour dans le dos de qui l'utilise.
- **Des données structurées** dans la page : une app gratuite, installable et
  sous licence ouverte se présentait comme n'importe quel lien.

### Ajouté — périodicités et devise

- **Toutes les *n* semaines, tous les *n* ans.** Le modèle portait un intervalle
  sur les trois unités depuis la v1 ; le formulaire n'en proposait un que sur
  les mois. La quinzaine — le rythme d'une paie sur deux — ne se saisissait pas.
- **La devise se règle** (Réglages). Le champ existait au modèle, validé, migré,
  exporté et lu par tous les montants de l'app — et atteint par aucun écran : il
  valait « EUR » à perpétuité sans que rien ne le dise. Ce n'est pas la
  multi-devise, qui reste hors v1, et l'écran le dit : seul le symbole change,
  rien n'est converti.
- **« Où part l'argent » s'ouvre.** Chaque part de la légende mène aux lignes du
  mois qu'elle compte, comme les deux tuiles de flux mènent depuis longtemps à
  la liste filtrée sur leur nature.
- **« Tout afficher » sur la recherche.** La coupe à vingt était annoncée mais
  sans issue : « précise la recherche » ne sert à rien quand tout ce qui dépasse
  porte réellement le même mot.

### Corrigé — ce que le formulaire ne montrait pas, il l'effaçait

- **Une périodicité que le formulaire ne savait pas décrire se faisait réécrire
  à la première reprise de sa fiche.** Un document importé portant « toutes les
  deux semaines » s'affichait juste, se développait juste, et revenait
  hebdomadaire dès qu'on rouvrait sa fiche pour en corriger le libellé — ses
  échéances à venir replanifiées au double, sans un mot. La règle du cahier §3
  était bonne (un écran renvoie l'état complet de ce qu'il montre) ; c'est ce
  qu'il montrait qui ne l'était pas.
- **Une périodicité longue n'avait plus de prochaine échéance.**
  `nextOccurrence` regardait deux ans devant elle, en dur : une annuelle tous
  les trois ans rendait `null`, donc disparaissait de « Prochaines échéances »
  et se rangeait en fin de tri. L'horizon se déduit désormais de la période.
- **La note d'une entrée ne se relisait nulle part.** Il fallait rouvrir la
  ligne pour la voir, et rien n'annonçait qu'il y en avait une — alors qu'une
  fiche de récurrence affiche la sienne depuis toujours. Elle se lit désormais
  sur la liste du mois et dans les résultats de recherche.
- **« Le 31 de chaque mois » s'affichait sur une échéance qui tombe le 28.** Le
  jour est borné et jamais reporté, donc 31 *est* le dernier jour du mois : les
  écrans le nomment, et l'aide du champ dit le geste au lieu de le laisser
  deviner.
- **Le schéma donné à un assistant enseignait trois champs sans effet**
  (`Category.icon`, `MonthState.closed`, `settings.monthStartsOn`) comme s'ils
  réglaient quelque chose. Ils restent au modèle — deux d'entre eux sont ce
  qu'un chantier déjà envisagé redemanderait — mais le document les annonce
  désormais comme réservés.

---

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

### Corrigé — le foyer d'une seule personne

Aucune migration : `schemaVersion` reste à 6, rien ne change dans le document.

- **Le mois filtré sur le membre unique vaut désormais le mois du foyer, au
  centime.** Le prorata refusait de se calculer à moins de deux membres, et la
  vue filtrée retombait sur les seules lignes à son nom : le loyer, un salaire
  ou un versement laissés « tout le foyer » en disparaissaient, et le solde
  comme la capacité d'épargne divergeaient de l'écran d'à côté sans raison
  lisible. Un prorata à un seul participant n'est pas indéfini : il vaut
  100 %, sans qu'aucun revenu soit déclaré — il n'y a personne à comparer.
- **La tuile « Part du foyer » s'affiche aussi seul du foyer** : ses charges
  perso d'un côté, le pot entier de l'autre — précisément la distinction qui
  reste quand on est seul. La régularisation, elle, se calcule et rend zéro.
- **La pilule « Commun » se propose dès le premier membre** : le pot seul, à
  son montant plein, la seule lecture qui distingue encore les charges du
  foyer des siennes.
- **L'écran Répartition rend le pot en solo** — une ligne à 100 %, la liste
  vérifiable — au lieu d'exiger un second membre.

### Corrigé — l'épargne n'est pas une charge

Aucune migration : `schemaVersion` reste à 6. Les totaux, eux, ont toujours
été justes — la tuile Charges, la capacité d'épargne et la répartition ont
toujours exclu l'épargne. C'étaient les filtres des listes qui mentaient.

- **Les pilules des listes filtrent par nature, plus par sens.** Sur la liste
  du mois et sur les récurrences, « Charges » filtrait ce qui *sort* du
  compte : un versement d'épargne s'y rangeait — et une reprise se rangeait
  sous « Revenus ». Le sous-total du filtre contredisait alors la tuile
  Charges voisine, qui exclut l'épargne. « Charges » compte désormais comme la
  tuile — charges et crédits — et « Revenus » ne compte que les ressources.
- **L'épargne a sa pilule**, sur les deux listes : la même position que dans
  la saisie, et le seul endroit où isoler versements et reprises.
- **Le total en tête des récurrences suit le filtre** : sous « Charges » il
  laisse l'épargne dehors, sous « Épargne » il se compte en net — reprises
  déduites, comme partout — et chaque périmètre se dit sous le chiffre.
- **Cliquer la tuile Revenus ou Charges** filtre la liste sur la nature que la
  tuile compte, plus sur un sens qui montrait davantage.
- **Sous une pilule, les totaux parlent sa langue** : les charges en sortie
  pleine comme la tuile du même nom, les revenus en entrée, et l'épargne en
  net — versements moins reprises, comme partout. Le solde, signé par le sens,
  affichait « −300 € » sous la pilule Épargne d'un mois où l'on en plaçait
  300, et les groupes des récurrences contredisaient au signe près le total
  posé juste au-dessus d'eux.
- **L'alerte de changement de prix se tait sur l'épargne** : verser plus sur
  un livret n'est pas une facture qui flambe — rouge et panneau ne valent que
  pour une charge qui monte ou un revenu qui baisse. Le changement se lit
  quand même, en « montant » plutôt qu'en « prix ».
- **Le comparatif de deux mois ne peint plus en rouge un mois où l'on épargne
  davantage** : l'écart d'un livret se lit sans alarme, le rouge reste aux
  charges et aux crédits qui montent.
- **« Où part l'argent » dit ce qu'il compte** : son état vide annonce
  « Aucune charge ni crédit » — il annonçait « Aucune sortie » sur un mois où
  400 € étaient partis sur un livret — et sa lecture d'écran nomme les charges
  et les crédits, pas « les sorties ».
- **La feuille du Solde du mois explique enfin l'épargne** : un versement y
  compte comme une sortie — l'argent quitte bien le compte — et c'est la
  capacité d'épargne qui le met à part. C'était la question la plus fréquente
  devant ce chiffre, et aucune des trois feuilles n'y répondait.
- **Le calendrier a sa porte Épargne**, comme le mois et le bouton flottant :
  mettre de côté depuis un jour choisi passait par « Dépense ».

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
  DS §4 le promettait sans que rien ne l'implémente. Ceux de la grille bento et
  le chiffre héros seulement ; jamais sur mise à jour, donc jamais en changeant
  de mois ni de filtre ; rien du tout sous « réduire les animations ». Le DS dit
  désormais lesquels et à partir de quand, faute de quoi la règle se lisait de
  deux façons.
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

- **« Douze derniers mois » n'était pas les douze derniers mois** : la fenêtre
  s'arrêtait au mois choisi dans le bandeau de l'écran du mois. Or l'historique
  n'a pas de bandeau — rien n'y montrait cette borne, rien ne permettait de la
  bouger. Passer voir février 2026 puis ouvrir l'historique donnait douze mois
  sans le mois courant dedans. Elle s'arrête à aujourd'hui, et le nom accessible
  du graphique dit ses deux bornes au lieu d'un mois.
- **Le comptage des nombres était incohérent d'une tuile à l'autre.** Il suivait
  le premier affichage d'un *composant* et non d'un *écran* : un filtre par
  membre remonte cinq tuiles de la grille et laisse les autres en place, si bien
  que sur un même geste le solde et les revenus s'égrenaient et les charges
  sautaient. Ce qui apparaît après l'arrivée de l'écran ne compte plus.

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

### Ajouté — ce que le téléphone n'avait pas

- **Bouton de saisie flottant**, sous 1024px, au-dessus de la barre d'onglets.
  Les trois portes — dépense, revenu, épargne — vivaient en tête de l'écran du
  mois, dans le flux : elles défilaient avec la page, et disparaissaient tout à
  fait sur un mois vide. Le geste le plus fréquent de l'app demandait donc de
  remonter d'abord. Il se déplie sur les trois plutôt que d'en promettre une, se
  referme sur Échap, sur un appui à côté, et à tout changement d'écran ; rien
  sur un écran de saisie, où il partirait créer une ligne par-dessus celle qu'on
  écrit. La rangée en tête de page reste, à partir de 1024px : une porte par
  largeur, et pas deux.
- **Palier tablette** dans la grille bento — quatre colonnes entre 768 et
  1024px. Entre les deux, on avait la mise en page d'un téléphone étirée sur la
  pleine largeur d'un iPad. Aucun format du design system ne change : seule la
  correspondance format → colonnes.

### Corrigé — la seconde lecture des flux

- **« Reste 102 € à payer » se lit enfin sur un téléphone.** Sur les tuiles
  Revenus et Charges, cette ligne n'était affichée qu'au-delà de 1024px et
  aucune feuille d'explication ne la portait ailleurs : sous cette largeur,
  l'information n'était lisible nulle part. Les deux tuiles prennent désormais
  deux colonnes sous 1024px, ce qui lui donne la place.
- **Ce qui se masque faute de place se décide sur la place**, et non sur la
  largeur de l'écran : la règle est passée en requête de conteneur, sur la tuile
  elle-même. C'est ce qui rendait la précédente fausse dès qu'un format ne
  faisait plus la même largeur sur les trois paliers.

### Ajouté — installation et hors-ligne

- **L'installation se propose**, sur la page de présentation, sous la phrase qui
  vient de dire qu'il n'y a ni compte ni serveur. Elle ne l'était nulle part,
  pour l'app qui a le plus de raisons de le faire : un site non installé voit
  ses données effacées par Safari après environ une semaine sans visite. Rien
  n'est affiché quand le navigateur ne propose pas son invite — pas de détection,
  pas de marche à suivre écrite d'avance.
- **Indicateur hors-ligne** sur cette même page. L'app fonctionne sans réseau
  depuis toujours et ne l'avait jamais dit. Il annonce ce qui continue, pas ce
  qui manque.
- **Raccourcis du manifest** — « Ajouter une dépense » et « Le mois » — au
  maintien sur l'icône de l'app installée, et **captures d'écran** sur la fiche
  d'installation d'Android.
- **`og:image`, `robots.txt` et un repli sans JavaScript** : un lien partagé
  montrait son domaine, et la page était blanche pour qui n'exécute pas de
  script.

### Modifié — service worker et manifest

- **L'orientation n'est plus verrouillée en portrait** : la grille passe à
  quatre colonnes dès 768px et à six dès 1024, ce qu'une tablette n'atteint
  qu'en paysage.
- **Le manifest porte un `id` fixe.** Sans lui, changer un jour la page
  d'arrivée aurait fait de l'app une seconde app, installée à côté de la
  première — dont les données seraient restées là où plus personne ne va les
  chercher.
- **Le precache a une borne déclarée** et exclut les captures. Workbox écarte en
  silence tout fichier au-delà de sa borne par défaut : l'app serait restée
  installable et aurait cessé de fonctionner hors ligne sans que rien ne le
  dise.
- **Le service worker s'essaie en développement** avec `PWA_DEV=1 npm run dev`.
- **Les captures vivent dans `public/captures/`** — le `README`, le manifest et
  le partage les servent tous les trois, et il n'y en a qu'un exemplaire.

### Corrigé — ce que les lecteurs d'écran et le clavier ne trouvaient pas

Le socle était déjà bon — lien d'évitement, lecture accessible de chaque
graphique, contrastes calculés, `prefers-reduced-motion` traité à trois
niveaux. Restaient sept écarts, tous vérifiés sur le code. Aucun ne touche au
document : `schemaVersion` reste à 6.

- **Un montant pouvait être annoncé vide.** `Amount` — qui porte *tous* les
  montants de l'app — posait son nom accessible dans un `aria-label` sur un
  `span` sans rôle, ce qu'ARIA 1.2 interdit ; les lecteurs qui appliquent la
  règle l'ignoraient, et tout le rendu visuel étant masqué, il ne restait rien
  à dire. Le montant est désormais un texte caché à l'œil.
- **Trois tuiles enfermaient une liste dans un `<button>`** — les parts de
  chacun, les deux montants d'une part de foyer, les quatre chiffres d'un
  crédit. Du contenu de flux dans un élément qui n'admet que des phrases, et un
  nom unique derrière lequel toutes les lignes disparaissaient. Elles suivent
  le motif du DS §6 : tuile non cliquable, vrai lien au coin — le repère du
  coin lui-même, qui ne coûte rien au budget vertical d'une 2×2.
- **La bascule `Segmented` annonçait des boutons radio sans en tenir la
  promesse** : chaque position était un arrêt de tabulation — neuf pour trois
  choix sur l'écran de saisie — et les flèches ne faisaient rien. Elle suit
  l'APG sur les cinq écrans qui l'emploient.
- **Changer d'écran ne se disait pas.** Le focus restait sur le lien de
  navigation activé, et rien n'annonçait où l'on venait d'arriver. Le titre se
  dit dans une région live de la coquille, le focus part au contenu — sauf là
  où l'écran a posé le sien, comme le premier champ d'une saisie.
- **Une case du calendrier faisait 32px de large** sous 404px de fenêtre, pour
  une cible que le DS §8 fixe à 44px. La grille passe à bord perdu sous ce
  seuil, et c'est la gouttière qu'on sacrifie.
- **`EmptyState` se déclarait région live** en permanence, sur un texte qui ne
  change jamais.
- **Le `<h1>` s'écrivait de trois façons**, et le calendrier n'en avait aucun :
  rien ne le nommait à un lecteur d'écran. `PageTitle` porte les trois formes,
  et c'est de là que vient l'annonce d'écran.

### Modifié — ce qui deviendra visible sur des années de saisie

Rien d'urgent à l'échelle d'un document d'exemple. Trois points qui grandissent
avec l'usage, et une mesure pour que les choix tiennent.

- **Le mois se balaie une fois par rendu, et non dix.** Une dizaine de hooks
  lisent la même portée du mois, et le tableau de bord les appelle presque
  tous ; chacun refaisait le parcours complet du document pour son compte. Il a
  fallu remonter aux revenus du mois et à la nature d'une catégorie, eux-mêmes
  recalculés par chaque consommateur. La lecture par membre de l'épargne, qui
  balayait tout le document une fois par personne, le fait désormais une fois
  pour tout le foyer.
- **Quatre écrans ne voyagent plus avec l'app** : le nuancier — neuf cents
  lignes de route de développement que chaque visiteur téléchargeait —,
  l'historique et ses graphiques, les réglages, la présentation. Le premier
  chargement passe de 202 à 192 Kio compressés.
- **Le prévisionnel s'arrête à douze mois.** Chaque « mois suivant » ouvrait le
  mois, y écrivait toutes les échéances, et repoussait la borne d'un cran :
  cent clics valaient cent mois de prévisionnel définitivement écrits. La
  navigation cesse de proposer au-delà, et le store cesse d'écrire.
- **`npm run size` mesure le premier chargement** et le tient sous un budget.
  Un découpage par route ne se maintient pas tout seul — il suffit d'un import
  statique au mauvais endroit pour tout ramener, ce qui était arrivé au
  nuancier. La commande entre dans `npm run verify`, que la CI rejoue.

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
