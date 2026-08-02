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
