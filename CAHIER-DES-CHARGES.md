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
- Régularisation d'un mois sur le suivant, quand une charge commune a été avancée par une seule personne
- Capacité d'épargne, ventilation par support et reste à placer, par personne
- Avances : une charge payée en une fois depuis l'épargne, remboursée mois par mois
- Export / import du fichier de données
- Thème clair et sombre

**Hors v1** — objectifs d'épargne datés, comptes bancaires multiples, import de relevés bancaires, budgets par enveloppe, multi-devise, solde roulant entre membres (une dette entre personnes qui court de mois en mois jusqu'à ce qu'un geste la solde ; la régularisation, elle, corrige le mois suivant et s'arrête là).

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
  advances: Advance[]
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

// Une charge payée en une fois depuis l'épargne, remboursée à soi-même mois
// par mois. La mensualité est de nature `saving` : la charge a déjà eu lieu.
type Advance = {
  id: string
  label: string
  categoryId: string            // la nature de la charge avancée
  memberId: string              // jamais facultatif : une épargne est à quelqu'un
  amount: Money                 // ce qui a été payé, en une fois
  paidOn: string                // le jour de la reprise sur le livret
  from: string                  // "2026-08" — premier mois couvert
  to: string                    // "2027-07" — dernier mois couvert, inclus
  recurrenceId?: string         // la mensualité qui reconstitue l'épargne
  note?: string
}

type Recurrence = {
  id: string
  label: string
  categoryId: string
  memberId?: string
  direction: 'in' | 'out'
  amount: Money | null          // null = montant à saisir à chaque échéance
  estimate?: Money              // montant habituel d'un variable, tant qu'aucune échéance n'est chiffrée
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
- L'historique de prix d’une récurrence se déduit des `Entry` liées à sa `recurrenceId`, il n'est pas stocké.
- **Une récurrence vaut la même chose partout.** « Combien vaut cette récurrence ? » est posée par le total des récurrences, par sa fiche, par le revenu d'un membre et par le montant proposé à l'ouverture d'un mois : une seule fonction y répond, sinon les quatre écrans se contredisent. Trois sources, dans cet ordre — le montant fixe ; sinon l'échéance chiffrée la plus proche, le passé d'abord et le jour même compris ; sinon l'`estimate`. Une échéance encore `planned` dont on a saisi le montant compte : c'est ce qu'on s'attend à payer ou à toucher. La case laissée à zéro par l'ouverture du mois ne compte pas — c'est un emplacement vide, pas un montant nul.
- `estimate` n'est **pas** une seconde vérité à côté de `amount` : c'est la seule qu'une récurrence variable puisse porter avant sa première échéance. Une échéance chiffrée l'emporte toujours, sans quoi une augmentation resterait invisible tant qu'on n'aurait pas pensé à corriger la récurrence.
- **Arrêter et supprimer une récurrence sont deux gestes distincts.** Arrêter la marque `endedOn` et retire ses échéances prévues au-delà : la règle reste, arrêtée, et se reprend. Supprimer l'efface pour de bon, avec ses échéances prévues. Rabattre le second sur le premier dès qu'une échéance avait été confirmée rendait la suppression inatteignable — la règle restait dans la liste pendant que l'écran annonçait qu'elle était supprimée.
- Supprimer une récurrence n'efface pas les `Entry` déjà confirmées : elles ont eu lieu, et **se détachent** de la règle — leur `recurrenceId` est retiré, leur montant et leur date ne bougent pas. Un `Debt` ou une `Advance` qui pointait sur la règle perd son lien, jamais son suivi.
- Une `Entry` `planned` reste sous la coupe de sa récurrence : changer la règle refait les échéances à venir. Une `Entry` `confirmed` **datée dans le passé** s'en détache définitivement — elle a eu lieu, et l'historique ne se réécrit pas. Une `Entry` `confirmed` **datée dans le futur** est une prévision validée d'avance, pas un fait : changer la règle la requalifie — libellé, catégorie, sens, membre, partage — sans jamais toucher à son montant, sa date ni son statut, qui ont pu être saisis à la main. Sans quoi un foyer qui confirme son mois à venir ne peut plus corriger la récurrence qui l'a produit.
- Un formulaire de reprise envoie l'**état complet** de ce qu'il montre, jamais un correctif : le champ qu'il n'envoie pas a été vidé, et l'enregistrement l'efface. Fusionner ne saurait pas distinguer « inchangé » d'« effacé », et remettre une récurrence à « tout le foyer » n'aurait aucun effet.
- Le sens d'une catégorie découle de la nature de sa famille, jamais l'inverse : `resource` entre, les trois autres sortent. Un versement sort du compte exactement comme une charge — c'est la nature, pas le sens, qui les distingue.
- Un `Debt` ne produit aucun chiffre de trésorerie : ce sont les `Entry` de la récurrence liée qui font sortir l'argent. Il n'ajoute que le capital, que la somme des mensualités ne dit pas dès qu'il y a des intérêts.
- Le revenu d'un membre est **dérivé de ses récurrences** de nature `resource`, ramenées au mois — jamais stocké à côté. Le déclarer en plus en ferait une seconde vérité, et la première augmentation les ferait diverger. C'est aussi ce qui donne au coefficient sa stabilité : une récurrence est une règle, une prime est une `Entry` ponctuelle — elle a lieu, mais elle ne dit rien de ce qu'on gagne.
- Un `Advance` ne produit aucun chiffre de trésorerie non plus : la reprise du jour du paiement et les mensualités qui la reconstituent sont des `Entry`. Il n'ajoute que ce qui a été avancé, donc ce qu'il reste à se rendre.
- **L'épargne se compte en net**, seule des quatre natures : les versements moins les reprises. Une reprise est une `Entry` de sens `in` sur une catégorie `saving` — sans quoi le mois où l'on vide 600 € d'un livret se lirait comme un mois où l'on a mis 600 € de côté.
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

- Création : libellé, catégorie, sens, périodicité, jour d'échéance, montant fixe ou « variable », membre selon la même règle que la saisie ponctuelle (§4.7 ter). Une récurrence pose une échéance par période : sans propriétaire ni partage, elle creuserait le trou à chaque fois.
- Périodicités : hebdomadaire, mensuelle, trimestrielle, annuelle, ou tous les *n* mois.
- Liste triée par prochaine échéance, avec le coût mensuel équivalent et le coût annuel.
- Liste regroupée sur un axe au choix : **sens**, **catégorie** ou **personne**, chaque groupe portant son nombre de récurrences et son solde mensuel. Par sens, les deux groupes s'ouvrent — le « + » que le DS accorde aux entrées ne suffit pas à distinguer un salaire d’une charge dans une liste qui les mêle, d'autant que la pastille prend la teinte de la catégorie et pas du sens. Sur les deux autres axes ils se replient. Le total en tête de page, lui, ne compte que les sorties.
- Un groupe dont tout est à montant variable affiche « montant variable » plutôt qu'un zéro, et un groupe qui n'en contient qu'une partie ne compte que ce qu'il sait chiffrer.
- Les périodicités non mensuelles sont amorties au mois dans toutes les statistiques.
- Une récurrence peut être arrêtée sans être supprimée — et supprimée sans être seulement arrêtée : les deux gestes existent côte à côte sur sa fiche, et chacun fait ce qu'il dit (§3). Les deux demandent confirmation, l'arrêt comme la suppression : le premier emporte les échéances prévues à venir.
- Créer, modifier ou reprendre une récurrence réaligne ses échéances à venir dans la foulée, dans tous les mois ouverts à partir du mois courant. L'utilisateur n'a jamais à demander cette régénération : poser la règle et en tirer les échéances sont un seul geste.
- Détection automatique de changement de prix : si le montant confirmé diffère du précédent, l'app le signale sur la fiche. L'alerte — rouge et panneau — n'apparaît que quand le changement coûte : une charge qui monte, un revenu qui baisse. Une augmentation de salaire se lit sans alarme.

### 4.3 Ouverture du mois

L'ouverture est un mécanisme interne, jamais une tâche : aucun écran ne demande de l'actionner.

1. Un mois s'ouvre dès qu'on l'affiche, s'il n'est pas passé — le mois courant à la première visite, un mois à venir dès qu'on y navigue.
2. L'app génère une `Entry` `planned` pour chaque échéance de récurrence tombant dans le mois.
3. Les échéances du mois se lisent en **une seule liste**, par date. Celles à montant variable y portent leur champ de saisie, pré-rempli du montant de la dernière échéance confirmée, et leur ligne le dit — une explication en tête de section est oubliée le temps d'arriver au champ qu'elle décrit. Toutes les lignes tiennent sur **un seul niveau**, de 320 à 1920px, et leurs montants — saisis ou non — s'alignent dans une même colonne de largeur fixe. Un libellé trop long tronque ; il ne renvoie jamais à la ligne.
4. L'utilisateur confirme en bloc ou une par une. « Confirmer le mois » ne touche pas aux montants à saisir, et l'écran le dit avant qu'on l'actionne.
4. bis **Confirmer se défait.** Une échéance confirmée redevient prévue, à l'unité depuis son écran ou pour tout le mois depuis la section « À confirmer » — qui ne disparaît donc plus une fois le mois bouclé : c'est là qu'on a confirmé, c'est là qu'on doit pouvoir revenir dessus. Le montant saisi est conservé : reconfirmer le retrouve tel quel. Seule une échéance de récurrence fait demi-tour ; une saisie ponctuelle est un fait, pas une prévision en attente, et se corrige ou se supprime.
5. Une échéance prévue **s'ouvre** : elle mène à l'écran de saisie, qui sait corriger un montant, changer une date, réattribuer un membre ou la supprimer. Confirmer n'a jamais été le seul geste possible, seulement le seul qu'on pouvait atteindre. Modifier ne confirme pas : la confirmation a son geste.

Un mois passé ne s'ouvre jamais tout seul : y faire apparaître des échéances que personne n'a confirmées inventerait un historique.

L'opération est idempotente — une échéance est reconnue à sa paire récurrence + date — donc naviguer d'un mois à l'autre ne duplique rien.

Une `Entry` `planned` compte dans les prévisions, jamais dans le réalisé.

### 4.4 Saisie ponctuelle

Écran plein, avec son URL. Formulaire court : sens, montant, catégorie, date, libellé, membre. Créée directement en `confirmed`.

Le membre est **facultatif tant que le partage prend la ligne en charge, obligatoire dès qu'il ne la prend pas** — voir « à quelqu'un, ou à tout le monde » en §4.7 ter. Le champ le dit à l'ouverture, avec la raison, et pas seulement après un échec d'enregistrement.

Une bascule **Nature** y siège en tête : **Dépense**, **Revenu**, **Épargne**. Elle ne demande pas le sens de trésorerie, elle demande ce qu'on enregistre — et en déduit le sens. Verser sur un livret sort du compte, donc se saisissait par « Dépense », et il fallait aller chercher « Livrets » entre les courses et le carburant : on ne dépense pas son épargne, on la déplace. Les catégories d'épargne ne figurent donc plus dans la liste d'une dépense, et réciproquement.

En **Épargne**, une seconde bascule dit le mouvement : **Je place** (l'argent quitte le compte pour un support) ou **Je reprends** (il en revient). Le second n'existait nulle part : le sens « entrée » ne proposait que des ressources, et un retrait de livret n'en est pas une. C'est la même écriture que la reprise d'une avance — une `Entry` de sens `in` sur une catégorie `saving` — et l'épargne se comptant en net, elle s'y retranche des versements.

La case « à partager » ne s'affiche qu'en Dépense, et seulement sur une catégorie de nature `charge` ou `debt` : un versement d'épargne sort du compte mais reste à qui le fait, et un revenu ne se répartit pas davantage — on compare ce que chacun gagne, on ne se le redistribue pas. Ailleurs, la case ne pouvait qu'afficher « non » et proposer un « oui » que le calcul aurait ignoré. Sur « tout le foyer », elle est cochée et verrouillée (§4.7 ter).

Une bascule **Ponctuel / Récurrence** y siège aussi, à la création seulement. En récurrence, l'écran ne pose plus un fait mais une règle : la date saisie devient la première échéance, la périodicité s'affiche, et une `Recurrence` est créée à la place de l'`Entry`. L'échéance du jour saisi part **confirmée** — l'utilisateur vient de dire qu'elle a eu lieu — et les suivantes arrivent prévues. En reprise, la bascule n'apparaît pas : convertir après coup une dépense passée en récurrence réécrirait un historique.

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
- **Part du foyer**, sous un filtre par membre seulement : ce que la personne filtrée porte des charges communes, le coefficient qui le produit, et ses charges à elle en regard. Ses chiffres comprennent déjà sa part du pot commun (§4.7 ter) — sans quoi elle se lirait comme si elle vivait sans loyer —, mais une fois fondue dans le total des charges, cette part ne se voit plus : le solde valait bien ses revenus moins ses charges moins sa part du foyer, et le troisième terme n'apparaissait nulle part. Elle vient donc juste après ce qui rentre et ce qui se paie, dont elle est la suite de la même phrase. C'est la contrepartie exacte de la tuile Répartition, qui montre les parts de tout le monde et s'efface sous un filtre : l'une ou l'autre est visible, jamais les deux, et elles mènent au même écran de détail. Les montants s'affichent au centime — arrondis, la part et les charges personnelles ne redonneraient plus le total annoncé par la tuile voisine.
- **Solde prévisionnel** : en incluant les `planned` restantes.
- **Reste à vivre** : solde prévisionnel jusqu'à la prochaine entrée d'argent.
- **Capacité d'épargne** : ressources − charges − crédits, donc avant versements, avec le taux d'épargne en seconde lecture. C'est ce que le solde ne dit pas : lui compte un versement comme une sortie, si bien qu'un mois où l'on met 300 € de côté se lit comme un mois où l'on a dépensé 300 € de plus.
- **Où part l'argent** : répartition par famille, sur les charges et les crédits. L'épargne en est exclue et se lit à part — elle sort du compte mais reste au foyer. Et elle ne s'y lit pas non plus en seconde lecture : un « mis de côté » sous l'anneau additionnait au foyer des épargnes individuelles, ce que le reste de l'app refuse de faire, et le faisait au seul confirmé quand l'anneau compte aussi les prévues. Ce qu'une personne a placé se dit sur **Capacité d'épargne**, sous un filtre par membre, et se détaille sur l'écran de l'épargne.
- **Capacité d'épargne**, seconde lecture : le reste à placer hors filtre, et « placé · reste » sous un filtre par membre — les deux moitiés de la capacité, individuelles l'une comme l'autre.
- **Crédits** : capital restant dû, tous crédits confondus.
- **Dépenses par jour**, barres empilées par catégorie.
- **Prochaines échéances**, les 5 suivantes avec le nombre de jours restants. Elle ne s'arrête pas aux mois déjà ouverts : au-delà, les échéances sont **projetées depuis les règles**, sans rien écrire. Une récurrence ne pose d'`Entry` que dans un mois affiché, si bien que la tuile sautait par-dessus les mois jamais visités et annonçait « dans 92 jours » quand deux mois d'échéances tombaient avant. Dans un mois ouvert, en revanche, l'échéance posée fait foi et rien n'est projeté : sa date ou son montant ont pu être corrigés, et l'une d'elles supprimée. Les **retards** du mois courant y figurent, en jours négatifs : une échéance passée que personne n'a confirmée est la plus proche de toutes.

Les quatre soldes — mois, prévisionnel, reste à vivre, capacité d'épargne — se ressemblent à l'œil sans dire la même chose, et aucun ne répond à « combien je gagne, combien je paie » : un solde a déjà fait la soustraction. C'est pourquoi les deux totaux qu'il combine se lisent à côté de lui, avant les trois autres. Les six tuiles s'ouvrent sur une feuille qui donne leur calcul et, surtout, ce qui les sépare de leurs voisines. La tuile entière est la cible : sur une rangée simple, un bouton d'aide et l'étiquette ne tiennent pas côte à côte.

**Trois lectures du mois, et non deux.** Le foyer se découpe de deux façons, et elles ne se recouvrent pas : `foyer = commun + les lignes perso de chacun` d'un côté, `foyer = la vue de chaque membre, additionnée` de l'autre. Le filtre porte donc trois positions — **tout le monde**, **le commun**, **une personne**.

- **Le commun** montre le pot seul, à son **montant plein** : aucune part n'y est calculée. C'est l'exact inverse de la lecture par membre, qui découpe ces mêmes lignes en parts. Il répond à ce qu'aucun écran ne savait dire — où part l'argent qu'on paie ensemble, quand ses échéances tombent, et ce qu'il coûtait le mois d'avant.
- Sous cette lecture, cinq tuiles s'effacent au lieu d'annoncer un zéro : un revenu ne se partage jamais, donc le pot n'en a aucun, et les quatre lectures qui soustraient des charges à des ressources — solde, prévisionnel, reste à vivre, capacité d'épargne — vaudraient toutes les charges au signe près. L'épargne s'en va pour la même raison qui l'exclut de « Où part l'argent ». Restent les charges, leur répartition par famille, les prochaines échéances et la Répartition entre membres.
- **« Tout le monde » n'est pas « tout le foyer ».** Le premier est une lecture — tout ce qui a eu lieu ; le second est ce que vaut une ligne que personne ne porte, donc commune. Les deux ont porté la même étiquette, à un écran d'écart, en voulant dire le contraire.
- L'épargne n'a pas de lecture commune : elle ne se partage jamais, et la proposer ne rendrait que des zéros.

Tous les dashboards acceptent ce filtre. Filtrer sur quelqu'un ne se réduit pas à ne garder que ses lignes : une charge commune n'appartient à personne, donc aucune ne passerait le filtre, et chacun se lirait comme s'il vivait sans loyer ni électricité — capacité d'épargne à peine inférieure au salaire, « aucune sortie ce mois-ci » sur la répartition. Un membre voit donc **ses lignes et sa part de chaque charge commune**, au prorata des revenus (§4.7 ter). L'en-tête le dit là où le filtre se choisit, et nomme ce qui manque quand le prorata ne se calcule pas — on retombe alors sur ses seules lignes, faute de mieux, mais on le sait.

Les **listes** ne suivent pas cette règle : à confirmer, entrées du mois, calendrier montrent les échéances réelles, en entier. On confirme une échéance, jamais une part.

### 4.7 Historique et comparatifs

- Navigation mois par mois sur toute la période couverte par les données.
- Courbe entrées / sorties / solde sur les 12 derniers mois.
- Comparaison de deux mois au choix, écart par catégorie en valeur et en pourcentage.
- Comparaison d'années : cumul par mois, année N contre année N−1.
- Les périodes sans donnée affichent un état vide explicite, pas un graphique à zéro.

### 4.7 bis Crédits et dettes

Un crédit se déclare avec son capital emprunté, ses dates de première et dernière mensualité, un taux annuel facultatif, et la récurrence qui le rembourse.

- Le **capital restant dû** est dérivé, jamais saisi : `Rₖ = Rₖ₋₁(1+i) − Mₖ`, appliqué à chaque mensualité **effectivement confirmée**, à son montant à elle. C'est la formule d'amortissement classique — `Rₙ = P(1+i)ⁿ − M((1+i)ⁿ − 1)/i` — écrite sous forme de récurrence : les deux donnent le même chiffre à mensualité constante, mais seule la récurrence accepte qu'un versement diffère des autres. Une renégociation, un différé, un remboursement anticipé changent le montant en cours de route, et rejouer le passé à la mensualité d'aujourd'hui inventerait un historique. La mensualité de la récurrence liée ne sert donc qu'à annoncer la suite.
- Une échéance **antérieure à la date de début** du crédit ne le rembourse pas : la récurrence a pu servir à autre chose avant d'y être rattachée.
- Sans taux, le capital décroît exactement de ce qui a été versé.
- Sans récurrence liée, le capital ne bouge pas — et l'écran le dit plutôt que de laisser croire à un crédit figé.
- Retirer un crédit du suivi n'efface ni les mensualités versées ni la récurrence qui les pose. Seul le suivi du capital s'arrête.

### 4.7 ter Répartition entre membres

À deux revenus inégaux, des parts égales ne le sont pas : sur 2 500 € et 2 000 €, un loyer partagé en deux pèse un quart plus lourd pour le second. La répartition dit ce que chacun verse sur les charges communes, **au prorata des revenus déclarés**.

- **Coefficient** : `revenu du membre ÷ revenus du foyer`. Sur 2 500 € et 2 000 €, 55,6 % et 44,4 %.
- **Le revenu ne se saisit nulle part** : il est la somme des récurrences de nature `resource` du membre — salaire, allocations, pension — ramenées au mois. Le montant de chacune est celui du §3 — la même fonction que pour le total des récurrences : le salaire qui pèse dans le prorata est au centime celui qu'affiche sa fiche. Une augmentation se saisit là où elle a lieu, dans la récurrence, et la répartition suit.
- **Un salaire à montant variable pèse dès qu'un chiffre existe** — dernière échéance chiffrée, ou montant habituel déclaré sur la récurrence. C'est le montage le plus courant d'un foyer dont les revenus bougent, et rien ne doit l'obliger à attendre un mois entier pour que le foyer se répartisse.
- **Le revenu se lit sur le mois affiché, jamais sur le jour où l'on regarde.** La répartition d'août se lit avec les revenus d'août, qu'on l'ouvre le 31 juillet ou le 15 août. Une récurrence compte pour un mois tant qu'elle n'est pas arrêtée avant ce mois ; une première échéance encore à venir ne l'exclut pas — elle a été déclarée, elle va tomber. C'est la même asymétrie que le total des récurrences, qui compte une récurrence à venir et exclut une récurrence arrêtée. Sans quoi le foyer qui pose ses deux salaires au 1er du mois prochain n'a aucune répartition, et en aurait une le lendemain : un chiffre de partage ne peut pas dépendre du moment où on ouvre l'écran.
- **Une ressource laissée « tout le foyer » ne compte dans le revenu de personne** : le prorata compare ce que chacun gagne, et un revenu commun ne dit rien de cet écart. Elle rentre bien sur le mois du foyer, mais elle ne pèse dans aucune part — les écrans qui parlent de revenus le **disent**, parce que c'est la première explication d'une répartition qui ne se calcule pas et la seule qui ne se devinait nulle part.
- **Charges communes** : les sorties de nature `charge` ou `debt` que personne ne s'est attribuées, plus celles cochées « à partager ». C'est la frontière de la capacité d'épargne, et pour la même raison : un versement sort du compte mais reste à qui le fait, il n'a rien à faire dans un partage.
- **La case « à partager » ne s'affiche que là où elle décide de quelque chose**, c'est-à-dire sur une sortie de nature `charge` ou `debt` : un revenu ne se répartit pas, un versement d'épargne non plus. Et sur « tout le foyer » elle est **cochée et verrouillée** : une charge que personne ne s'attribue *est* commune, par la règle même. La décocher sans dire à qui elle est produirait une ligne qui sort du compte du foyer sans apparaître dans le mois de personne. Elle reste visible plutôt que de disparaître — elle dit ce qui va se passer, et le geste pour en sortir est de choisir un membre, juste au-dessus. Choisir « tout le foyer » efface au passage une exception posée avant : deux vérités, dont celle qu'on ne voit pas gagnerait au calcul.
- Les échéances **prévues** comptent : la question est « combien verser ce mois-ci », pas « combien a déjà été payé ». Répondre au réalisé ferait grimper la part de chacun au fil du mois.
- La somme des parts vaut **exactement** le total, au centime. Arrondir chaque part dans son coin ne le garantirait pas ; les centimes restants vont aux plus forts restes, et l'écran affiche le total des parts pour qu'on le vérifie.
- Le partage se fait **charge par charge**, et non sur leur somme. Les deux donnent le même total au centime près, mais seul le découpage par charge se recompose : la part d'un poste, d'un jour ou d'une moitié de mois s'additionne alors exactement pour redonner la part du mois. C'est ce qui permet à l'écran du mois filtré sur quelqu'un et à celui-ci d'annoncer le même chiffre, et non deux chiffres à un centime l'un de l'autre.
- Le calcul ne se fait pas tant qu'un membre n'a aucune ressource récurrente à son nom, ou qu'il n'y en a qu'un. L'écran **nomme ce qui manque** au lieu d'afficher un zéro : un prorata au dénominateur incomplet ne vaut pas zéro, il ne veut rien dire.
- Et il nomme **laquelle des deux raisons** c'est : aucune récurrence de ressource, ou bien une récurrence variable pas encore chiffrée. Les deux n'appellent pas le même geste — envoyer créer un revenu qui existe déjà fait ajouter un doublon là où il ne manque qu'un montant.
- Lecture : une tuile sur l'écran du mois, et un écran plein `/repartition` qui montre le calcul. La tuile s'efface sans revenus complets, et sous un filtre par membre — une charge commune n'appartient à personne, aucune ne passerait le filtre. Sous ce filtre, c'est la tuile **Part du foyer** (§4.6) qui prend le relais : la même règle, lue du point de vue d'une seule personne, et le même écran de détail au bout.
- Le total **s'ouvre** sur la liste de ce qu'il compte, de la plus lourde à la plus légère. Un chiffre de répartition qu'on ne peut pas vérifier ne se vérifie pas, et une dépense qui n'a rien à faire dans le pot commun ne se repère qu'en la voyant.
- **À quelqu'un, ou à tout le monde.** Une ligne sans propriétaire et hors partage sort du compte du foyer sans apparaître dans le mois de personne : la somme des soldes individuels cesse alors de valoir celui du foyer, sans que rien ne le dise. C'est le cas d'un versement d'épargne que personne ne revendique — l'épargne ne se partage jamais —, d'une dépense dont on a décoché « à partager » sans dire à qui elle est, et de toute entrée d'argent, qui ne se partage pas davantage. La saisie exige donc le membre dans ces cas-là, et seulement dans ces cas-là : ailleurs, la règle de partage sait déjà où ranger la ligne. C'est une contrainte de saisie, pas une validation d'import : un document plus ancien garde ses lignes telles quelles, et les corriger se fait en les rouvrant.
- **Une charge commune avancée par une seule personne se régularise le mois suivant.** Elle a réglé une dépense dont chacun portait sa part : sans rien pour la rattraper, l'écart reste entre les deux et l'app le tait. Le mois suivant, celui qui n'a pas payé verse un peu plus, celui qui a avancé un peu moins. Ce que chacun a avancé moins ce qui lui en revenait, au prorata **du mois d'origine** : l'écart s'est creusé sous ses revenus à lui, et le rattraper au coefficient d'aujourd'hui rendrait une somme que personne n'a avancée.
- **Seules les charges communes qui portent un membre entrent dans le report.** Celles que personne ne s'est attribuées ont été réglées par le pot : elles n'avancent rien à personne, et elles sont donc hors du calcul des deux côtés à la fois. C'est cette symétrie qui fait que la somme des reports vaut **exactement zéro**, et donc que la somme des versements du mois suivant vaut encore, au centime, ses charges communes. La ligne de vérification continue de le montrer.
- **Confirmées seulement**, à rebours de la répartition. Une échéance prévue n'a été payée par personne, et dire d'elle qu'un membre l'a avancée inventerait un fait. C'est déjà la règle de tout chiffre rétrospectif dérivé — le capital restant dû d'un crédit et ce qui reste à remettre sur une avance ne comptent que les échéances effectivement confirmées.
- **Un report ne change pas ce qu'un mois a coûté à quelqu'un, seulement ce qu'il verse.** Le coût est arrêté au mois où la dépense a eu lieu ; ce qui se rattrape est un virement. Il n'entre donc dans aucun total de charges — ni dans le mois filtré, ni dans « ses charges » ni dans le coût de son mois, qui doivent continuer de se recomposer exactement — et se lit à côté d'eux, sur le montant à verser.
- Le report **s'ouvre** comme le pot lui-même, sur les charges avancées qui le produisent et le nom de qui les a réglées : c'est le chiffre qu'on discute le plus, et une régularisation qu'on ne peut pas vérifier ne se vérifie pas.
- Il porte sur **un mois, sans cumul** : l'écart de juillet corrige août, puis disparaît. L'app ne voit pas le compte joint — elle ne peut pas savoir si le virement corrigé a eu lieu, et un solde roulant qu'aucun geste ne vient solder dériverait sans fin.
- La v1 s'arrête là : elle dit ce que chacun doit verser, régularisation du mois précédent comprise, mais elle ne tient pas de compte courant entre les personnes.

### 4.7 quater Avances

Une **avance** est une charge payée en une fois depuis l'épargne, et remboursée à soi-même mois par mois. L'assurance auto se règle en un versement de 600 € qui couvre douze mois : la payer depuis un livret et se reverser 50 € chaque mois est le montage le plus courant d'un foyer qui n'encaisse pas un tel coup sur un seul mois.

Elle se déclare avec ce qui a été payé, la date du paiement, la nature de la charge, le support d'épargne repris, qui a avancé, et la période couverte — deux mois, bornes comprises.

- **La mensualité n'est pas une charge.** La charge a eu lieu, une fois. Ce qui se passe ensuite est un retour d'épargne : on remet sur le livret ce qu'on lui a pris. Elle est donc de nature `saving`, ne pèse pas dans les charges du mois, et réduit le reste à placer plutôt que la capacité d'épargne.
- **La mensualité se déduit, elle ne se saisit pas.** Répartie aux plus forts restes sur les mois couverts : sept mois à 85,71 € laisseraient trois centimes qu'aucune mensualité ne rendrait jamais. Deux chiffres saisis séparément finiraient de toute façon par ne plus se répondre.
- Comme un crédit, une avance ne produit aucun chiffre de trésorerie par elle-même : c'est **la récurrence liée** qui pose les mensualités, sur le support à reconstituer. Elle figure donc dans la liste des récurrences, sous ce support.
- **Le jour du paiement, une reprise d'épargne est enregistrée** : une `Entry` de sens `in` sur le support, du montant avancé. Le livret baisse d'autant, et cet argent redevient disponible. La dépense qu'elle a financée se saisit comme les autres — l'app ne l'invente pas à la place de qui l'a faite.
- **L'épargne se compte donc en net**, seule des quatre natures : ce qu'on y met moins ce qu'on y reprend. Sans quoi le mois où l'on vide 600 € d'un livret se lirait comme un mois où l'on a mis 600 € de côté. Les trois autres natures n'ont qu'un sens possible, il n'y a rien à y compenser.
- **Ce qui reste à remettre est dérivé**, jamais saisi : le montant avancé moins les échéances **effectivement confirmées**, à leur montant à elles, et jamais négatif. Même raison qu'un crédit — on peut se rembourser plus vite, sauter un mois, corriger un montant, et rejouer le passé au montant d'aujourd'hui inventerait un historique. Une échéance antérieure au paiement ne compte pas.
- Cochée « à partager », la mensualité entre dans les charges communes : chacun en porte sa part au prorata, et celui qui a avancé se retrouve remboursé.
- Le membre n'est **jamais facultatif** : une épargne est toujours à quelqu'un, et une avance que personne ne porte ne se reconstituerait sur le livret de personne.
- **Pas d'écran de reprise** : une avance décrit un paiement qui a eu lieu, une fois. La corriger, c'est la retirer et la reposer. Le retrait emporte la mensualité à venir — une avance qu'on ne suit plus n'a plus de raison de se reverser — mais jamais ce qui est déjà revenu sur le livret.

### 4.8 Données

- **Export** : un fichier `.json` contenant le document complet et son `schemaVersion`. Nom du fichier horodaté.
- **Import** : remplace intégralement les données, après **double** confirmation — c'est un effacement déguisé, le fichier arrive et tout le reste part. Le fichier est lu et validé avant qu'on demande quoi que ce soit : on ne fait pas confirmer un remplacement par un fichier illisible. Un import d'un `schemaVersion` antérieur passe par les migrations.
- **Réinitialisation** : efface tout, **triple** confirmation. Trois questions différentes — ce qui part, le fait qu'il n'y a pas de retour, la dernière chance d'exporter : trois fois la même phrase ne se lit plus, elle se clique.
- **Toute suppression demande confirmation**, et par la même boîte : supprimer une entrée, une récurrence, un crédit, une avance, retirer un membre, arrêter une récurrence, remettre le mois à confirmer. Le nombre de questions fait la gravité — une pour une ligne, deux pour un import, trois pour l'effacement. Chacune dit ce qui est perdu, jamais « êtes-vous sûr ». Archiver une catégorie n'en demande pas : rien n'y est supprimé, et l'archivage se défait.
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
