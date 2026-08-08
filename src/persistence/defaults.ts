/* Document initial. Deux questions au premier lancement suffisent : tout le
 * reste part de valeurs par défaut modifiables ensuite (cahier §1 et §4.1). */

import {
  type Category,
  type CategoryKind,
  DEFAULT_PALETTE,
  type Family,
  directionOfKind,
} from '@/domain/types'
import type { Data } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { CURRENT_SCHEMA_VERSION } from './schema'

/** Les six teintes du DS §2.4, dans l'ordre, puis on recommence. */
const CATEGORY_COLORS = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
] as const

function colorAt(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'var(--cat-1)'
}

/**
 * Le catalogue par défaut, en un seul endroit : une famille, sa nature, ses
 * catégories. L'ordre des familles fait foi — c'est celui des onglets, et
 * celui dans lequel les teintes sont distribuées.
 */
const SEED: { id: string; label: string; kind: CategoryKind; categories: [string, string][] }[] = [
  {
    id: 'fam-resources',
    label: fr.defaultFamilies.resources,
    kind: 'resource',
    categories: [
      ['salary', fr.defaultCategories.salary],
      ['benefits', fr.defaultCategories.benefits],
      ['family-benefits', fr.defaultCategories.familyBenefits],
      ['alimony-in', fr.defaultCategories.alimonyIn],
      ['housing-aid', fr.defaultCategories.housingAid],
      ['rental-income', fr.defaultCategories.rentalIncome],
    ],
  },
  {
    id: 'fam-housing',
    label: fr.defaultFamilies.housing,
    kind: 'charge',
    categories: [
      ['rent', fr.defaultCategories.rent],
      ['energy', fr.defaultCategories.energy],
      ['home-insurance', fr.defaultCategories.homeInsurance],
      ['housing-tax', fr.defaultCategories.housingTax],
      ['property-tax', fr.defaultCategories.propertyTax],
    ],
  },
  {
    id: 'fam-communication',
    label: fr.defaultFamilies.communication,
    kind: 'charge',
    categories: [
      ['mobile', fr.defaultCategories.mobile],
      ['internet', fr.defaultCategories.internet],
      ['streaming', fr.defaultCategories.streaming],
    ],
  },
  {
    id: 'fam-transport',
    label: fr.defaultFamilies.transport,
    kind: 'charge',
    categories: [
      ['fuel', fr.defaultCategories.fuel],
      ['car-insurance', fr.defaultCategories.carInsurance],
      ['car-maintenance', fr.defaultCategories.carMaintenance],
      ['public-transport', fr.defaultCategories.publicTransport],
      ['tolls', fr.defaultCategories.tolls],
    ],
  },
  {
    id: 'fam-daily',
    label: fr.defaultFamilies.daily,
    kind: 'charge',
    categories: [
      ['groceries', fr.defaultCategories.groceries],
      ['clothing', fr.defaultCategories.clothing],
      ['household', fr.defaultCategories.household],
      ['hygiene', fr.defaultCategories.hygiene],
    ],
  },
  {
    id: 'fam-health',
    label: fr.defaultFamilies.health,
    kind: 'charge',
    categories: [
      ['health-insurance', fr.defaultCategories.healthInsurance],
      ['medical', fr.defaultCategories.medical],
      ['pharmacy', fr.defaultCategories.pharmacy],
    ],
  },
  {
    id: 'fam-family',
    label: fr.defaultFamilies.family,
    kind: 'charge',
    categories: [
      ['childcare', fr.defaultCategories.childcare],
      ['school', fr.defaultCategories.school],
      ['alimony-out', fr.defaultCategories.alimonyOut],
      ['child-activities', fr.defaultCategories.childActivities],
    ],
  },
  {
    id: 'fam-taxes',
    label: fr.defaultFamilies.taxes,
    kind: 'charge',
    categories: [
      ['income-tax', fr.defaultCategories.incomeTax],
      ['other-taxes', fr.defaultCategories.otherTaxes],
    ],
  },
  {
    id: 'fam-leisure',
    label: fr.defaultFamilies.leisure,
    kind: 'charge',
    categories: [
      ['outings', fr.defaultCategories.outings],
      ['culture', fr.defaultCategories.culture],
      ['gifts', fr.defaultCategories.gifts],
      ['misc', fr.defaultCategories.misc],
    ],
  },
  {
    id: 'fam-credits',
    label: fr.defaultFamilies.credits,
    kind: 'debt',
    categories: [
      ['car-loan', fr.defaultCategories.carLoan],
      ['mortgage', fr.defaultCategories.mortgage],
      ['leasing', fr.defaultCategories.leasing],
      ['consumer-loan', fr.defaultCategories.consumerLoan],
      ['other-loan', fr.defaultCategories.otherLoan],
    ],
  },
  {
    id: 'fam-savings',
    label: fr.defaultFamilies.savings,
    kind: 'saving',
    categories: [
      ['passbook', fr.defaultCategories.passbook],
      ['plans', fr.defaultCategories.plans],
      ['life-insurance', fr.defaultCategories.lifeInsurance],
      ['retirement', fr.defaultCategories.retirement],
      ['company-savings', fr.defaultCategories.companySavings],
    ],
  },
]

export function defaultFamilies(): Family[] {
  return SEED.map((family) => ({ id: family.id, label: family.label, kind: family.kind }))
}

/**
 * La teinte est portée par la famille, pas par la catégorie : c'est au niveau
 * de la famille que se lit la répartition, et quarante-six pastilles toutes
 * différentes ne distinguent plus rien.
 */
export function familyColor(familyId: string): string {
  const index = SEED.findIndex((family) => family.id === familyId)
  return colorAt(index < 0 ? SEED.length : index)
}

export function defaultCategories(): Category[] {
  return SEED.flatMap((family) =>
    family.categories.map(([id, label]) => ({
      id,
      label,
      familyId: family.id,
      icon: '',
      color: familyColor(family.id),
      direction: directionOfKind(family.kind),
      archived: false,
    })),
  )
}

/** La famille d'accueil d'une catégorie orpheline, par sens de trésorerie. */
export function fallbackFamilyId(direction: 'in' | 'out'): string {
  return direction === 'in' ? 'fam-resources' : 'fam-leisure'
}

/**
 * La catégorie d'accueil d'une ligne qui en désignait une inexistante.
 *
 * `Entry.categoryId` n'est pas facultatif : à la différence du membre ou de la
 * récurrence, on ne peut pas couper le lien, il faut le rediriger. Sans elle,
 * la ligne gardait un identifiant mort, et `kindOfCategory` retombait sur
 * « charge » par un double repli — la dépense devenait donc commune et partagée
 * entre les membres, en silence. Elle atterrit dans la même famille d'accueil,
 * donc avec la même nature qu'avant : ce qui change n'est pas le calcul, c'est
 * qu'on la voit, et qu'un clic la range où elle doit aller.
 *
 * Une par sens, parce qu'une catégorie porte un sens et qu'une seule
 * obligerait une recette à emprunter la catégorie d'une dépense.
 */
export function repairedCategory(direction: 'in' | 'out'): Category {
  const familyId = fallbackFamilyId(direction)
  return {
    id: direction === 'in' ? 'repaired-in' : 'repaired-out',
    label: fr.defaults.repairedCategory,
    familyId,
    icon: '',
    color: familyColor(familyId),
    direction,
    archived: false,
  }
}

export function emptyData(): Data {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    household: { name: '', members: [] },
    families: defaultFamilies(),
    categories: defaultCategories(),
    recurrences: [],
    entries: [],
    debts: [],
    advances: [],
    months: [],
    settings: { theme: 'system', palette: DEFAULT_PALETTE, currency: 'EUR', monthStartsOn: 1 },
  }
}

/** Couleur d'une nouvelle catégorie : celle de sa famille. */
export function nextCategoryColor(familyId: string): string {
  return familyColor(familyId)
}

/**
 * Les teintes des membres — une palette à eux, et non celle des catégories.
 *
 * Le vert pomme en est absent : c'est `--accent`, donc le signal « actif » de
 * l'app et la couleur du commun. Le premier membre le portait, si bien que sa
 * pastille se lisait comme une sélection — on croyait ne lire que ses données —
 * et qu'elle disparaissait tout à fait dans une pilule de filtre active, qui
 * passe elle-même en `--accent`.
 */
export const MEMBER_COLORS = [
  'var(--member-1)',
  'var(--member-2)',
  'var(--member-3)',
  'var(--member-4)',
  'var(--member-5)',
] as const

export function memberColorAt(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length] ?? 'var(--member-1)'
}

export function nextMemberColor(count: number): string {
  return memberColorAt(count)
}
