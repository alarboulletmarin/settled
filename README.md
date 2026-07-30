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
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

## Repères

- `src/styles/tokens.css` — les tokens du design system, déclarés une seule fois.
- `/styleguide` — chaque token et chaque composant, dans les deux thèmes.
- `src/domain/` — logique métier pure, sans UI.
- `src/i18n/fr.ts` — toutes les chaînes. Aucun texte en dur dans un composant.
