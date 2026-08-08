/* ============================================================================
 * Le modèle de données, sous une forme qu'on peut donner à quelqu'un d'autre.
 *
 * L'app sait déjà importer un document (cahier §4.8), mais rien ne disait à
 * quoi ce document doit ressembler : le seul moyen d'en obtenir un était d'avoir
 * déjà saisi les données qu'on cherche justement à saisir. Quelqu'un dont le
 * budget est écrit dans ses notes n'avait donc aucun raccourci — alors qu'un
 * assistant sait très bien transcrire des notes en JSON, à condition qu'on lui
 * dise dans quel JSON.
 *
 * Rien ici n'est recopié de ce que le code sait déjà dire. Les types sont le
 * source de `domain/types.ts`, embarqué tel quel — commentaires compris, qui
 * expliquent au passage pourquoi `shared` est une exception ou pourquoi le
 * revenu n'est pas stocké. Le catalogue est lu sur `defaults.ts`, la version sur
 * `schema.ts`. Une seconde copie du modèle finirait par diverger de lui, et
 * c'est exactement l'erreur que ce document existe pour éviter chez son lecteur.
 *
 * La prose vit ici et non dans `i18n/fr.ts` : la règle du dépôt vise les
 * composants, et ceci est un document livré, au même titre que le README. Le
 * faire transiter par un dictionnaire de chaînes d'interface le rendrait
 * illisible des deux côtés.
 * ==========================================================================*/

import typesSource from '@/domain/types.ts?raw'
import type { CategoryKind } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { defaultCategories, defaultFamilies } from './defaults'
import { CURRENT_SCHEMA_VERSION } from './schema'

export const SCHEMA_FILENAME = 'tout-compte-fait-schema.md'

/**
 * Les types, sans leurs imports.
 *
 * `domain/types.ts` tire `Money`, `ISODate` et `YearMonth` de deux modules
 * voisins : les lignes d'import ne résolvent rien hors du dépôt, et les trois
 * alias sont redonnés juste avant. Le reste passe intact — c'est tout l'intérêt.
 */
function typeDefinitions(): string {
  return typesSource
    .replace(/^import .*\n/gm, '')
    // Les imports retirés laissent leur ligne vide contre celle qui les
    // précédait : deux blancs d'affilée là où le fichier n'en a jamais.
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const PRIMITIVES = `/* Les trois primitives, définies ailleurs dans le code. */

type Money = number      // centimes, entier signé — 12,50 € s'écrit 1250
type ISODate = string    // "AAAA-MM-JJ", date civile, jamais UTC
type YearMonth = string  // "AAAA-MM"`

const RULES = [
  '**Les montants sont des entiers, en centimes.** 12,50 € s’écrit `1250`, et 1 200 € `120000`. Jamais de flottant, jamais de chaîne, jamais de séparateur.',
  '**Les dates sont des chaînes** `"AAAA-MM-JJ"`, les mois `"AAAA-MM"`. Pas d’horodatage, pas de fuseau.',
  '**Les taux sont en points de base**, entiers : `450` vaut 4,50 %. Comme les montants, aucun flottant ne touche un calcul financier.',
  '**Un champ facultatif s’omet**, il ne vaut jamais `null` ni `""`. Seul `Recurrence.amount` accepte `null`, et ça veut dire « montant à saisir à chaque échéance ».',
  '**Le sens découle de la nature de la famille**, jamais l’inverse : une catégorie sous une famille `resource` est en `"in"`, les trois autres natures en `"out"`. Un versement sur un livret sort du compte exactement comme un plein d’essence — c’est la nature qui les distingue, pas le sens.',
  '**Une `Entry` est un fait, une `Recurrence` est une règle.** Toute statistique se lit sur les `Entry` ; une récurrence ne produit aucun chiffre par elle-même, elle produit des échéances. Un abonnement mensuel demande donc *et* la récurrence, *et* une `Entry` par mois couvert.',
  '**Le passé est `confirmed`, l’avenir est `planned`.** Une échéance à venir qu’on a déjà validée peut être `confirmed` : ça dit qu’elle aura lieu.',
  '**`months[]` doit lister chaque mois couvert par les entrées.** L’app n’ouvre jamais un mois passé toute seule — sans son `MonthState`, un mois d’historique n’existe pas pour elle.',
  '**Sur une récurrence à montant variable** (`amount: null`), `estimate` porte l’ordre de grandeur habituel. Une échéance chiffrée l’emporte toujours dessus.',
  '**`shared` est une exception, jamais une copie de la règle.** Par défaut, est commune une sortie de nature `charge` ou `debt` que personne ne s’est attribuée. Ne pose `shared` que là où tu veux dire le contraire — typiquement `true` sur une charge qu’une personne règle mais que tout le monde partage.',
  '**Une ligne est à quelqu’un, ou à tout le monde.** Une sortie sans `memberId` et hors partage sort du compte sans apparaître dans le mois de personne. Concrètement : toute entrée d’argent, tout versement d’épargne et toute charge non partagée veulent un `memberId`.',
  '**Le revenu d’une personne ne se déclare nulle part** : il se lit sur ses récurrences de nature `resource`. C’est ce qui répartit les charges communes au prorata — deux revenus veulent donc une récurrence de salaire *par personne*, avec son `memberId`.',
  '**Un `Debt` ou une `Advance` ne produit aucun mouvement d’argent.** Il faut lui lier la récurrence qui pose les mensualités (`recurrenceId`), sinon rien ne s’amortit. Le capital restant dû est dérivé des mensualités confirmées, jamais saisi.',
  '**`Advance.memberId` est obligatoire** — une épargne est toujours à quelqu’un. Une avance sans lui est écartée à l’import.',
  '**Les `id` sont des chaînes libres**, à toi de les choisir. Ils doivent être uniques dans leur tableau, et tout `categoryId`, `memberId`, `familyId` ou `recurrenceId` cité doit désigner quelque chose qui existe.',
  '**`settings.theme` et `settings.palette` sont deux réglages distincts.** Le thème dit `"light"`, `"dark"` ou `"system"` ; la palette dit avec quelles couleurs — `"classique"`, `"monochrome"`, `"douce"`, `"vive"`, `"neutre"` ou `"contrastee"`. Purement cosmétiques : ni l’un ni l’autre ne change un calcul. Une valeur inconnue retombe sur `"classique"` sans que la ligne soit écartée.',
  '**Trois champs sont réservés et sans effet en v1.** `Category.icon`, `MonthState.closed` et `settings.monthStartsOn` sont lus, validés et conservés à l’import, mais aucun écran ne s’en sert : l’icône n’est jamais rendue, un mois n’est jamais clos, et l’app raisonne en mois calendaire. Laisse-les à leur valeur par défaut — `""`, `false`, `1`. Y mettre autre chose ne casse rien et ne fait rien non plus, et ce document préfère le dire plutôt que de te laisser croire à un réglage.',
]

/** Un document minimal mais complet : deux personnes, un salaire chacune, un loyer partagé. */
const MINIMAL = `{
  "schemaVersion": ${String(CURRENT_SCHEMA_VERSION)},
  "household": {
    "name": "Maison",
    "members": [
      { "id": "m-alix", "name": "Alix", "color": "var(--member-1)" },
      { "id": "m-camille", "name": "Camille", "color": "var(--member-2)" }
    ]
  },
  "families": [
    { "id": "fam-resources", "label": "Ressources", "kind": "resource" },
    { "id": "fam-housing", "label": "Logement", "kind": "charge" },
    { "id": "fam-daily", "label": "Vie courante", "kind": "charge" }
  ],
  "categories": [
    {
      "id": "salary",
      "label": "Salaire",
      "familyId": "fam-resources",
      "icon": "",
      "color": "var(--cat-1)",
      "direction": "in",
      "archived": false
    },
    {
      "id": "rent",
      "label": "Loyer",
      "familyId": "fam-housing",
      "icon": "",
      "color": "var(--cat-2)",
      "direction": "out",
      "archived": false
    },
    {
      "id": "groceries",
      "label": "Courses",
      "familyId": "fam-daily",
      "icon": "",
      "color": "var(--cat-5)",
      "direction": "out",
      "archived": false
    }
  ],
  "recurrences": [
    {
      "id": "r-salaire-alix",
      "label": "Salaire",
      "categoryId": "salary",
      "memberId": "m-alix",
      "direction": "in",
      "amount": 275000,
      "period": { "unit": "month", "every": 1, "anchorDay": 28 },
      "startedOn": "2026-01-28"
    },
    {
      "id": "r-salaire-camille",
      "label": "Salaire",
      "categoryId": "salary",
      "memberId": "m-camille",
      "direction": "in",
      "amount": 218000,
      "period": { "unit": "month", "every": 1, "anchorDay": 28 },
      "startedOn": "2026-01-28"
    },
    {
      "id": "r-loyer",
      "label": "Loyer",
      "categoryId": "rent",
      "direction": "out",
      "amount": 95000,
      "period": { "unit": "month", "every": 1, "anchorDay": 5 },
      "startedOn": "2026-01-05"
    }
  ],
  "entries": [
    {
      "id": "e-1",
      "recurrenceId": "r-salaire-alix",
      "label": "Salaire",
      "categoryId": "salary",
      "memberId": "m-alix",
      "direction": "in",
      "amount": 275000,
      "date": "2026-01-28",
      "status": "confirmed"
    },
    {
      "id": "e-2",
      "recurrenceId": "r-salaire-camille",
      "label": "Salaire",
      "categoryId": "salary",
      "memberId": "m-camille",
      "direction": "in",
      "amount": 218000,
      "date": "2026-01-28",
      "status": "confirmed"
    },
    {
      "id": "e-3",
      "recurrenceId": "r-loyer",
      "label": "Loyer",
      "categoryId": "rent",
      "direction": "out",
      "amount": 95000,
      "date": "2026-01-05",
      "status": "confirmed"
    },
    {
      "id": "e-4",
      "label": "Courses",
      "categoryId": "groceries",
      "memberId": "m-camille",
      "direction": "out",
      "amount": 8450,
      "date": "2026-01-12",
      "status": "confirmed",
      "note": "Une dépense ponctuelle n’a pas de recurrenceId."
    }
  ],
  "debts": [],
  "advances": [],
  "months": [{ "ym": "2026-01", "openedAt": "2026-01-01", "closed": false }],
  "settings": { "theme": "system", "palette": "classique", "currency": "EUR", "monthStartsOn": 1 }
}`

/** Le catalogue, famille par famille, tel qu'une app neuve le pose. */
function catalogue(): string {
  const categories = defaultCategories()
  return defaultFamilies()
    .map((family) => {
      const rows = categories
        .filter((category) => category.familyId === family.id)
        .map((category) => `| \`${category.id}\` | ${category.label} |`)
        .join('\n')
      return [
        `### ${family.label} — \`${family.id}\``,
        '',
        `Nature \`${family.kind}\`, donc sens \`${directionLabel(family.kind)}\`.`,
        '',
        '| id | libellé |',
        '|---|---|',
        rows,
      ].join('\n')
    })
    .join('\n\n')
}

const directionLabel = (kind: CategoryKind): string => (kind === 'resource' ? 'in' : 'out')

const NATURES = (['resource', 'charge', 'debt', 'saving'] as const)
  .map((kind) => `- \`${kind}\` — ${fr.kinds[kind]}, sens \`${directionLabel(kind)}\``)
  .join('\n')

/**
 * Le document, prêt à coller dans un assistant.
 *
 * Recalculé à chaque appel plutôt que figé dans une constante : il lit le
 * catalogue par défaut, qui est du code, et une constante de module l'évaluerait
 * à l'import — soit avant que quiconque l'ait demandé, pour un document qu'on
 * ne consulte qu'une fois.
 */
export function schemaDocument(): string {
  return `# Tout compte fait — modèle de données

Version de schéma : **${String(CURRENT_SCHEMA_VERSION)}**

## À quoi sert ce document

Tout compte fait garde tout dans un seul document JSON — le même que l'app
exporte et réimporte. Ce fichier le décrit en entier.

L'usage prévu : colle ce document dans un assistant, ajoute tes notes de budget
telles qu'elles sont, même en vrac, et demande-lui le JSON correspondant.
Récupère le fichier, puis, dans l'app : **Réglages → Données → Importer**.

L'import remplace intégralement les données existantes. Il vaut mieux exporter
avant, si tu as déjà saisi quelque chose.

## Ce qu'il faut produire

Un seul objet JSON, exactement la forme du type \`Data\` ci-dessous. Pas
d'enveloppe autour, pas de champ en plus, pas de commentaire : du JSON, pas du
JavaScript.

## Les types

C'est le source de l'app, tel quel. Les commentaires disent le pourquoi de
chaque règle — ils valent la lecture.

\`\`\`ts
${PRIMITIVES}

${typeDefinitions()}
\`\`\`

## Les règles

${RULES.map((rule) => `- ${rule}`).join('\n')}

## Les quatre natures

Une famille porte une nature, et ses catégories en héritent leur sens.

${NATURES}

L'épargne se compte **en net** : un versement est une sortie, une reprise sur un
livret est une \`Entry\` de sens \`in\` sur une catégorie \`saving\`.

## Le catalogue par défaut

Ces identifiants existent déjà dans une app neuve — réutilise-les plutôt que
d'en inventer, tes entrées se rangeront toutes seules. Rien n'empêche d'ajouter
une famille ou une catégorie : il faut alors la déclarer dans \`families\` ou
\`categories\`, et faire suivre le sens de la nature de sa famille.

${catalogue()}

## Un document minimal

Deux personnes, un salaire chacune, un loyer commun et une dépense ponctuelle.
Il s'importe tel quel.

\`\`\`json
${MINIMAL}
\`\`\`
`
}
