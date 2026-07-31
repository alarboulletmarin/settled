# Settled

Suivi des finances du foyer. Full frontend, sans compte ni serveur : les données
vivent dans le navigateur et rien ne sort de l'appareil.

`CAHIER-DES-CHARGES.md` et `DESIGN-SYSTEM.md` sont la source de vérité.

## Démarrer

```sh
npm install
npm run dev
```

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run preview` | sert le build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run verify` | les quatre d'un coup — c'est la porte de sortie |

## Repères

- `src/styles/tokens.css` — les tokens du design system, déclarés une seule fois,
  en quatre couches : palette de base, tokens sémantiques, couche dérivée,
  exposition à Tailwind. Un composant qui écrit `var(--pine-500)` est un bug.
- `/styleguide` — chaque token, chaque échelle typographique et chaque composant,
  dans les deux thèmes. Livrable permanent, maintenu à jour.
- `src/domain/` — logique métier pure, sans UI, entièrement testée.
- `src/store/` — état zustand. Un composant lit un sélecteur et appelle une
  action, rien de plus.
- `src/i18n/fr.ts` — toutes les chaînes. Aucun texte en dur dans un composant.
- `src/ui/Icons.tsx` — le seul module qui connaît la bibliothèque d'icônes. Un
  composant qui importe Phosphor directement est un bug.

## Choix structurants

**Money.** Entier signé en centimes, *branded*. Additionner deux `Money` produit
un `number`, pas un `Money` : le résultat ne peut pas être réaffecté sans
repasser par `money()`, qui rejette tout non-entier. Aucun flottant ne touche un
montant.

**Dates.** Chaînes ISO `YYYY-MM-DD`, arithmétique civile en entiers
(`days_from_civil`). `new Date` n'apparaît que dans `today()`, via ses seuls
accesseurs locaux. Aucune conversion UTC nulle part.

**Échéances.** Le jour d'échéance est borné, jamais reporté : une mensuelle au 31
tombe le 31 janvier, le 28 février, puis de nouveau le 31 mars.

**Ouverture du mois.** Jamais une tâche pour l'utilisateur : afficher un mois
non passé l'ouvre. Idempotente — une échéance est reconnue à sa paire récurrence
+ date — donc naviguer d'un mois à l'autre ne duplique rien et ne touche aucune
entrée confirmée. Un mois passé ne s'ouvre pas tout seul : y faire apparaître des
échéances que personne n'a confirmées inventerait un historique.

**Règle et fait.** Un abonnement est une règle, une échéance est un fait. Toute
écriture sur une récurrence réaligne ses échéances à venir dans tous les mois
ouverts, dans la même mutation. Les confirmées ne bougent jamais.

**Graphiques.** Aucune librairie. L'anneau, les barres empilées et les courbes
sont des composants SVG maison, dans `src/ui/Ring.tsx` et `src/charts/`.

**Icônes.** Phosphor, graisse `bold`, réexportée sous des noms à nous par
`src/ui/Icons.tsx` — changer de bibliothèque ne doit toucher qu'un fichier.
Import par chemin (`@phosphor-icons/react/dist/csr/<Nom>`) et non depuis l'index,
dont le barrel de neuf mille icônes ralentit le démarrage en dev. Coût réel :
environ 2,5 ko brut par icône, parce que chaque module embarque ses six graisses
dans une `Map` lue à l'exécution — on n'en affiche qu'une, aucun bundler ne peut
élaguer les autres. Les deux emplois autorisés sont fixés au DS §9.

## Écarts au design system

Le DS impose en section 8 un contraste AA sur tout texte. Six de ses propres
valeurs ne le tiennent pas. Chaque écart est commenté à l'endroit où il est
appliqué, et reste réversible en une ligne.

| Point | Valeur du DS | Mesure | Retenu |
|---|---|---|---|
| `--text-muted` en clair | `--ink-400` | 3,72:1 sur `--surface` | même teinte à 75 % → 5,99:1 |
| `--text-muted` en sombre | `#8FA09A` | 2,75:1 sur `--bg`, qui est du sapin | `--pine-100` sur le fond, valeur du DS dans les surfaces |
| `--accent-2` | `--violet-500` | blanc à 3,53:1, alors que le DS §2.3 l'annonce AA | `--violet-600` → 4,67:1, déjà dans la palette |
| texte d'alerte | `--alert-500` | 3,55:1 sur `--bg` | `--danger-text` ; `--danger` reste un remplissage |
| symbole monétaire | opacité 0.5 | 3,65:1 sur `--surface` | 0.6, et 1 là où la couleur de texte n'a aucune marge |
| échéance prévue | opacité 60 % | ruine le contraste du libellé | pastille en pointillés + couleur de texte secondaire |

Deux autres points relèvent de la lecture plutôt que du contraste :

- `Category.icon` existe au modèle de données mais reste vide et n'est jamais
  rendu. Le DS §9 n'admet l'icône que pour agir ou se repérer : sur une ligne de
  liste, la pastille de couleur tient déjà le rôle de repère, et deux marqueurs
  côte à côte n'en font plus aucun.
- `settings.monthStartsOn` est stocké et migrable, mais la v1 raisonne en mois
  calendaire — les `ym` du cahier sont de la forme `"2026-07"`.

La date du dernier export vit en `localStorage`, hors du document : elle décrit
l'état de sauvegarde de cet appareil, et l'inclure ferait qu'un fichier importé
prétendrait avoir été sauvegardé à l'instant. Le refus du rappel y vit pour la
même raison, et sous la même forme : une date, pas un booléen, pour qu'un refus
vaille un cycle de trente jours et non l'éternité.

## Responsive

Mobile d'abord : le style non préfixé vise le téléphone, les variantes `lg:`
ajoutent le confort au-delà. Deux grilles seulement, celles du DS §5 — deux
colonnes, puis six.

Le point de bascule est à **1024px, et non 768**. La colonne latérale consomme
224px : déclencher les six colonnes en même temps qu'elle ne laisse que ~480px
de contenu sur une tablette portrait, et chaque tuile tombe sous 80px de large.
En dessous de 1024px, l'app garde donc la barre d'onglets et la grille à deux
colonnes, en pleine largeur.

Vérifié sans débordement horizontal de 320 à 1920px sur tous les écrans.

Saisies et fiches sont des écrans pleins avec leur URL, pas des feuilles
modales : rien à faire glisser, rien à refermer pour revenir. `ui/Sheet.tsx`
subsiste sans appelant — son sort est une décision de design system, pas de
ménage.

Le mois se balaie horizontalement au doigt, le rappel d'export se chasse d'un
balayage vers le haut, et les cibles tactiles font 44px partout.

Un piège à connaître sur les gestes : `touch-action: pan-x` est ce qui rend le
balayage vertical possible. Sans lui, le navigateur préempte le mouvement pour
faire défiler la page et n'envoie plus un seul `pointermove`.

## Déploiement

Vercel, preset **Vite**. `vercel.json` porte déjà la réécriture SPA — sans elle
un rechargement sur `/calendrier` renverrait un 404 — et les en-têtes de cache :
`sw.js` et le manifeste jamais mis en cache, les assets empreintés pour un an.

Aucune variable d'environnement. Le service worker exige HTTPS, que Vercel
fournit d'office.

## Vérification

Chaque écran a été relu dans les deux thèmes, en téléphone, tablette et desktop.
Le contraste, les noms accessibles et les cibles tactiles sont audités par script
sur toutes les routes, dans les deux thèmes : aucun point en suspens.

Aux cinq destinations de la navigation s'ajoutent les écrans qu'on n'atteint que
par une action — `/depense`, `/depense/:id`, `/abonnements/nouveau`,
`/abonnements/:id`, `/abonnements/:id/modifier` — et `/styleguide`.
