# Captures

Les images du `README.md`. Toutes prises sur le **jeu d'exemple** — jamais sur
un vrai foyer, pour la raison évidente.

| Fichier | Écran | Thème | Viewport |
|---|---|---|---|
| `mois-sombre.png` | Le mois | sombre | 1280 × 820 @2x |
| `mois-clair.png` | Le mois | clair | 1280 × 820 @2x |
| `mois-mobile.png` | Le mois | sombre | 390 × 844 @2x |

## Les refaire

Elles vieillissent avec l'interface : à reprendre dès qu'un écran change
visiblement.

```sh
npm run build && npm run preview
```

Puis, dans le navigateur, sur `http://localhost:4173/bienvenue` :

1. **Charger l'exemple** — le jeu se construit à la date du jour, donc les
   chiffres ne seront pas ceux d'ici, et c'est normal.
2. Poser `tout-compte-fait.lastExport` à la date du jour dans le `localStorage` :
   sans ça, le rappel d'export couvre le haut de l'écran.
3. Capturer aux tailles du tableau ci-dessus, en densité 2×.

Le nombre du mois est le même dans les trois captures : c'est volontaire, elles
montrent le même foyer au même instant.
