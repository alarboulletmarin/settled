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

### 2.5 Palette membres

Les mêmes teintes, **moins le vert pomme**, et dans un autre ordre. Cinq suffisent à un foyer ; au-delà, la palette recommence.

```css
--member-1: var(--cat-3);  --member-2: var(--cat-4);  --member-3: var(--cat-5);
--member-4: var(--cat-6);  --member-5: var(--cat-2);
```

Le vert pomme est `--accent` : le signal « actif » de toute l'app, et la couleur du commun — la tuile Répartition est en accent. **Un membre ne le porte jamais.** Le premier le portait, et sa pastille se lisait comme une sélection : on croyait ne lire que ses données. Sur une pilule de filtre active, qui passe elle-même en `--accent`, elle disparaissait tout à fait.

Turquoise et ambre en tête : un foyer en compte deux le plus souvent, et ce sont les deux teintes les plus éloignées l'une de l'autre. Le violet ferme la marche, parce qu'il avoisine `--accent-2`, qui dit les sorties.

Une pastille désigne **une personne ou une catégorie**, et rien d'autre : c'est sa couleur. Une lecture qui ne désigne personne — « Tout le monde », « Commun » — n'en porte pas, et n'en emprunte pas une non plus, fût-elle l'accent : une pilule active passe elle-même en accent, et la pastille y disparaîtrait. C'est un filet qui marque la séparation (§6).

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
| Chiffre de tuile | sans | 32px | 700 | ramené à la largeur de sa tuile dans la grille, et à 26px sur une rangée simple |
| Montant de ligne | sans | 15px | 700 | |
| Montant secondaire | sans | 13px | 700 | |
| Titre de section | sans | 20px | 600 | |
| Corps | sans | 15px | 400 | `line-height: 1.5` |
| Libellé secondaire | sans | 13px | 400 | `color: var(--text-muted)` |
| Eyebrow | mono | 11px | 500 | majuscules, `tracking: 0.08em` |
| Axe de graphique | mono | 11px | 400 | `color: var(--text-muted)` |

### Chiffres

`font-variant-numeric: tabular-nums` sur **tout** montant, sans exception. Une colonne de montants qui danse à chaque mise à jour est le défaut le plus visible d'une app de finances.

**Une seule lettre pour tous les montants.** Les quatre tailles ci-dessus sont le même chiffre à quatre échelles : 700, `stretch: 112%`, `tracking: -0.03em`. Seule la taille varie. Un montant de liste et un solde héros doivent se reconnaître comme deux tailles du même chiffre — les faire diverger de graisse et de largeur donne l'impression de deux polices sur le même écran.

Le symbole monétaire se pose à 0.55em de la taille du nombre, aligné en haut, opacité 0.5. Les centimes d'un chiffre héros passent à 0.5em. Le signe n'est affiché que pour les entrées (`+`), une sortie se lit à sa couleur et à son contexte.

Une lecture qui **masque les centimes arrondit l'unité**, elle ne la tronque pas : 56,69 € s'y lit « 57 € ». Tronquer se trompe toujours dans le même sens — celui qui arrange qui lit —, et un reste à payer annoncé plus bas qu'il n'est vaut moins que rien.

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

Trois autres valeurs sont tenues partout et méritent d'être écrites, faute de quoi chaque nouvel écran les redécide : une **grille de contenu hors bento** écarte ses colonnes de **16px** ; un **titre de section** est à **20px** de son contenu, comme le titre d'écran ; l'**intérieur d'une tuile** respire à **12px**. Le cadre de page est `px-4`, `px-8` au-delà de 768px.

Ce ne sont pas des préférences mais des relations : la même relation visuelle garde la même valeur d'un écran à l'autre. Trois gouttières différentes sur une même page se voient bien avant qu'on sache les nommer.

**Mouvement** — 160ms `cubic-bezier(0.2, 0, 0, 1)` par défaut, 240ms pour l'entrée d'une vue. Les nombres s'animent en comptant uniquement au premier affichage d'un écran, jamais sur mise à jour. Tout est neutralisé sous `prefers-reduced-motion`.

Deux précisions, faute de quoi la règle se lit de deux façons et se voit comme un défaut.

**Quels nombres.** Ceux de la grille bento et le chiffre héros, pas les autres. Une part par membre et une ligne de crédit portent la même taille de chiffre qu'une tuile : quarante montants qui s'égrènent chacun pour son compte ne sont pas une arrivée, c'est un scintillement, et un chiffre qui compte pendant qu'on remplit un formulaire est du bruit posé sur un geste.

**Quel affichage.** Celui de l'**écran**, pas celui du composant. La distinction n'est pas théorique : une tuile apparaît et disparaît pour des raisons qui n'ont rien d'une arrivée — un filtre qui en retire cinq, une lecture qui n'a de sens que sur le mois courant, une tuile qui devient cliquable. Attaché au composant, le comptage repart sur les tuiles remontées pendant que leurs voisines, restées en place, changent de valeur en silence : sur un même geste, le solde s'égrène et les charges sautent. Ce qui apparaît après l'arrivée de l'écran ne compte pas.

---

## 5. Grille bento

Le dashboard est une grille de tuiles de tailles inégales, pas une pile de cartes identiques.

```
mobile (2 col)      tablette (4 col)         desktop (6 col)
┌───────────┐       ┌───────┬───┬───┐        ┌───────┬───┬───────┐
│  solde    │       │ solde │éch│jrs│        │ solde │ € │ répart│
│  2×2      │       │  2×2  ├───┴───┤        │  2×2  ├───┤  2×2  │
├─────┬─────┤       │       │ abos  │        │       │ % │       │
│  €  │  %  │       ├───────┴───────┤        ├───┬───┴───┼───────┤
├─────┴─────┤       │  répartition  │        │éch│ jours │ abos  │
│ répartition│      └───────────────┘        │2×1│  2×1  │ 2×1   │
└───────────┘                                └───┴───────┴───────┘
```

Formats autorisés : `2×1`, `2×2`, `4×1`, `4×2`, `6×2`. Rien d'autre, sinon la grille se délite.

Trois paliers, et **un format ne change jamais de nom en changeant de palier** — c'est la correspondance format → colonnes qui change, pas la liste. Le palier tablette existe parce que deux colonnes étirées sur les 704px d'un iPad portrait ne sont pas une grille : c'est la mise en page d'un téléphone à trois fois la largeur, donc trois fois le vide. Et six colonnes n'y tiennent pas encore (§ ci-dessous).

| Format | < 768px (2 col) | 768 – 1024px (4 col) | ≥ 1024px (6 col) |
|---|---|---|---|
| `2×1` | demi-colonne | quart | tiers |
| `2×2` | pleine largeur | moitié | tiers |
| `4×1`, `4×2` | pleine largeur | moitié | deux tiers |
| `6×2` | pleine largeur | pleine largeur | pleine largeur |
| Rangée | 88px | 96px | 108px |

La `2×2` est la seule à ne pas se diviser par deux sur le palier tablette : elle porte le chiffre héros et son anneau, et un quart de 704px ne lui laisse que 133px de contenu, où le chiffre passe sous son plancher.

**Une tuile peut prendre plus large que son format sur une bande donnée**, et c'est une exception qui se justifie tuile par tuile : Revenus et Charges sont des `2×1` qui prennent deux colonnes sous 1024px. C'est le seul moyen que leur seconde lecture — « reste 102 € à payer » — s'affiche sur un téléphone, et elles n'ont pas de feuille d'explication pour la porter (§6). Elle coûte deux rangées de défilement, pour les deux chiffres qu'on vient chercher en premier.

Une tuile porte au maximum : un eyebrow, un chiffre, une lecture secondaire, une visualisation. Si elle en demande un cinquième, c'est deux tuiles.

Ce maximum n'est pas un dû : une tuile d'une seule rangée fait 88px, dont 56 utiles, et l'eyebrow avec un chiffre de 32px en demandent 57 à eux deux. Les formats `2×1` et `4×1` resserrent donc leur cadre à 16px et ramènent leur chiffre à 26px — une demi-tuile porte un demi-chiffre. Un contenu qui déborde quand même se coupe **par le bas** : une liste ancrée au centre remonte sur son eyebrow, ce qui est le seul débordement qui se voie vraiment.

La largeur a son plafond, et c'est lui qui choisit entre `2×1` et `4×1`. La `2×1` reste en demi-colonne sur mobile, seule de tous les formats : elle n'offre que **~104px de contenu à 320px**. L'eyebrow y tient sur une ligne quoi qu'il arrive (§6), donc passé sa dégradation il déborde et se fait trancher. Mesuré : le plafond est de **13 caractères** — « Prévisionnel » (12) et « Reste à vivre » (13) tiennent, « Capacité d'épargne » (18) non, elle déborde de 35px. **Au-delà de 13 caractères, le format est `4×1`.** Un débordement de largeur ne se voit pas « par le bas » : il coupe le libellé au milieu d'un mot, et c'est le pire des deux.

---

## 6. Composants

**Tile** — `background: var(--surface)`, `border-radius: var(--r-tile)`, bordure 1px en thème sombre, ombre en thème clair. Variante `accent` : fond lime, texte encre. Variante `accent-2` : fond violet, texte blanc. Une seule tuile accentuée par écran.

**Repère d'action d'une tuile** — une tuile cliquable dit au coin ce que le clic fait, parce que rien d'autre ne le dit : le survol qui la soulève d'un pixel n'existe pas au doigt, et douze tuiles identiques à l'œil peuvent cacher trois gestes différents. Mono 11px et glyphe 14px, en `--text-muted`, `aria-hidden` — le nom accessible de la tuile porte déjà le sens.

| Ce que fait le clic | Repère |
|---|---|
| Mène à un autre écran | nom de l'écran + chevron `›` — `ÉPARGNE ›`. Sans le nom quand l'eyebrow le dit déjà : `RÉPARTITION … ›` |
| Ouvre une feuille sur place | glyphe d'information seul. Pas de nom : il n'y a pas de destination |
| Fait défiler vers une section de la page | nom de la section + flèche vers le bas — `CE MOIS ⌄`. Elle descend, elle ne pointe pas de côté |
| Rien | **aucun repère.** C'est cette règle-là qui rend les trois autres lisibles |

Le repère vit en haut à droite, hors du flux — les tuiles ne s'accordent pas sur ce qu'elles posent en tête, et un repère dans le flux les décalerait chacune différemment. Sur une **2×1 étroite** il descend au coin bas : « PRÉVISIONNEL » consomme à lui seul les cent pixels utiles, et la lecture secondaire y est masquée, donc c'est le bas qui est libre. Dès que la tuile est assez large pour porter cette lecture, l'inverse est vrai et le repère remonte.

**C'est la largeur de la tuile qui arbitre, jamais celle de l'écran.** Le seuil est le même que celui de la lecture secondaire — 180px de boîte de contenu, en requête de conteneur — et il doit l'être : sur une tuile plate, les deux se partagent la ligne du bas, et deux seuils différents leur donneraient une bande de largeurs où ils se chevauchent. Un seuil de viewport ne peut pas le dire depuis qu'un même format ne fait plus la même largeur sur les trois paliers (§5).

Une tuile dont le **contenu est une liste à lire** garde un vrai lien plutôt que de devenir une cible d'un bloc : l'envelopper dans un bouton effacerait ses lignes derrière un nom unique pour un lecteur d'écran. Le lien prend alors la typographie et le glyphe du repère, au même coin.

Un état **pressé** sur toute tuile actionnable, et pas seulement un survol : la moitié des écrans n'a pas de curseur.

**Eyebrow** — mono 11px majuscules dans une pilule `--surface-2`, ancrée en haut à gauche de la tuile. C'est ce qui donne le rythme de la référence : la tuile n'a pas de titre, elle a une étiquette. Elle accepte un repère (§9) à sa gauche, 13px. L'étiquette tient toujours sur une ligne, et se dégrade en trois paliers : elle resserre d'abord ses marges et son interlettrage, abandonne le repère ensuite, rend enfin ce qui lui reste d'interlettrage — c'est le libellé qui porte le sens, on le sacrifie en dernier et jamais. Puis elle n'a plus rien à lâcher : au bout de ces trois paliers, une `2×1` accepte **13 caractères** et pas un de plus (§5). Ce n'est donc pas à l'eyebrow de s'adapter indéfiniment au format, c'est au format d'être choisi pour le libellé.

**Field** — libellé, contrôle, aide ou erreur. Le libellé porte la mention `· obligatoire` ou `· facultatif`, dans la même graisse atténuée. Elle vit dans le `<label>`, donc dans le nom accessible du contrôle : aucun `aria-required` à poser en plus. On la met sur les formulaires qui créent ou modifient une entité, pas sur les rangées d'ajout à un seul champ — un bouton désactivé tant que le champ est vide y dit déjà tout.

**Écrans de saisie** — un formulaire ou une fiche est un écran plein avec son URL, jamais une feuille modale : chevron de retour et titre en haut, le formulaire dans une tuile, les actions dessous dans le flux. Rien à faire glisser, rien à refermer pour revenir. La règle vise la **saisie**, pas la confirmation : une question fermée qui n'attend que oui ou non est exactement ce pour quoi un `<dialog>` existe.

**ConfirmDialog** — la confirmation d'un geste destructif, la même partout, sur la feuille modale et donc sur `<dialog>` natif : piège de focus, Échap, clic sur le fond et retour du focus au bouton d'origine viennent du navigateur. Le pied de feuille pose ses deux boutons à largeur égale — `Annuler` en `secondary`, l'action en `danger`. Le nombre de questions fait la gravité : une pour une ligne, deux pour un import qui remplace tout, trois pour l'effacement des données, avec un compteur `n / N` dès qu'il y en a plus d'une. Chaque question dit **ce qui est perdu** et porte le verbe de l'action sur son bouton, jamais « êtes-vous sûr » suivi d'un « OK ». Une seule boîte par écran, qui sait sur quoi elle porte : une par ligne d'une liste en monterait autant dans le DOM.

**Amount** — composant unique pour tout montant. Props : valeur en centimes, taille, sens. Gère seul le tabular-nums, le symbole, les centimes réduits et la couleur.

**Checkbox** — un attribut vrai ou faux, pas un choix entre deux modes : `Segmented` sert à choisir parmi des positions qui s'excluent, la case dit qu'une chose est vraie ou ne l'est pas. Carré de 24px dans une cible de 44px, coché en `--accent` sur texte encre — lime reste un remplissage. La case native reste dans le DOM, masquée : c'est elle qui porte l'état pour un lecteur d'écran et qui répond à la barre d'espace. Elle peut être **verrouillée** — cochée, non modifiable, et alors toujours accompagnée d'un `hint` qui dit pourquoi : une case bloquée sans raison se lit comme une panne. Elle garde sa couleur de texte pleine, contrairement aux boutons désactivés : elle n'est pas hors service, elle informe, et atténuer sous le plancher AA du §8 ce qu'on met là pour être lu reviendrait à le cacher. Elle reste affichée plutôt que de disparaître quand elle informe de ce qui va se passer ; elle se retire quand la question ne se pose pas.

**Disclosure** — section repliable, sur `<details>` natif : il porte déjà l'état pour un lecteur d'écran, répond au clavier, et la recherche dans la page sait ouvrir ce qui est replié. En-tête de 44px, chevron qui pivote, et une lecture de droite — total ou compte — qui reste visible replié : une section qu'il faut ouvrir pour savoir si elle vaut la peine ne fait pas gagner de défilement. Une liste longue s'accompagne d'un « tout replier ».

**Chip** — pilule pour catégories, membres et filtres. Pastille de couleur 8px + libellé 13px, sur une ligne — un libellé coupé en deux dans une pilule de 44px la déforme, c'est à la rangée de s'adapter. État actif : fond `--surface-2` → `--accent`.

**Rangée de filtres** — une ligne qui **défile**, jamais qui passe à la ligne. Elle vit dans le bandeau collant du mois, où une seconde ligne coûte 52px de haut d'écran à chaque défilement et fait dépendre la hauteur du bandeau du nombre de membres. À 320px, « Tout le monde » et « Commun » consomment déjà 205 des 288px utiles : aucune mise en page ne les fait tenir avec les prénoms.

| Règle | Pourquoi |
|---|---|
| Piste à bord perdu — le cadre de la page est annulé, puis reposé sur la piste | Sans quoi la première et la dernière pilule sont rognées à mi-hauteur, et la rangée s'arrête avant le bord de l'écran |
| 4px de cadre vertical, repris par une marge négative | L'anneau de focus déborde de 4px hors du bouton (§8), et un `overflow` le rognerait. C'est exactement l'objection qui fait passer `Segmented` à la ligne — mais une bascule vit dans une tuile, dont la largeur *est* le cadre |
| `scroll-padding-inline: 16px` | Une pilule qui prend le focus au clavier ne se colle pas au bord |
| Accroche `proximity`, jamais `mandatory` | La pilule coupée en fin de piste **est** l'affordance de défilement ; `mandatory` la supprimerait |
| Pas de dégradé de bord | Il éteindrait l'anneau de focus de cette même pilule |
| Pas de `touch-action` | Un défileur natif arbitre seul l'axe dominant : un glissement vertical parti des pilules fait défiler la page, et `MonthNav` garde son balayage horizontal juste au-dessus |

Les pilules qui ne désignent personne n'ont pas de pastille (§2.5), et un filet d'un pixel les sépare des personnes : sans lui, l'absence se lit comme un oubli. Le filet est en `--text-muted` atténué et non en `--border`, calibré pour une bordure sur une surface et invisible sur le fond de page.

**ListRow** — pastille de catégorie, libellé, sous-libellé mono (date ou périodicité), montant à droite. Hauteur 56px. Un `planned` s'affiche à 60% d'opacité avec un contour en pointillés sur la pastille.

**Bouton de saisie flottant** — un disque de 56px en lime, au coin bas-droit, au-dessus de la barre d'onglets et sous les surcouches. Il n'existe que sous 1024px : au-delà, la rangée de boutons en tête de l'écran du mois est à l'écran et ne défile jamais hors de vue. Une porte par largeur et pas deux — les mêmes trois boutons deux fois sur un écran ne font pas deux occasions.

Il **se déplie** sur les trois portes de saisie, dans l'ordre de l'écran du mois, plutôt que d'en promettre une seule : « les deux sens sont deux boutons, jamais un seul » (§7) vaut aussi pour lui, et un `+` flottant qui ouvrirait toujours une dépense rétablirait exactement ce que cette règle corrige. Le glyphe pivote de 45° au lieu d'être remplacé par une croix — c'est le même bouton ; le nom accessible, lui, change, parce qu'il dit ce que le prochain appui fait. Il se referme sur Échap, sur un appui à côté, et à tout changement d'écran.

Rien sur un écran de saisie : il partirait créer une ligne par-dessus celle qu'on écrit, en contournant la garde de brouillon qui ne surveille que les deux boutons de sortie. C'est mot pour mot la garde du raccourci « n », dont il est la version au doigt.

**MonthNav** — chevrons de part et d'autre du mois courant, mois en sans 20px, année en mono 11px dessous. Balayage horizontal sur mobile.

Un **retour au mois courant** l'accompagne dans le bandeau, à sa droite, et n'apparaît que lorsqu'on n'y est pas — c'est la règle des repères d'action appliquée à un bouton : celui qui ne bouge rien apprend à ignorer ceux qui bougent quelque chose. Douze chevrons pour revenir de février à août n'est pas une navigation, c'est une pénalité. Il dit « ce mois-ci » et non « aujourd'hui » : on revient à un mois, pas à un jour, et sur le calendrier le second aurait promis de ramener au jour. Le mois d'arrivée se nomme en infobulle, jamais dans le libellé — le nom accessible d'un bouton contient son texte visible.

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
