# Journal des modifications

Toutes les évolutions notables de ce projet sont consignées ici.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et le
versionnage la [gestion sémantique de version](https://semver.org/lang/fr/).

Une remarque propre à cette app : comme les données vivent dans le navigateur,
toute évolution du modèle de données passe par une **migration de schéma**. Les
versions qui en portent une le disent explicitement — c'est ce qui garantit
qu'un fichier exporté aujourd'hui se rouvre demain.

## [Non publié]

Rien pour l'instant.

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
