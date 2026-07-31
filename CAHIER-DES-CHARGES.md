# Cahier des charges — v1

App de suivi des finances du foyer. Full frontend, sans compte ni serveur.

---

## 1. Principes

1. **Aucun backend.** Les données vivent dans le navigateur. Rien ne sort de l'appareil.
2. **Quatre natures, un seul flux.** L'app suit des entrées et des sorties d'argent, rangées en Ressources, Charges, Crédits et Versements. Le sens dit si l'argent entre ou sort ; la nature dit ce qu'il devient. Pas de comptes bancaires, pas de bilan patrimonial.
3. **Prévu, puis confirmé.** Chaque mois est d'abord une prévision générée depuis les récurrences, que l'utilisateur valide au fil de l'eau.
4. **Rien à configurer pour démarrer.** Deux questions à l'ouverture, puis l'app est utilisable.

---

## 2. Périmètre

**Dans la v1**

- Récurrences (abonnements, charges, revenus) à montant fixe ou variable
- Dépenses et recettes ponctuelles
- Capital restant dû des crédits en cours
- Ouverture et suivi du mois courant
- Vue calendrier des échéances
- Dashboards du mois
- Historique des mois passés
- Comparatifs mois/mois et année/année
- Catégories rangées en familles, sous quatre natures
- Membres du foyer comme étiquette
- Répartition des charges communes entre membres, au prorata des revenus
- Export / import du fichier de données
- Thème clair et sombre

**Hors v1** — épargne et objectifs, comptes bancaires multiples, import de relevés bancaires, budgets par enveloppe, multi-devise, remboursements entre membres (qui doit combien à qui, une fois les charges avancées).

---

## 3. Modèle de données

Tout est stocké dans un document unique versionné.

```ts
type Money = number // centimes, entier signé

type Data = {
  schemaVersion: number
  household: { name: string; members: Member[] }
  families: Family[]
  categories: Category[]
  recurrences: Recurrence[]
  entries: Entry[]
  debts: Debt[]
  months: MonthState[]
  settings: { theme: 'light' | 'dark' | 'system'; currency: string; monthStartsOn: number }
}

// Le revenu qui sert au prorata n'est pas ici : il se lit sur les récurrences
// de nature `resource` que le membre porte.
type Member = { id: string; name: string; color: string }

// Ce que devient l'argent, par-delà son sens de trésorerie.
type CategoryKind = 'resource' | 'charge' | 'debt' | 'saving'

// Le premier niveau des catégories : l'onglet sous lequel on va chercher.
type Family = { id: string; label: string; kind: CategoryKind }

type Category = {
  id: string
  label: string
  familyId: string              // la famille porte la nature et la teinte
  icon: string
  color: string
  direction: 'in' | 'out'
  archived: boolean
}

type Debt = {
  id: string
  label: string
  categoryId: string
  recurrenceId?: string         // la mensualité qui l'amortit
  principal: Money              // capital emprunté
  startedOn: string
  endsOn: string
  rateBp?: number               // taux annuel en points de base, 450 = 4,50 %
  note?: string
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
  shared?: boolean              // voir Entry.shared ; les échéances en héritent
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
  shared?: boolean              // exception à la règle de partage, jamais sa copie
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
- Le sens d'une catégorie découle de la nature de sa famille, jamais l'inverse : `resource` entre, les trois autres sortent. Un versement sort du compte exactement comme une charge — c'est la nature, pas le sens, qui les distingue.
- Un `Debt` ne produit aucun chiffre de trésorerie : ce sont les `Entry` de la récurrence liée qui font sortir l'argent. Il n'ajoute que le capital, que la somme des mensualités ne dit pas dès qu'il y a des intérêts.
- Le revenu d'un membre est **dérivé de ses récurrences** de nature `resource`, ramenées au mois — jamais stocké à côté. Le déclarer en plus en ferait une seconde vérité, et la première augmentation les ferait diverger. C'est aussi ce qui donne au coefficient sa stabilité : une récurrence est une règle, une prime est une `Entry` ponctuelle — elle a lieu, mais elle ne dit rien de ce qu'on gagne.
- `shared` est une **exception** à la règle de partage, jamais sa copie. Absent, la règle tranche — et c'est ce qui permet à tout ce qui a déjà été saisi de rester exploitable sans être requalifié.

---

## 4. Fonctionnalités

### 4.1 Premier lancement

Deux étapes, aucune ne peut être sautée sur la première.

1. Nom du foyer. Champ libre, pré-rempli avec « Maison ».
2. Membres. L'utilisateur peut passer directement (usage solo) ou ajouter des personnes, prénom uniquement.

Un jeu de catégories par défaut est créé, modifiable ensuite.

### 4.1 bis Catégories

Deux niveaux. Une **famille** porte une nature — Ressources, Charges, Crédits et dettes, Versements — et ses catégories en héritent leur sens et leur teinte.

Le catalogue par défaut suit le vocabulaire d'un budget familial : Ressources (salaires, allocations, prestations familiales, pensions reçues, aide au logement, revenus fonciers), huit familles de charges (Logement, Communication, Transport, Vie courante, Santé, Famille et scolarité, Impôts et taxes, Loisirs et divers), Crédits et dettes (automobile, immobilier, location longue durée, crédits d'achat, autres), Versements (livrets, plans, assurance vie, épargne retraite, épargne entreprise).

Tout est modifiable : renommer une famille, en créer une avec sa nature, ajouter ou archiver une catégorie. La teinte et le sens ne se saisissent jamais — ils découlent de la famille, et les laisser diverger d'elle n'aurait aucun sens lisible.

### 4.2 Récurrences

- Création : libellé, catégorie, sens, périodicité, jour d'échéance, montant fixe ou « variable ».
- Périodicités : hebdomadaire, mensuelle, trimestrielle, annuelle, ou tous les *n* mois.
- Liste triée par prochaine échéance, avec le coût mensuel équivalent et le coût annuel.
- Liste regroupée sur un axe au choix : **sens**, **catégorie** ou **personne**, chaque groupe portant son nombre d'abonnements et son solde mensuel. Par sens, les deux groupes s'ouvrent — le « + » que le DS accorde aux entrées ne suffit pas à distinguer un salaire d'un abonnement dans une liste qui les mêle, d'autant que la pastille prend la teinte de la catégorie et pas du sens. Sur les deux autres axes ils se replient. Le total en tête de page, lui, ne compte que les sorties.
- Un groupe dont tout est à montant variable affiche « montant variable » plutôt qu'un zéro, et un groupe qui n'en contient qu'une partie ne compte que ce qu'il sait chiffrer.
- Les périodicités non mensuelles sont amorties au mois dans toutes les statistiques.
- Une récurrence peut être arrêtée sans être supprimée.
- Créer, modifier ou reprendre une récurrence réaligne ses échéances à venir dans la foulée, dans tous les mois ouverts à partir du mois courant. L'utilisateur n'a jamais à demander cette régénération : poser la règle et en tirer les échéances sont un seul geste.
- Détection automatique de changement de prix : si le montant confirmé diffère du précédent, l'app le signale sur la fiche. L'alerte — rouge et panneau — n'apparaît que quand le changement coûte : une charge qui monte, un revenu qui baisse. Une augmentation de salaire se lit sans alarme.

### 4.3 Ouverture du mois

L'ouverture est un mécanisme interne, jamais une tâche : aucun écran ne demande de l'actionner.

1. Un mois s'ouvre dès qu'on l'affiche, s'il n'est pas passé — le mois courant à la première visite, un mois à venir dès qu'on y navigue.
2. L'app génère une `Entry` `planned` pour chaque échéance de récurrence tombant dans le mois.
3. Les échéances du mois se lisent en **une seule liste**, par date. Celles à montant variable y portent leur champ de saisie, pré-rempli du montant de la dernière échéance confirmée, et leur ligne le dit — une explication en tête de section est oubliée le temps d'arriver au champ qu'elle décrit. Toutes les lignes tiennent sur **un seul niveau**, de 320 à 1920px, et leurs montants — saisis ou non — s'alignent dans une même colonne de largeur fixe. Un libellé trop long tronque ; il ne renvoie jamais à la ligne.
4. L'utilisateur confirme en bloc ou une par une. « Confirmer le mois » ne touche pas aux montants à saisir, et l'écran le dit avant qu'on l'actionne.
5. Une échéance prévue **s'ouvre** : elle mène à l'écran de saisie, qui sait corriger un montant, changer une date, réattribuer un membre ou la supprimer. Confirmer n'a jamais été le seul geste possible, seulement le seul qu'on pouvait atteindre. Modifier ne confirme pas : la confirmation a son geste.

Un mois passé ne s'ouvre jamais tout seul : y faire apparaître des échéances que personne n'a confirmées inventerait un historique.

L'opération est idempotente — une échéance est reconnue à sa paire récurrence + date — donc naviguer d'un mois à l'autre ne duplique rien.

Une `Entry` `planned` compte dans les prévisions, jamais dans le réalisé.

### 4.4 Saisie ponctuelle

Écran plein, avec son URL. Formulaire court : sens, montant, catégorie, date, libellé, membre optionnel. Créée directement en `confirmed`.

Une bascule **Ponctuel / Abonnement** y siège, à la création seulement. En abonnement, l'écran ne pose plus un fait mais une règle : la date saisie devient la première échéance, la périodicité s'affiche, et une `Recurrence` est créée à la place de l'`Entry`. L'échéance du jour saisi part **confirmée** — l'utilisateur vient de dire qu'elle a eu lieu — et les suivantes arrivent prévues. En reprise, la bascule n'apparaît pas : convertir après coup une dépense passée en abonnement réécrirait un historique.

Dépense et revenu sont deux points d'entrée distincts, côte à côte, sur le mois comme sur le calendrier : le sens est choisi avant d'ouvrir le formulaire, qui s'ouvre déjà réglé. Titre et confirmation le suivent — on n'annonce pas « dépense ajoutée » après un salaire.

La date proposée est aujourd'hui si l'on est dans le mois affiché, sinon le premier de ce mois — et le jour sélectionné quand la saisie part du calendrier.

### 4.4 bis Liste du mois

Ce qui a eu lieu, regroupé sur un axe au choix : **jour**, **catégorie** ou **personne**. Chaque groupe porte son nombre de lignes et son **solde** — pas une somme : un jour où l'on touche un salaire et où l'on paie le loyer ne se résume pas en additionnant les deux.

Les groupes se replient. Par jour, ils s'ouvrent — c'est l'ordre de la lecture. Par catégorie ou par personne, ils se replient : c'est un résumé dans lequel on entre, et l'en-tête porte déjà la réponse. Un « tout replier » vaut pour la liste entière.

Par jour, du plus récent au plus ancien. Sur les deux autres axes, le plus gros mouvement d'abord.

### 4.5 Calendrier

Vue mensuelle. Chaque jour porte une pastille par échéance, couleur de la catégorie, opacité réduite si `planned`. Un jour sélectionné ouvre la liste de ses entrées.

### 4.6 Dashboards du mois

- **Solde du mois** : entrées confirmées − sorties confirmées.
- **Revenus** : ce que le mois fait rentrer — les ressources, `planned` comprises —, avec ce qui reste à tomber en seconde lecture.
- **Charges** : ce que le mois fait payer — charges et crédits, `planned` compris —, avec le reste à payer en seconde lecture. L'épargne en est exclue, comme partout : un versement sort du compte mais reste au foyer, et personne ne le réclame.
- **Solde prévisionnel** : en incluant les `planned` restantes.
- **Reste à vivre** : solde prévisionnel jusqu'à la prochaine entrée d'argent.
- **Capacité d'épargne** : ressources − charges − crédits, donc avant versements, avec le taux d'épargne en seconde lecture. C'est ce que le solde ne dit pas : lui compte un versement comme une sortie, si bien qu'un mois où l'on met 300 € de côté se lit comme un mois où l'on a dépensé 300 € de plus.
- **Où part l'argent** : répartition par famille, sur les charges et les crédits. L'épargne en est exclue et se lit à part — elle sort du compte mais reste au foyer.
- **Crédits** : capital restant dû, tous crédits confondus.
- **Dépenses par jour**, barres empilées par catégorie.
- **Prochaines échéances**, les 5 suivantes avec le nombre de jours restants.
- **Total abonnements**, mensuel et annualisé.

Les quatre soldes — mois, prévisionnel, reste à vivre, capacité d'épargne — se ressemblent à l'œil sans dire la même chose, et aucun ne répond à « combien je gagne, combien je paie » : un solde a déjà fait la soustraction. C'est pourquoi les deux totaux qu'il combine se lisent à côté de lui, avant les trois autres. Les six tuiles s'ouvrent sur une feuille qui donne leur calcul et, surtout, ce qui les sépare de leurs voisines. La tuile entière est la cible : sur une rangée simple, un bouton d'aide et l'étiquette ne tiennent pas côte à côte.

Tous les dashboards acceptent un filtre par membre. Filtrer sur quelqu'un ne se réduit pas à ne garder que ses lignes : une charge commune n'appartient à personne, donc aucune ne passerait le filtre, et chacun se lirait comme s'il vivait sans loyer ni électricité — capacité d'épargne à peine inférieure au salaire, « aucune sortie ce mois-ci » sur la répartition. Un membre voit donc **ses lignes et sa part de chaque charge commune**, au prorata des revenus (§4.7 ter). L'en-tête le dit là où le filtre se choisit, et nomme ce qui manque quand le prorata ne se calcule pas — on retombe alors sur ses seules lignes, faute de mieux, mais on le sait.

Les **listes** ne suivent pas cette règle : à confirmer, entrées du mois, calendrier montrent les échéances réelles, en entier. On confirme une échéance, jamais une part.

### 4.7 Historique et comparatifs

- Navigation mois par mois sur toute la période couverte par les données.
- Courbe entrées / sorties / solde sur les 12 derniers mois.
- Comparaison de deux mois au choix, écart par catégorie en valeur et en pourcentage.
- Comparaison d'années : cumul par mois, année N contre année N−1.
- Les périodes sans donnée affichent un état vide explicite, pas un graphique à zéro.

### 4.7 bis Crédits et dettes

Un crédit se déclare avec son capital emprunté, ses dates de première et dernière mensualité, un taux annuel facultatif, et l'abonnement qui le rembourse.

- Le **capital restant dû** est dérivé, jamais saisi : `Rₙ = P(1+i)ⁿ − M((1+i)ⁿ − 1) / i`, où `n` est le nombre de mensualités effectivement confirmées.
- Sans taux, le capital décroît exactement du montant versé.
- Sans abonnement lié, le capital ne bouge pas — et l'écran le dit plutôt que de laisser croire à un crédit figé.
- Retirer un crédit du suivi n'efface ni les mensualités versées ni l'abonnement qui les pose. Seul le suivi du capital s'arrête.

### 4.7 ter Répartition entre membres

À deux revenus inégaux, des parts égales ne le sont pas : sur 2 500 € et 2 000 €, un loyer partagé en deux pèse un quart plus lourd pour le second. La répartition dit ce que chacun verse sur les charges communes, **au prorata des revenus déclarés**.

- **Coefficient** : `revenu du membre ÷ revenus du foyer`. Sur 2 500 € et 2 000 €, 55,6 % et 44,4 %.
- **Le revenu ne se saisit nulle part** : il est la somme des récurrences de nature `resource` du membre — salaire, allocations, pension — ramenées au mois. Une récurrence à montant variable est estimée à sa dernière échéance confirmée, comme le total des abonnements. Une augmentation se saisit là où elle a lieu, dans l'abonnement, et la répartition suit.
- **Charges communes** : les sorties de nature `charge` ou `debt` que personne ne s'est attribuées, plus celles cochées « à partager ». C'est la frontière de la capacité d'épargne, et pour la même raison : un versement sort du compte mais reste à qui le fait, il n'a rien à faire dans un partage.
- Les échéances **prévues** comptent : la question est « combien verser ce mois-ci », pas « combien a déjà été payé ». Répondre au réalisé ferait grimper la part de chacun au fil du mois.
- La somme des parts vaut **exactement** le total, au centime. Arrondir chaque part dans son coin ne le garantirait pas ; les centimes restants vont aux plus forts restes, et l'écran affiche le total des parts pour qu'on le vérifie.
- Le partage se fait **charge par charge**, et non sur leur somme. Les deux donnent le même total au centime près, mais seul le découpage par charge se recompose : la part d'un poste, d'un jour ou d'une moitié de mois s'additionne alors exactement pour redonner la part du mois. C'est ce qui permet à l'écran du mois filtré sur quelqu'un et à celui-ci d'annoncer le même chiffre, et non deux chiffres à un centime l'un de l'autre.
- Le calcul ne se fait pas tant qu'un membre n'a aucune ressource récurrente à son nom, ou qu'il n'y en a qu'un. L'écran **nomme ce qui manque** au lieu d'afficher un zéro : un prorata au dénominateur incomplet ne vaut pas zéro, il ne veut rien dire.
- Lecture : une tuile sur l'écran du mois, et un écran plein `/repartition` qui montre le calcul. La tuile s'efface sans revenus complets, et sous un filtre par membre — une charge commune n'appartient à personne, aucune ne passerait le filtre.
- Le total **s'ouvre** sur la liste de ce qu'il compte, de la plus lourde à la plus légère. Un chiffre de répartition qu'on ne peut pas vérifier ne se vérifie pas, et une dépense qui n'a rien à faire dans le pot commun ne se repère qu'en la voyant.
- La v1 s'arrête à l'allocation : elle dit ce que chacun doit verser, pas qui a avancé quoi ni qui rembourse qui.

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
