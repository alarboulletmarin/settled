# Design system

Direction visuelle de l'app de finances. Dérivée de la référence « Finance App Widgets », déclinée en thème clair et sombre.

---

## 1. Intention

Une app de finances qui ressemble à un tableau de bord, pas à un relevé bancaire. Trois partis pris :

- **Le chiffre est l'image.** Pas d'illustration, pas d'icône décorative. Les grands nombres portent la page. L'icône n'est admise que comme outil : agir, ou se repérer (§9).
- **La couleur est un remplissage, jamais une encre.** Lime et violet ne servent qu'à peindre des surfaces. Ça permet aux tuiles accentuées d'être strictement identiques dans les deux thèmes.
- **Le vert sapin est la marque.** C'est lui qui distingue l'app d'un énième dashboard noir à accent fluo.

**Signature** — l'anneau du mois. Un arc qui revient partout : progression dans le mois, part confirmée du prévisionnel, répartition par catégorie. Un seul motif géométrique, décliné.

---

## 2. Couleur

### 2.1 Palette de base

Ces valeurs ne changent jamais. Elles ne sont pas utilisées directement dans les composants.

```css
:root {
  /* Sapin — la couleur d'identité */
  --pine-900: #0E1F1A;
  --pine-700: #1B3B31;
  --pine-500: #2F5D4C;
  --pine-100: #DCE9E2;
  --pine-50:  #F0F5F2;

  /* Accents — remplissage uniquement */
  --lime-500:   #D8F84E;
  --lime-600:   #C2E432;
  --violet-500: #8478F2;
  --violet-600: #6E60E8;

  /* Neutres */
  --ink-950: #0B0E0D;
  --ink-800: #161A19;
  --ink-400: #7C8783;
  --paper:   #FAFAF7;

  /* Alerte — réservée aux dépassements et erreurs */
  --alert-500: #E5484D;
}
```

### 2.2 Tokens sémantiques

C'est la seule couche que les composants consomment.

```css
[data-theme='light'] {
  --bg:          var(--pine-50);
  --surface:     #FFFFFF;
  --surface-2:   var(--pine-100);
  --border:      rgb(11 14 13 / 0.08);
  --text:        var(--ink-950);
  --text-muted:  var(--ink-400);
  --shadow:      0 1px 2px rgb(11 14 13 / 0.04), 0 8px 24px rgb(11 14 13 / 0.06);
}

[data-theme='dark'] {
  --bg:          var(--pine-500);
  --surface:     var(--ink-950);
  --surface-2:   var(--ink-800);
  --border:      rgb(255 255 255 / 0.08);
  --text:        var(--pine-50);
  --text-muted:  #8FA09A;
  --shadow:      none;
}

/* Identiques dans les deux thèmes — c'est volontaire */
:root {
  --accent:      var(--lime-500);
  --accent-fg:   var(--ink-950);
  --accent-2:    var(--violet-500);
  --accent-2-fg: #FFFFFF;
}
```

### 2.3 Règles

| Règle | Pourquoi |
|---|---|
| Lime et violet ne sont jamais une `color`, uniquement un `background` | Contraste insuffisant en texte sur les deux fonds |
| Texte encre sur lime, texte blanc sur violet | Ces deux paires passent AA dans les deux thèmes, donc les chips ne changent pas |
| Entrées = lime, sorties = violet | Évite le rouge/vert, illisible pour un daltonien et anxiogène sur du quotidien |
| Rouge réservé aux dépassements et erreurs | S'il est partout, il ne signale plus rien |
| En thème sombre, pas d'ombre : la hiérarchie passe par la bordure | Les ombres ne se voient pas sur du sapin |

### 2.4 Palette catégories

Six teintes, dans cet ordre, pour les donuts et les barres empilées. Au-delà de six catégories, les suivantes basculent en gris et sont regroupées sous « Autres ».

```css
--cat-1: #D8F84E;  --cat-2: #8478F2;  --cat-3: #4FC3A1;
--cat-4: #F5B575;  --cat-5: #F09BB5;  --cat-6: #7FB8E8;
```

---

## 3. Typographie

**Archivo** (variable, largeur + graisse) pour tout ce qui se lit.
**Geist Mono** pour les libellés utilitaires, les axes de graphique et les dates.

Deux familles, pas trois. La largeur variable d'Archivo remplace un troisième fichier : les grands nombres sont posés en `font-stretch: 112%`, ce qui leur donne la présence de la référence sans changer de fonte.

```css
--font-sans: 'Archivo Variable', system-ui, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, monospace;
```

### Échelle

| Rôle | Fonte | Taille | Graisse | Détails |
|---|---|---|---|---|
| Chiffre héros | sans | 56 / 72px | 700 | `stretch: 112%`, `tracking: -0.03em` |
| Chiffre de tuile | sans | 32px | 650 | `tracking: -0.02em` |
| Titre de section | sans | 20px | 600 | |
| Corps | sans | 15px | 400 | `line-height: 1.5` |
| Libellé secondaire | sans | 13px | 400 | `color: var(--text-muted)` |
| Eyebrow | mono | 11px | 500 | majuscules, `tracking: 0.08em` |
| Axe de graphique | mono | 11px | 400 | `color: var(--text-muted)` |

### Chiffres

`font-variant-numeric: tabular-nums` sur **tout** montant, sans exception. Une colonne de montants qui danse à chaque mise à jour est le défaut le plus visible d'une app de finances.

Le symbole monétaire se pose à 0.55em de la taille du nombre, aligné en haut, opacité 0.5. Les centimes d'un chiffre héros passent à 0.5em. Le signe n'est affiché que pour les entrées (`+`), une sortie se lit à sa couleur et à son contexte.

---

## 4. Espacement, formes, mouvement

Base 4px. Échelle : `4 8 12 16 20 24 32 40 56 72`.

```css
--r-tile:  24px;   /* tuiles du dashboard */
--r-inner: 14px;   /* éléments dans une tuile */
--r-input: 12px;
--r-chip:  999px;
```

Padding intérieur d'une tuile : 20px en mobile, 24px au-delà. Gouttière de grille : 12px en mobile, 16px au-delà.

**Mouvement** — 160ms `cubic-bezier(0.2, 0, 0, 1)` par défaut, 240ms pour l'entrée d'une vue. Les nombres s'animent en comptant uniquement au premier affichage d'un écran, jamais sur mise à jour. Tout est neutralisé sous `prefers-reduced-motion`.

---

## 5. Grille bento

Le dashboard est une grille de tuiles de tailles inégales, pas une pile de cartes identiques.

```
mobile (2 col)          desktop (6 col)
┌───────────┐           ┌───────┬───┬───────┐
│  solde    │           │ solde │ € │ répart│
│  2×2      │           │  2×2  ├───┤  2×2  │
├─────┬─────┤           │       │ % │       │
│  €  │  %  │           ├───┬───┴───┼───────┤
├─────┴─────┤           │éch│ jours │ abos  │
│ répartition│          │2×1│  2×1  │ 2×1   │
└───────────┘           └───┴───────┴───────┘
```

Formats autorisés : `2×1`, `2×2`, `4×1`, `4×2`, `6×2`. Rien d'autre, sinon la grille se délite.

Une tuile porte au maximum : un eyebrow, un chiffre, une lecture secondaire, une visualisation. Si elle en demande un cinquième, c'est deux tuiles.

---

## 6. Composants

**Tile** — `background: var(--surface)`, `border-radius: var(--r-tile)`, bordure 1px en thème sombre, ombre en thème clair. Variante `accent` : fond lime, texte encre. Variante `accent-2` : fond violet, texte blanc. Une seule tuile accentuée par écran.

**Eyebrow** — mono 11px majuscules dans une pilule `--surface-2`, ancrée en haut à gauche de la tuile. C'est ce qui donne le rythme de la référence : la tuile n'a pas de titre, elle a une étiquette. Elle accepte un repère (§9) à sa gauche, 13px. L'étiquette tient toujours sur une ligne : sur une tuile trop étroite elle resserre d'abord ses marges et son interlettrage, et n'abandonne le repère qu'ensuite — c'est le libellé qui porte le sens.

**Field** — libellé, contrôle, aide ou erreur. Le libellé porte la mention `· obligatoire` ou `· facultatif`, dans la même graisse atténuée. Elle vit dans le `<label>`, donc dans le nom accessible du contrôle : aucun `aria-required` à poser en plus. On la met sur les formulaires qui créent ou modifient une entité, pas sur les rangées d'ajout à un seul champ — un bouton désactivé tant que le champ est vide y dit déjà tout.

**Écrans de saisie** — un formulaire ou une fiche est un écran plein avec son URL, jamais une feuille modale : chevron de retour et titre en haut, le formulaire dans une tuile, les actions dessous dans le flux. Rien à faire glisser, rien à refermer pour revenir.

**Amount** — composant unique pour tout montant. Props : valeur en centimes, taille, sens. Gère seul le tabular-nums, le symbole, les centimes réduits et la couleur.

**Checkbox** — un attribut vrai ou faux, pas un choix entre deux modes : `Segmented` sert à choisir parmi des positions qui s'excluent, la case dit qu'une chose est vraie ou ne l'est pas. Carré de 24px dans une cible de 44px, coché en `--accent` sur texte encre — lime reste un remplissage. La case native reste dans le DOM, masquée : c'est elle qui porte l'état pour un lecteur d'écran et qui répond à la barre d'espace.

**Disclosure** — section repliable, sur `<details>` natif : il porte déjà l'état pour un lecteur d'écran, répond au clavier, et la recherche dans la page sait ouvrir ce qui est replié. En-tête de 44px, chevron qui pivote, et une lecture de droite — total ou compte — qui reste visible replié : une section qu'il faut ouvrir pour savoir si elle vaut la peine ne fait pas gagner de défilement. Une liste longue s'accompagne d'un « tout replier ».

**Chip** — pilule pour catégories, membres et filtres. Pastille de couleur 8px + libellé 13px. État actif : fond `--surface-2` → `--accent`.

**ListRow** — pastille de catégorie, libellé, sous-libellé mono (date ou périodicité), montant à droite. Hauteur 56px. Un `planned` s'affiche à 60% d'opacité avec un contour en pointillés sur la pastille.

**MonthNav** — chevrons de part et d'autre du mois courant, mois en sans 20px, année en mono 11px dessous. Balayage horizontal sur mobile.

**Ring** — l'anneau. Épaisseur 12px, extrémités arrondies, départ à midi, sens horaire, fond de piste en `--surface-2`. Sert de progression du mois, de jauge et de donut de répartition. Le contenu central est un `Amount`.

**Toast** — trois au plus à l'écran, et un message qui se répète porte son compte (« Échéance confirmée · 10 ») au lieu de se dupliquer. Une pile qui recouvre l'écran ne dit plus rien de ce qui vient de se passer, et cache ce sur quoi on est en train d'agir. Le compte à rebours repart à chaque répétition.

**EmptyState** — un anneau vide, une phrase qui dit quoi faire, un bouton. Jamais d'illustration, jamais d'excuse.

---

## 7. Conventions d'écriture

Français, phrases en casse normale, pas de majuscule décorative sur les boutons.

Le nom d'une action ne change pas dans le flux : le bouton dit « Confirmer le mois », le toast dit « Mois confirmé ». Les libellés parlent de ce que l'utilisateur manipule — « abonnement », « échéance », « mois » — jamais de récurrence, d'entrée ou de schéma.

Une erreur dit ce qui s'est passé et quoi faire, sans s'excuser. Un écran vide est une invitation, pas un constat : « Aucun abonnement pour l'instant. Ajoute le premier. »

---

## 8. Plancher de qualité

Contraste AA sur tout texte. Focus clavier visible sur tout élément interactif, anneau 2px `--accent-2` avec 2px de décalage. Cible tactile minimale 44px. Chaque graphique est doublé d'une lecture accessible aux lecteurs d'écran. Les deux thèmes sont testés sur chaque écran avant de considérer l'écran terminé.

---

## 9. Icônes

Phosphor, graisse `bold` — celle qui retombe sur le trait de 2px du reste du système. Jamais `fill` : le glyphe est un trait, pas une tache.

Un seul point d'entrée, `ui/Icons.tsx`, qui réexporte sous des noms à nous. Aucun composant n'importe Phosphor directement : changer de bibliothèque ne doit toucher qu'un fichier. Import par chemin (`@phosphor-icons/react/dist/csr/<Nom>`) et non depuis l'index, dont le barrel de neuf mille icônes ralentit le démarrage en dev.

### 9.1 Deux emplois, et pas un de plus

| Emploi | Où | Taille |
|---|---|---|
| **Action** | Sur un contrôle qui fait quelque chose : chevron, plus, croix, coche | 16–20px |
| **Repère** | Sur un onglet, une tuile, une section — pour la retrouver à l'œil sans relire son libellé | 13px dans un eyebrow, 18px en navigation |

Rien en dehors. Une icône qui n'aide ni à agir ni à se repérer décore, et §1 ne veut pas de décor. En particulier : jamais d'icône sur une ligne de liste — la pastille de catégorie y tient déjà ce rôle, et deux marqueurs côte à côte n'en font plus aucun.

### 9.2 Règles

| Règle | Pourquoi |
|---|---|
| `aria-hidden` systématique | Le libellé adjacent porte déjà le sens ; annoncer le glyphe le dirait deux fois |
| Un glyphe par destination, déclaré une seule fois (`app/routes.ts`) | La barre d'onglets et la colonne latérale ne peuvent pas diverger |
| L'onglet actif est une pilule `--accent` derrière le glyphe | Lime reste un remplissage, jamais une `color` (§2.3) |
| Le même concept garde le même glyphe partout | « Abonnements » est le même cycle en navigation, en tuile et en total |
