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
