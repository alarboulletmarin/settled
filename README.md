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

**Ouverture du mois.** Idempotente : la rejouer ne duplique aucune échéance et ne
touche aucune entrée confirmée.

**Graphiques.** Aucune librairie. L'anneau, les barres empilées et les courbes
sont des composants SVG maison, dans `src/ui/Ring.tsx` et `src/charts/`.

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

- `Category.icon` existe au modèle de données mais le DS interdit l'icône
  décorative : le champ est conservé et jamais rendu, l'identité visuelle d'une
  catégorie passe par sa pastille de couleur.
- `settings.monthStartsOn` est stocké et migrable, mais la v1 raisonne en mois
  calendaire — les `ym` du cahier sont de la forme `"2026-07"`.

La date du dernier export vit en `localStorage`, hors du document : elle décrit
l'état de sauvegarde de cet appareil, et l'inclure ferait qu'un fichier importé
prétendrait avoir été sauvegardé à l'instant.

## Vérification

Chaque écran a été relu dans les deux thèmes, en desktop et en mobile. Le
contraste, les noms accessibles et les cibles tactiles sont audités par script
sur les six routes, dans les deux thèmes : aucun point en suspens.
