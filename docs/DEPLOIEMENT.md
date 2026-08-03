# Déploiement

L'app est un site statique : n'importe quel hébergeur de fichiers sait la
servir, à deux conditions près — une réécriture SPA et du HTTPS.

## Vercel

L'hébergement de référence, preset **Vite**. `vercel.json` porte déjà tout :

- la **réécriture SPA** — sans elle, un rechargement sur `/calendrier`
  renverrait un 404, parce qu'aucun fichier ne porte ce nom ;
- les **en-têtes de cache** — `sw.js` et le manifeste jamais mis en cache, les
  assets empreintés pour un an.

Aucune variable d'environnement. Le service worker exige HTTPS, que Vercel
fournit d'office.

## Ailleurs

Le build sort dans `dist/`. Pour l'héberger autre part :

```sh
npm ci
npm run build
```

Puis servir `dist/` avec deux règles à reporter depuis `vercel.json` :

1. toute URL qui ne correspond à aucun fichier renvoie `index.html` (Netlify :
   un `_redirects` avec `/* /index.html 200` ; Nginx : `try_files $uri
   /index.html` ; GitHub Pages : dupliquer `index.html` en `404.html`) ;
2. `sw.js` et `manifest.webmanifest` servis en `max-age=0, must-revalidate` —
   les mettre en cache fige les utilisateurs sur une version périmée, et le
   prompt de mise à jour ne remonterait jamais.

HTTPS est obligatoire : sans lui, pas de service worker, donc pas de mode hors
ligne ni d'installation sur l'écran d'accueil. `localhost` est la seule
exception, ce qui suffit au développement.

## Ce qui est servi à la racine

Trois choses sortent de `public/` et ne sont pas du code :

- **`robots.txt`** — tout est ouvert à l'indexation. Il existe pour que la
  réponse soit un 200 et non la coquille de l'app : le rewrite épargne déjà tout
  chemin contenant un point, et le service worker ne lui sert pas `index.html`
  (`navigateFallbackDenylist`).
- **`captures/`** — les images du `README`, qui servent aussi les `screenshots`
  du manifest et l'`og:image` du partage. Un seul exemplaire, et il est ici :
  seul ce qui est sous `public/` est servi à la racine. Voir
  [CAPTURES.md](CAPTURES.md).
- les **icônes** et `favicon.svg`, déclarées dans le manifest.

Les captures sont **hors du precache** (`globIgnores`) : 400 Ko d'images que
l'app n'affiche jamais n'ont rien à faire dans le cache hors ligne. Elles
tombent donc sous le cache par défaut de l'hébergeur, ce qui convient — une
capture refaite garde son nom, et doit se rafraîchir.

## Essayer le service worker en développement

Il ne s'enregistre pas sous `npm run dev` : il resservirait du code figé à
chaque rechargement, ce qui est le contraire de ce qu'on attend d'un serveur de
développement. Pour la session où c'est lui qu'on regarde :

```sh
PWA_DEV=1 npm run dev
```

Le reste — bandeau d'installation, `screenshots`, raccourcis du manifest — se
vérifie sur un vrai build, l'onglet Application des outils de développement
ouvert :

```sh
npm run build && npm run preview
```

## Vérification avant mise en ligne

`npm run verify` enchaîne typecheck, lint, tests et build — c'est la porte de
sortie, et c'est exactement ce que joue l'intégration continue sur chaque push.

Au-delà du script, chaque écran a été relu dans les deux thèmes, en téléphone,
tablette et desktop. Le contraste, les noms accessibles et les cibles tactiles
sont audités sur toutes les routes, dans les deux thèmes : aucun point en
suspens.

Aux cinq destinations de la navigation s'ajoutent les écrans qu'on n'atteint que
par une action — `/depense`, `/depense/:id`, `/recurrences/nouveau`,
`/recurrences/:id`, `/recurrences/:id/modifier`, `/credits`, `/credits/nouveau`,
`/credits/:id`, `/repartition` —, les trois écrans qui parlent de l'app plutôt
que du foyer — `/bienvenue`, `/demarrer`, `/a-propos` — et `/styleguide`.

`/credits` et `/repartition` ne figurent pas dans la navigation : six onglets ne
tiennent pas à 320px sans tronquer « Récurrences » en « Récurren… ». On y accède
par la tuile correspondante de l'écran du mois, comme on accède aux récurrences
par la sienne. Chacune s'efface quand elle n'a rien à dire — aucun crédit suivi,
ou pas de quoi calculer un prorata.
