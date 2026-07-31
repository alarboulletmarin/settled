# Cahier des charges — v1

App de suivi des finances du foyer. Full frontend, sans compte ni serveur.

---

## 1. Principes

1. **Aucun backend.** Les données vivent dans le navigateur. Rien ne sort de l'appareil.
2. **Un seul flux.** L'app suit des entrées et des sorties d'argent. Pas de comptes, pas de bilan, pas de patrimoine.
3. **Prévu, puis confirmé.** Chaque mois est d'abord une prévision générée depuis les récurrences, que l'utilisateur valide au fil de l'eau.
4. **Rien à configurer pour démarrer.** Deux questions à l'ouverture, puis l'app est utilisable.

---

## 2. Périmètre

**Dans la v1**

- Récurrences (abonnements, charges, revenus) à montant fixe ou variable
- Dépenses et recettes ponctuelles
- Ouverture et suivi du mois courant
- Vue calendrier des échéances
- Dashboards du mois
- Historique des mois passés
- Comparatifs mois/mois et année/année
- Catégories
- Membres du foyer comme étiquette
- Export / import du fichier de données
- Thème clair et sombre

**Hors v1** — épargne et objectifs, comptes bancaires multiples, import de relevés bancaires, budgets par enveloppe, multi-devise, partage de dépenses entre membres.

---

## 3. Modèle de données

Tout est stocké dans un document unique versionné.

```ts
type Money = number // centimes, entier signé

type Data = {
  schemaVersion: number
  household: { name: string; members: Member[] }
  categories: Category[]
  recurrences: Recurrence[]
  entries: Entry[]
  months: MonthState[]
  settings: { theme: 'light' | 'dark' | 'system'; currency: string; monthStartsOn: number }
}

type Member = { id: string; name: string; color: string }

type Category = {
  id: string
  label: string
  icon: string
  color: string
  direction: 'in' | 'out'
  archived: boolean
}

type Recurrence = {
  id: string
  label: string
  categoryId: string
  memberId?: string
  direction: 'in' | 'out'
  amount: Money | null          // null = montant à saisir à chaque échéance
  period: { unit: 'week' | 'month' | 'year'; every: number; anchorDay: number }
  startedOn: string             // ISO date
  endedOn?: string              // récurrence arrêtée
  note?: string
}

type Entry = {
  id: string
  recurrenceId?: string         // absent = ponctuel
  label: string
  categoryId: string
  memberId?: string
  direction: 'in' | 'out'
  amount: Money
  date: string                  // ISO date
  status: 'planned' | 'confirmed'
  note?: string
}

type MonthState = {
  ym: string                    // "2026-07"
  openedAt: string
  closed: boolean
}
```

**Règles**

- Les montants sont des entiers en centimes. Aucun flottant nulle part.
- Une `Entry` est la seule source de vérité pour les statistiques. Une récurrence ne produit jamais de chiffre directement.
- L'historique de prix d'un abonnement se déduit des `Entry` liées à sa `recurrenceId`, il n'est pas stocké.
- Supprimer une récurrence n'efface pas les `Entry` déjà confirmées : elle est marquée `endedOn`.
- Une `Entry` `planned` reste sous la coupe de sa récurrence : changer la règle refait les échéances à venir. Une `Entry` `confirmed` s'en détache définitivement — elle a eu lieu, et l'historique ne se réécrit pas.

---

## 4. Fonctionnalités

### 4.1 Premier lancement

Deux étapes, aucune ne peut être sautée sur la première.

1. Nom du foyer. Champ libre, pré-rempli avec « Maison ».
2. Membres. L'utilisateur peut passer directement (usage solo) ou ajouter des personnes, prénom uniquement.

Un jeu de catégories par défaut est créé, modifiable ensuite.

### 4.2 Récurrences

- Création : libellé, catégorie, sens, périodicité, jour d'échéance, montant fixe ou « variable ».
- Périodicités : hebdomadaire, mensuelle, trimestrielle, annuelle, ou tous les *n* mois.
- Liste triée par prochaine échéance, avec le coût mensuel équivalent et le coût annuel.
- Les périodicités non mensuelles sont amorties au mois dans toutes les statistiques.
- Une récurrence peut être arrêtée sans être supprimée.
- Créer, modifier ou reprendre une récurrence réaligne ses échéances à venir dans la foulée, dans tous les mois ouverts à partir du mois courant. L'utilisateur n'a jamais à demander cette régénération : poser la règle et en tirer les échéances sont un seul geste.
- Détection automatique de changement de prix : si le montant confirmé diffère du précédent, l'app le signale sur la fiche.

### 4.3 Ouverture du mois

L'ouverture est un mécanisme interne, jamais une tâche : aucun écran ne demande de l'actionner.

1. Un mois s'ouvre dès qu'on l'affiche, s'il n'est pas passé — le mois courant à la première visite, un mois à venir dès qu'on y navigue.
2. L'app génère une `Entry` `planned` pour chaque échéance de récurrence tombant dans le mois.
3. Les récurrences à montant variable sont listées à part, avec le montant du mois précédent proposé par défaut.
4. L'utilisateur confirme en bloc ou une par une.

Un mois passé ne s'ouvre jamais tout seul : y faire apparaître des échéances que personne n'a confirmées inventerait un historique.

L'opération est idempotente — une échéance est reconnue à sa paire récurrence + date — donc naviguer d'un mois à l'autre ne duplique rien.

Une `Entry` `planned` compte dans les prévisions, jamais dans le réalisé.

### 4.4 Saisie ponctuelle

Écran plein, avec son URL. Formulaire court : sens, montant, catégorie, date, libellé, membre optionnel. Créée directement en `confirmed`.

Dépense et revenu sont deux points d'entrée distincts, côte à côte, sur le mois comme sur le calendrier : le sens est choisi avant d'ouvrir le formulaire, qui s'ouvre déjà réglé. Titre et confirmation le suivent — on n'annonce pas « dépense ajoutée » après un salaire.

La date proposée est aujourd'hui si l'on est dans le mois affiché, sinon le premier de ce mois — et le jour sélectionné quand la saisie part du calendrier.

### 4.5 Calendrier

Vue mensuelle. Chaque jour porte une pastille par échéance, couleur de la catégorie, opacité réduite si `planned`. Un jour sélectionné ouvre la liste de ses entrées.

### 4.6 Dashboards du mois

- **Solde du mois** : entrées confirmées − sorties confirmées.
- **Solde prévisionnel** : en incluant les `planned` restantes.
- **Reste à vivre** : solde prévisionnel jusqu'à la prochaine entrée d'argent.
- **Répartition par catégorie** sur les sorties du mois.
- **Dépenses par jour**, barres empilées par catégorie.
- **Prochaines échéances**, les 5 suivantes avec le nombre de jours restants.
- **Total abonnements**, mensuel et annualisé.

Tous les dashboards acceptent un filtre par membre.

### 4.7 Historique et comparatifs

- Navigation mois par mois sur toute la période couverte par les données.
- Courbe entrées / sorties / solde sur les 12 derniers mois.
- Comparaison de deux mois au choix, écart par catégorie en valeur et en pourcentage.
- Comparaison d'années : cumul par mois, année N contre année N−1.
- Les périodes sans donnée affichent un état vide explicite, pas un graphique à zéro.

### 4.8 Données

- **Export** : un fichier `.json` contenant le document complet et son `schemaVersion`. Nom du fichier horodaté.
- **Import** : remplace intégralement les données après confirmation. Un import d'un `schemaVersion` antérieur passe par les migrations.
- **Réinitialisation** : efface tout, double confirmation.
- Une bannière rappelle l'export si le dernier date de plus de 30 jours, ou n'a jamais eu lieu — le texte dit alors ce qu'il en est plutôt que d'invoquer un export inexistant.
- Elle s'écarte à la croix ou d'un balayage vers le haut. Le refus est enregistré sur l'appareil et vaut pour un cycle de trente jours : une croix ne condamne pas au silence des données qui ne sont sauvegardées nulle part. Un export l'oublie.

---

## 5. Contraintes techniques

**Stack** — React 19 + Vite + TypeScript, aligné sur Zoned. Déploiement Vercel.

**Stockage** — IndexedDB, un seul enregistrement contenant le document. Hydratation complète en mémoire au démarrage, calculs de statistiques à la volée, persistance en debounce sur mutation. Pas d'index, pas de requêtes.

**PWA** — installable, manifest complet, service worker de cache applicatif. C'est une exigence, pas un bonus : sur iOS, un site non installé voit son IndexedDB purgé après environ 7 jours sans visite.

**Migrations** — chaque changement de forme du document incrémente `schemaVersion` et fournit une fonction de migration. À écrire dès la v1, y compris pour la version 1 → 1.

**Accessibilité** — contraste AA sur tout texte, focus clavier visible, `prefers-reduced-motion` respecté, graphiques doublés d'une lecture textuelle.

**Langue** — français uniquement en v1, mais aucune chaîne en dur dans les composants.

---

## 6. Critères de sortie

La v1 est livrable quand :

- un utilisateur peut installer l'app, créer son foyer, saisir ses récurrences et boucler un mois complet sans documentation ;
- les données survivent à la fermeture du navigateur et à un redémarrage de l'appareil ;
- un export réimporté restitue un état strictement identique ;
- les comparatifs se comportent correctement avec un seul mois de données ;
- les deux thèmes sont complets, aucun écran n'est cassé dans l'un ou l'autre.
