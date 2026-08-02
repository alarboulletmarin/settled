# Architecture

Comment le code est rangé, et pourquoi il l'est comme ça. Ce document explique
les décisions ; le [cahier des charges](CAHIER-DES-CHARGES.md) dit ce que l'app
doit faire, et le [design system](DESIGN-SYSTEM.md) de quoi elle a l'air.

## Repères

- `src/styles/tokens.css` — les tokens du design system, déclarés une seule fois,
  en quatre couches : palette de base, tokens sémantiques, couche dérivée,
  exposition à Tailwind. Un composant qui écrit `var(--pine-500)` est un bug.
- `/styleguide` — chaque token, chaque échelle typographique et chaque composant,
  dans les deux thèmes. Livrable permanent, maintenu à jour.
- `src/domain/` — logique métier pure, sans UI, entièrement testée.
- `src/store/` — état zustand. Un composant lit un sélecteur et appelle une
  action, rien de plus.
- `src/persistence/writer.ts` — le regroupement des écritures. Il ne connaît pas
  IndexedDB : on lui donne une fonction d'écriture, il décide quand l'appeler et
  rapporte ce qu'elle a fait.
- `src/persistence/tabs.ts` — ce que les onglets se disent, et rien d'autre.
- `src/i18n/fr.ts` — toutes les chaînes. Aucun texte en dur dans un composant.
- `src/persistence/schemaDoc.ts` — le modèle de données à donner à un assistant,
  et `src/persistence/example.ts` — le foyer d'exemple. Tous deux dérivés du
  code, tous deux chargés à la demande.
- `src/app/meta.ts` — le dépôt, la licence et la version. La version est lue sur
  `package.json` à la construction (`define` dans `vite.config.ts`) : la recopier
  dans le source en ferait une seconde vérité, fausse au premier `npm version`.
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

**Taux.** En points de base entiers — 450 = 4,50 %. Aucun flottant ne touche un
calcul financier, pas plus un taux qu'un montant.

**La présentation avant la question.** L'écran d'arrivée était « Comment
s'appelle ton foyer ? » : on demandait de répondre avant d'avoir dit ce que
l'app suit ni où vont les données. `/bienvenue` passe devant, et elle est
construite avec les tuiles, l'anneau et les chiffres de l'app plutôt qu'avec des
visuels — le DS §1 interdit l'illustration, et une grille qui *est* le produit
démontre mieux qu'une capture. Elle vit au-dessus du gate, donc à une URL stable
joignable dans les deux états ; ce qu'elle propose, lui, en dépend — les portes
qui remplacent des données ne s'affichent que devant quelqu'un qui n'en a pas.

Corollaire du même déplacement : `resetAll()` retombe sur elle. Le formulaire
s'affichait jusqu'ici à l'URL de l'écran d'où l'on venait, `/reglages` comprise.

**Rien ne s'écrit avant que le foyer existe.** `mutate` ne programme d'écriture
qu'une fois le statut passé à `ready`. Sans cette garde, répondre à la première
question puis fermer l'onglet laissait un document enregistré : au lancement
suivant l'app s'ouvrait « prête » sur un foyer sans membre, et les deux
questions ne revenaient jamais. C'est `finishOnboarding` qui programme la
première écriture — il le faisait déjà explicitement, et cet appel n'avait de
sens que si rien n'avait été écrit avant lui.

**Les écritures sont sérialisées.** Le writer chaîne sa file au lieu de
l'écraser. Deux `put` partis de deux transactions ouvertes en parallèle sur la
même clé commettent dans l'ordre que le moteur décide, pas dans celui où on les
a émis : la dernière saisie pouvait donc se faire recouvrir par l'avant-dernière.
Le chaînage rend l'ordre d'écriture égal à l'ordre de frappe, et c'est aussi ce
qui permet à `flush()` d'attendre la file entière plutôt que sa dernière entrée.

**Une écriture ratée se voit, et `flush()` ne rejette jamais.** Le writer
rapporte par un hook au lieu de lever. Une chaîne rejetée empoisonnerait tous
les `.then` suivants — une panne passagère deviendrait définitive — et ferait
rejeter `flush()` dans un gestionnaire `pagehide`, où personne n'est là pour
rattraper. Le store route l'échec vers un bandeau persistant qui ne s'écarte
pas : la condition est en cours, et un bandeau qu'on chasse laisserait quelqu'un
continuer à saisir dans une app qui n'enregistre plus.

L'erreur porte un `kind`, `read` ou `write`, et c'est lui qui permet à une
écriture réussie d'effacer le bandeau d'écriture sans effacer un échec de
lecture : rien de ce qu'on écrit ne rend lisible ce qui ne l'était pas. Les deux
n'ont d'ailleurs ni la même issue ni le même écran — l'un se règle par un export
depuis la coquille, l'autre par un import depuis l'arrivée.

**Un document illisible n'est pas un document absent.** `hydrate` bascule sur
l'onboarding dans les deux cas, mais la première écriture qui suit écraserait
des données peut-être intactes : une `ImportError` levée par un `schemaVersion`
plus récent se répare en mettant l'app à jour, pas en effaçant. `finishOnboarding`
refuse donc d'écrire tant qu'un échec de lecture n'a pas été traité, et
`/demarrer` renvoie à l'arrivée — le verrou est aux deux endroits parce qu'un
seul des deux se contourne, l'URL étant un signet.

**La révision vit hors du document.** Même argument que la date de dernier
export : ce qui décrit le rangement de cet appareil ne voyage pas dans un
fichier exporté. Dans `Data`, elle serait dans chaque export, où elle ne veut
rien dire, et un import à la révision 900 dans une base à la révision 3 ferait
croire à l'onglet qu'il est en avance sur ses voisins. Elle est écrite dans la
même transaction que le document — sinon elle n'est la révision de rien — et
fournie par l'appelant plutôt que relue, parce que l'écriture de `pagehide` ne
peut plus se permettre d'aller-retour.

**Un onglet en retard recharge, il n'écrase pas.** À réception d'une révision
supérieure, il annule d'abord son écriture en attente : elle porte son document
périmé, et la laisser partir écraserait celui d'en face — c'est exactement le
bug qu'on retire. On jette plutôt qu'on fusionne, parce qu'il n'existe pas de
fusion pour un document unique ; le prix est au pire les 400 ms de frappe en
cours, contre le document entier de l'autre onglet. Et il le dit par un toast :
un montant qui change tout seul sous les yeux sans un mot est sa propre forme
d'inquiétude.

**L'anneau garde l'état d'avant la session.** L'instantané du jour porte le
document tel qu'il était au démarrage, pas celui qu'on vient d'écrire : un point
de retour sert à revenir avant ce qui a cassé, et ce qui casse est la session en
cours. Après un onboarding il n'y a rien à archiver, et c'est juste — il
n'existait aucun état antérieur. La clé est une date ISO, donc l'ordre
lexicographique *est* l'ordre chronologique et le rognage à cinq tient en une
ligne. Une sauvegarde ratée n'est pas une écriture ratée : elle n'allume pas le
bandeau.

**L'écran de secours rend les octets, le bandeau rend la mémoire.** Les deux
boutons portent presque le même nom et n'exportent pas la même chose, pour des
raisons exactement inverses. Le bandeau tombe quand l'écriture a échoué : c'est
le disque qui est en retard, l'écran est intact. L'`ErrorBoundary` tombe quand
le rendu a levé : le document en mémoire est le suspect, et on ne fait pas
passer un sauvetage par `migrateDocument`, qui peut lever. `CrashScreen`
n'importe donc ni le routeur ni le store — n'importe lequel peut être ce qui
vient de casser, et un écran de secours qui plante n'en est pas un.

**Ouverture du mois.** Jamais une tâche pour l'utilisateur : afficher un mois
non passé l'ouvre. Idempotente — une échéance est reconnue à sa paire récurrence
+ date — donc naviguer d'un mois à l'autre ne duplique rien et ne touche aucune
entrée confirmée. Un mois passé ne s'ouvre pas tout seul : y faire apparaître des
échéances que personne n'a confirmées inventerait un historique.

**Règle et fait.** Une récurrence est une règle, une échéance est un fait. Toute
écriture sur une récurrence réaligne ses échéances à venir dans tous les mois
ouverts, dans la même mutation. Les confirmées ne bougent jamais.

**Sens et nature.** `direction` dit si l'argent entre ou sort du compte,
`CategoryKind` dit ce qu'il devient. Un versement sur un livret sort du compte
exactement comme un plein d'essence : seule la nature les distingue. C'est ce
qui permet à la capacité d'épargne d'exister — ressources − charges − crédits,
avant versements — et au camembert de ne pas mettre « Épargne 30 % » à côté de
« Courses 12 % ». La nature est portée par la famille et lue par une fonction,
jamais dupliquée sur la catégorie : deux copies finissent toujours par diverger.

**Capital restant dû.** Dérivé, jamais stocké. `Rₙ = P(1+i)ⁿ − M((1+i)ⁿ − 1)/i`,
avec `n` le nombre de mensualités confirmées. Retrancher les mensualités versées
serait faux dès qu'il y a des intérêts : sur 100 000 € à 4 % sur 20 ans, la
première année amortit ~3 000 € pour ~7 300 € versés, et le raccourci
annoncerait le prêt soldé des années trop tôt.

**Prorata des revenus.** Le revenu d'un membre est *dérivé* de ses récurrences
de nature `resource`, ramenées au mois — il n'est stocké nulle part. Le déclarer
à côté en ferait une seconde vérité, et la première augmentation les ferait
diverger. La distinction règle / fait tient quand même, et sans doublon : c'est
la **récurrence** qui est la règle, l'`Entry` qui est le fait. Une prime est une
entrée ponctuelle, donc elle ne déplace pas la part du loyer ; une augmentation
se saisit dans la récurrence, donc elle la déplace. Le calcul refuse de répondre
— `null`, pas zéro — tant qu'un membre n'a aucune ressource à son nom, qu'un
montant variable n'a pas d'échéance confirmée d'où se lire, ou qu'une de ses
ressources vaut zéro : un prorata au dénominateur incomplet ne vaut pas zéro, il
ne veut rien dire. Le troisième cas se refusait de lui-même quand *tous* les
revenus étaient nuls, jamais quand un seul l'était — le membre à 0 € recevait
alors 0 % des charges communes, un chiffre faux qui a l'air d'un résultat.

L'asymétrie de `isRunningIn` — une règle arrêtée sort du mois, une règle à venir
y compte déjà — est bornée à un trimestre. Sans borne, un salaire déclaré pour
2030 déplaçait la part de chacun dès aujourd'hui ; avec elle, « à venir » veut
dire bientôt, ce qui est le seul sens dans lequel une déclaration parle encore
du mois qu'on regarde.

**Plus forts restes.** Répartir 2 000 € entre trois tiers en arrondissant chaque
part donnerait trois fois 666,67 € et un centime de trop. `split.ts` pose les
parts entières puis distribue le reste aux plus forts restes, à égalité au poids
le plus à gauche : la somme vaut exactement le total, et deux affichages du même
mois donnent le même centime au même membre. Le coefficient est en points de
base, comme les taux — aucun flottant ne touche un calcul financier.

**Partage.** Est commune une sortie de nature `charge` ou `debt` que personne ne
s'est attribuée. La case « à partager » est une *exception* stockée seulement
quand elle diverge de cette règle, jamais une copie : sans quoi tout ce qui a
déjà été saisi serait à requalifier, et deux sources finiraient par diverger.

**Listes longues.** Une liste qui dépasse l'écran se regroupe et se replie,
sur `<details>` natif (`ui/Disclosure.tsx`) : il porte déjà l'état pour un
lecteur d'écran, répond au clavier, et la recherche dans la page sait ouvrir ce
qui est replié. L'en-tête garde une lecture visible même replié — un total, un
compte : une section qu'il faut ouvrir pour savoir si elle vaut la peine ne fait
gagner aucun défilement. Le mois passe ainsi de 2 150 px à 302 px groupé par
personne, les récurrences de 1 518 px à 708 px, et les réglages de 4 779 px à
1 137 px. L'état d'un jeu de sections vit dans `ui/useDisclosureGroup.ts`, une
seule fois pour les trois écrans.

**La réparation des liens est une normalisation, pas une migration.** Rien ne
vérifiait qu'une `categoryId`, une `memberId` ou une `recurrenceId` désignait
quelque chose, et chaque lien mort avait sa façon d'être faux en silence : une
catégorie inconnue retombait sur `charge` par le double repli de
`kindOfCategory`, donc la dépense devenait commune et partagée ; un membre
inconnu faisait disparaître une entrée de toutes les vues filtrées tout en la
laissant peser sur le foyer. Le contrôle vit dans `validate.ts` et non dans une
étape de `MIGRATIONS`, parce que la normalisation est ce que **tout** document
traverse — y compris un fichier déjà à la version courante et écrit à la main,
qu'une migration ne verrait jamais. Elle ne change pas la forme du document, et
n'a donc rien à incrémenter.

Trois gestes, et le plus doux qui règle chaque cas. Un lien facultatif se
**coupe** : la ligne rend son membre ou sa règle au foyer et reste modifiable.
La catégorie, qui n'est pas facultative, se **redirige** vers une catégorie de
réparation visible — même famille d'accueil qu'avant, donc même nature : ce qui
change n'est pas le calcul, c'est qu'on la voit. Ce qui ne peut être ni coupé ni
redirigé — une avance dont le porteur n'existe pas — est **écarté**. Un
identifiant en double est renommé et jamais supprimé : rien ne dit laquelle des
deux lignes est la bonne, et le suffixe est déterministe pour que deux lectures
du même fichier donnent le même document.

**Une lecture qui écarte le dit.** Le rapport remonte jusqu'à la confirmation
d'import, ligne par ligne — la collection, le nom ou le rang, la raison. Un
import remplace tout le document : c'est le dernier instant où l'on peut encore
comparer avec ce qu'il y avait avant, et une dépense jetée en silence à ce
moment-là ne se retrouve plus jamais.

**Le schéma se lit sur le code.** Le document qu'on donne à un assistant pour
faire transcrire ses notes embarque le source de `domain/types.ts` — par
`?raw`, donc les types décrits *sont* les types, commentaires de rationale
compris — et son catalogue de catégories est lu sur `persistence/defaults.ts`.
Le recopier eût été une seconde description du modèle, qui aurait divergé de lui
et enseigné un document que l'app refuse : exactement l'erreur qu'il existe pour
éviter chez son lecteur.

**L'exemple est construit, pas commité.** `exampleData(on)` bâtit un foyer de
quinze mois à partir d'une date, en posant des récurrences puis en *ouvrant*
chaque mois par `openMonth` — jamais en écrivant une `Entry` à la main. Deux
conséquences : le jeu est toujours à l'heure, là où un `.json` figé serait vide
du mois courant dès le mois suivant, c'est-à-dire l'écran vide qu'il existe pour
éviter ; et il est produit par les mêmes règles que l'usage réel, donc une règle
qui change le change avec elle. Les salaires y tombent en tête de mois, ce qui
n'est pas cosmétique : chargé le 2, le jeu s'ouvrait sinon sur un solde à zéro.

Les deux modules valent une trentaine de kilo-octets pour des gestes qu'on fait
une fois dans sa vie : ils sont chargés en `import()` dynamique, et le schéma
est préparé à l'affichage de son contrôle — écrire dans le presse-papiers exige
de rester dans la tâche du clic, qu'un `await` au milieu du gestionnaire perdrait
sur Safari.

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

Le débordement qui se glisse le plus facilement n'est pas celui de la page mais
celui d'une **pilule d'eyebrow dans une tuile plate**. Une `2×1` reste en
demi-colonne sur mobile, seule de tous les formats, et n'offre que ~104px de
contenu à 320px : l'eyebrow y tient sur une ligne quoi qu'il arrive, resserre
son interlettrage, lâche son icône, rend le reste de son interlettrage, puis se
fait trancher. Le plafond est de **13 caractères** — au-delà, le format est
`4×1`, comme la tuile Capacité d'épargne (DS §5).

Il se contrôle en mesurant, pas en relisant : sur chaque `.eyebrow-pill`, on
compare son `scrollWidth` à la boîte de contenu de sa tuile, et le `scrollHeight`
de chaque `.tile` à son `clientHeight`. À 320px une coupe de quatre pixels se lit
comme un mot qu'on n'a pas su lire, pas comme un défaut — c'est exactement ce
qu'une relecture laisse passer. « Reste à vivre » débordait ainsi de 4px sur
l'écran du mois ; c'est le troisième palier de dégradation qui l'a réglé.

Saisies et fiches sont des écrans pleins avec leur URL, pas des feuilles
modales : rien à faire glisser, rien à refermer pour revenir. `ui/Sheet.tsx`
sert à ce pour quoi une feuille est faite — une explication qu'on ouvre et
qu'on referme sans quitter des yeux ce qu'elle explique. C'est le cas des
quatre soldes du tableau de bord : leur lecture secondaire ne tient pas dans
une tuile d'une rangée sous 1024px, et l'explication s'y perdait sur
téléphone.

Le mois se balaie horizontalement au doigt, le rappel d'export se chasse d'un
balayage vers le haut, et les cibles tactiles font 44px partout.

Un piège à connaître sur les gestes : `touch-action: pan-x` est ce qui rend le
balayage vertical possible. Sans lui, le navigateur préempte le mouvement pour
faire défiler la page et n'envoie plus un seul `pointermove`.
