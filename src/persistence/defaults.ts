/* Document initial. Deux questions au premier lancement suffisent : tout le
 * reste part de valeurs par défaut modifiables ensuite (cahier §1 et §4.1). */

import { type Category, type CategoryKind, type Family, directionOfKind } from '@/domain/types'
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
 * de la famille que se lit la répartition, et trente-huit pastilles toutes
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

export function emptyData(): Data {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    household: { name: fr.defaults.householdName, members: [] },
    families: defaultFamilies(),
    categories: defaultCategories(),
    recurrences: [],
    entries: [],
    debts: [],
    months: [],
    settings: { theme: 'system', currency: 'EUR', monthStartsOn: 1 },
  }
}

/** Couleur d'une nouvelle catégorie : celle de sa famille. */
export function nextCategoryColor(familyId: string): string {
  return familyColor(familyId)
}

export const MEMBER_COLORS = CATEGORY_COLORS

export function nextMemberColor(count: number): string {
  return colorAt(count)
}
