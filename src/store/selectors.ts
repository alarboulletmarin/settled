/* ============================================================================
 * Sélecteurs — le seul chemin par lequel un composant lit une statistique.
 *
 * Chaque hook lit des tranches stables du store puis dérive avec useMemo :
 * un sélecteur zustand qui renverrait un objet neuf à chaque rendu relancerait
 * le rendu en boucle.
 * ==========================================================================*/

import { useMemo } from 'react'
import { type ISODate, type YearMonth, addMonthsToYm, endOfMonth, today } from '@/domain/date'
import { type MonthPoint, trailingMonths } from '@/domain/history'
import { coveredMonths } from '@/domain/month'
import { type Money, sum } from '@/domain/money'
import { type PriceChange, amountOn, detectPriceChange } from '@/domain/priceHistory'
import { annualCost, monthlyEquivalent, nextOccurrence } from '@/domain/recurrence'
import {
  type CategorySlice,
  type Flow,
  type KindOf,
  type KindTotals,
  type MonthTotals,
  type SubscriptionTotals,
  type Upcoming,
  breakdownByCategory,
  breakdownByFamily,
  entriesOfMonth,
  incomeFlow,
  monthProgress,
  monthTotals,
  restToLive,
  spendingFlow,
  subscriptionTotals,
  totalsByKind,
  upcomingEntries,
} from '@/domain/stats'
import { type DebtStatus, debtStatus } from '@/domain/debt'
import {
  type MemberCharges,
  type MemberIncome,
  type MemberShare,
  memberCharges,
  memberIncomes,
  memberShares,
  scopeToMember,
  sharedEntries,
  unassignedIncomes,
} from '@/domain/split'
import {
  type Category,
  type CategoryKind,
  type Debt,
  type Entry,
  type Family,
  type Member,
  type Recurrence,
  isSpending,
} from '@/domain/types'
import { useStore } from './store'

/* --- Tranches brutes ------------------------------------------------------*/

export const useEntries = (): Entry[] => useStore((s) => s.data.entries)
export const useRecurrences = (): Recurrence[] => useStore((s) => s.data.recurrences)
export const useCategories = (): Category[] => useStore((s) => s.data.categories)
export const useFamilies = (): Family[] => useStore((s) => s.data.families)
export const useDebts = (): Debt[] => useStore((s) => s.data.debts)
export const useMembers = (): Member[] => useStore((s) => s.data.household.members)
export const useHouseholdName = (): string => useStore((s) => s.data.household.name)
export const useCurrentYm = (): YearMonth => useStore((s) => s.ym)
export const useMemberFilter = (): string | undefined => useStore((s) => s.memberFilter)
export const useCurrencyCode = (): string => useStore((s) => s.data.settings.currency)

/** Les catégories utilisables : les archivées ne sont plus proposées. */
export function useActiveCategories(direction?: 'in' | 'out'): Category[] {
  const categories = useCategories()
  return useMemo(
    () =>
      categories.filter((c) => !c.archived && (direction === undefined || c.direction === direction)),
    [categories, direction],
  )
}

export function useCategoryMap(): Map<string, Category> {
  const categories = useCategories()
  return useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
}

export function useFamilyMap(): Map<string, Family> {
  const families = useFamilies()
  return useMemo(() => new Map(families.map((f) => [f.id, f])), [families])
}

/**
 * La nature d'une catégorie, résolue par sa famille. Passée aux fonctions du
 * domaine, qui restent ainsi ignorantes du store.
 */
export function useKindOf(): KindOf {
  const families = useFamilies()
  const categories = useCategories()
  return useMemo(() => {
    const familyOf = new Map(categories.map((c) => [c.id, c.familyId]))
    const kindOf = new Map(families.map((f) => [f.id, f.kind]))
    return (categoryId: string): CategoryKind => {
      const family = familyOf.get(categoryId)
      return (family === undefined ? undefined : kindOf.get(family)) ?? 'charge'
    }
  }, [families, categories])
}

/**
 * Combien vaut un abonnement à une date — montant fixe, échéance chiffrée ou
 * montant habituel, dans cet ordre (voir `amountOn`). Aujourd'hui par défaut,
 * fin de mois pour ce qui se lit sur un mois.
 *
 * Passée aux fonctions du domaine comme `kindOf`, et pour la même raison : le
 * revenu d'un membre, le total des abonnements et la fiche d'un abonnement
 * posent la même question, et il n'y a qu'ici qu'on y répond. Trois lectures
 * qui divergent, ce sont trois chiffres qui se contredisent d'un écran à
 * l'autre — et un prorata qui reste muet sans qu'on sache pourquoi.
 */
export function useAmountOf(on: ISODate = today()): (recurrence: Recurrence) => Money | null {
  const entries = useEntries()
  return useMemo(
    () => (recurrence: Recurrence): Money | null => amountOn(recurrence, entries, on),
    [entries, on],
  )
}

export type FamilyGroup = { family: Family; categories: Category[] }

/**
 * Les catégories utilisables, rangées sous leur famille et dans l'ordre du
 * catalogue. Une famille sans catégorie active ne figure pas : un onglet vide
 * n'est pas un choix.
 */
export function useCategoriesByFamily(kinds?: readonly CategoryKind[]): FamilyGroup[] {
  const families = useFamilies()
  const categories = useCategories()
  const wanted = kinds === undefined ? undefined : new Set(kinds)
  const key = wanted === undefined ? '' : [...wanted].sort().join(',')

  return useMemo(() => {
    const scope = key === '' ? null : new Set(key.split(','))
    return families
      .filter((family) => scope === null || scope.has(family.kind))
      .map((family) => ({
        family,
        categories: categories.filter((c) => c.familyId === family.id && !c.archived),
      }))
      .filter((group) => group.categories.length > 0)
  }, [families, categories, key])
}

/** Toutes les familles avec leurs catégories, archivées comprises — Réglages. */
export function useAllCategoriesByFamily(): FamilyGroup[] {
  const families = useFamilies()
  const categories = useCategories()
  return useMemo(
    () =>
      families.map((family) => ({
        family,
        categories: categories.filter((c) => c.familyId === family.id),
      })),
    [families, categories],
  )
}

export function useMemberMap(): Map<string, Member> {
  const members = useMembers()
  return useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
}

/* --- Le mois --------------------------------------------------------------*/

/** Une entrée par son identifiant. `null` si elle n'existe pas (ou plus). */
export function useEntry(id: string | undefined): Entry | null {
  const entries = useEntries()
  return useMemo(
    () => (id === undefined ? null : (entries.find((entry) => entry.id === id) ?? null)),
    [entries, id],
  )
}

export type MonthScope = {
  /** Les entrées à lire : celles du foyer, ou celles du membre sélectionné. */
  entries: Entry[]
  /** Un membre est sélectionné, et sa part des charges communes est comptée. */
  prorated: boolean
  /**
   * Un membre est sélectionné, mais le prorata ne se calcule pas : on retombe
   * sur ses seules lignes, et l'écran doit dire ce qui manque.
   */
  partial: boolean
}

/**
 * La portée de lecture des chiffres du mois — le seul endroit où le filtre par
 * membre s'applique.
 *
 * Filtrer sur quelqu'un ne peut pas se réduire à ne garder que ses lignes : une
 * charge commune n'appartient à personne, donc aucune ne passerait le filtre, et
 * chacun se lirait sans loyer ni électricité. Un membre voit donc ses lignes et
 * sa part de chaque charge commune, au prorata des revenus — le même partage
 * que l'écran Répartition, à la même règle et au même centime.
 */
export function useMonthScope(): MonthScope {
  const entries = useEntries()
  const member = useMemberFilter()
  const kindOf = useKindOf()
  const incomes = useMemberIncomes()

  return useMemo(() => {
    if (member === undefined) return { entries, prorated: false, partial: false }
    const scoped = scopeToMember(entries, member, kindOf, incomes)
    if (scoped !== null) return { entries: scoped, prorated: true, partial: false }
    return {
      entries: entries.filter((entry) => entry.memberId === member),
      prorated: false,
      partial: true,
    }
  }, [entries, member, kindOf, incomes])
}

/**
 * Les entrées réelles du mois affiché, filtrées sur le membre sélectionné.
 *
 * Ce sont celles des listes sur lesquelles on agit : une échéance se confirme
 * en entier, jamais à la part de quelqu'un. Les chiffres, eux, passent par
 * `useMonthScope`.
 */
export function useMonthEntries(ym?: YearMonth): Entry[] {
  const entries = useEntries()
  const current = useCurrentYm()
  const member = useMemberFilter()
  const month = ym ?? current
  return useMemo(() => entriesOfMonth(entries, month, member), [entries, month, member])
}

/** Les entrées du mois affiché, à la portée de lecture courante. */
export function useScopedMonthEntries(ym?: YearMonth): Entry[] {
  const { entries } = useMonthScope()
  const current = useCurrentYm()
  const month = ym ?? current
  return useMemo(() => entriesOfMonth(entries, month), [entries, month])
}

export function useMonthTotals(ym?: YearMonth): MonthTotals {
  const { entries } = useMonthScope()
  const current = useCurrentYm()
  const month = ym ?? current
  return useMemo(() => monthTotals(entries, month), [entries, month])
}

export function useRestToLive(): Money {
  const { entries } = useMonthScope()
  const month = useCurrentYm()
  return useMemo(() => restToLive(entries, month, today()), [entries, month])
}

export function useCategoryBreakdown(direction: 'in' | 'out' = 'out'): CategorySlice[] {
  const { entries } = useMonthScope()
  const month = useCurrentYm()
  return useMemo(
    () => breakdownByCategory(entries, month, direction),
    [entries, month, direction],
  )
}

/**
 * Les prochaines échéances. Elle se lit, elle ne s'actionne pas : une charge
 * commune y figure donc à la part du membre sélectionné, comme les totaux.
 */
export function useUpcoming(limit = 5): Upcoming[] {
  const { entries } = useMonthScope()
  return useMemo(() => upcomingEntries(entries, today(), limit), [entries, limit])
}

/* --- Lecture par nature ---------------------------------------------------*/

export function useKindTotals(forecast = false): KindTotals {
  const { entries } = useMonthScope()
  const month = useCurrentYm()
  const kindOf = useKindOf()
  return useMemo(
    () => totalsByKind(entries, month, kindOf, undefined, forecast),
    [entries, month, kindOf, forecast],
  )
}

export type MonthFlows = {
  /** Ce que le mois fait rentrer. */
  income: Flow
  /** Ce qu'il fait payer — charges et crédits, hors épargne. */
  spending: Flow
}

/**
 * Les deux chiffres que les soldes combinent sans jamais les dire : ce qu'on
 * gagne et ce qu'on paie, chacun avec la part déjà tombée.
 *
 * Ils se lisent sur les mêmes totaux par nature que la capacité d'épargne — la
 * lecture confirmée et la lecture prévisionnelle — et le filtre par membre de
 * l'en-tête vaut pour eux comme pour le reste du tableau de bord.
 */
export function useMonthFlows(): MonthFlows {
  const confirmed = useKindTotals()
  const forecast = useKindTotals(true)
  return useMemo(
    () => ({
      income: incomeFlow(confirmed, forecast),
      spending: spendingFlow(confirmed, forecast),
    }),
    [confirmed, forecast],
  )
}

/**
 * Répartition de ce qui est réellement consommé — charges et crédits — par
 * famille. L'épargne en est exclue : elle sort du compte mais reste au foyer,
 * et la mêler aux dépenses ferait passer un bon mois pour un mois dispendieux.
 */
export function useSpendingByFamily(limit?: number): CategorySlice[] {
  const { entries } = useMonthScope()
  const month = useCurrentYm()
  const categories = useCategories()
  const kindOf = useKindOf()
  return useMemo(() => {
    const familyOf = new Map(categories.map((c) => [c.id, c.familyId]))
    return breakdownByFamily(
      entries,
      month,
      (categoryId) => familyOf.get(categoryId) ?? '',
      (categoryId) => isSpending(kindOf(categoryId)),
      undefined,
      limit,
    )
  }, [entries, month, categories, kindOf, limit])
}

/* --- Répartition entre membres --------------------------------------------*/

export type MonthSplit = {
  /** Ce qui est à répartir : charges et crédits communs du mois. */
  total: Money
  /** Le détail de ce total, pour que le chiffre s'ouvre au lieu d'être cru. */
  entries: Entry[]
  /** `null` tant que le prorata ne peut pas se calculer — voir `memberShares`. */
  shares: MemberShare[] | null
  /** Les membres dont le revenu n'est pas connu, pour pouvoir les nommer. */
  unknown: Member[]
}

/**
 * Le revenu mensuel de chaque membre sur le mois affiché, et ce qui manque
 * quand il ne se lit pas.
 *
 * Sur le mois affiché, et non au jour où l'on regarde : la répartition d'août
 * se lit avec les revenus d'août, qu'on l'ouvre le 31 juillet ou le 15 août.
 * Lu au jour dit, un salaire dont la première échéance tombe le 1er du mois
 * suivant n'existait pas encore — le foyer qui venait de poser ses deux
 * salaires n'avait aucune répartition, et en aurait eu une le lendemain.
 *
 * Le montant de chaque abonnement passe par `useAmountOf` — le même que celui
 * du total des abonnements et de la liste : le salaire qui pèse dans le prorata
 * est au centime celui qui s'affiche sur sa fiche. Il se lit en fin de mois,
 * comme les charges qu'il sert à répartir : c'est la même question, « combien
 * ce mois-ci », et non « combien à cet instant ».
 */
export function useMemberIncomes(): MemberIncome[] {
  const members = useMembers()
  const recurrences = useRecurrences()
  const month = useCurrentYm()
  const amountOf = useAmountOf(endOfMonth(month))
  const kindOf = useKindOf()
  return useMemo(
    () => memberIncomes(members, recurrences, kindOf, amountOf, month),
    [members, recurrences, amountOf, kindOf, month],
  )
}

/**
 * Les ressources actives que personne ne porte — elles ne comptent dans le
 * revenu d'aucun membre, et donc dans le prorata de personne.
 *
 * Les écrans qui parlent de revenus le disent : un salaire resté « tout le
 * foyer » est la première explication d'une répartition qui ne se calcule pas,
 * et c'est la seule qu'on ne pouvait deviner nulle part.
 */
export function useUnassignedIncomes(): Recurrence[] {
  const recurrences = useRecurrences()
  const month = useCurrentYm()
  const kindOf = useKindOf()
  return useMemo(
    () => unassignedIncomes(recurrences, kindOf, month),
    [recurrences, kindOf, month],
  )
}

/**
 * Le coefficient de chaque membre, en points de base, indépendamment de tout
 * mois : c'est la lecture des réglages, où l'on veut voir la part de chacun
 * sans avoir à naviguer jusqu'à un mois. `null` tant qu'il ne se calcule pas.
 */
export function useMemberSharesOfIncome(): Map<string, number> | null {
  const incomes = useMemberIncomes()
  return useMemo(() => {
    // Aucune charge à répartir : c'est le coefficient qu'on lit ici, pas ce
    // que chacun doit sur un mois donné.
    const shares = memberShares(incomes, [])
    if (shares === null) return null
    return new Map(shares.map((s) => [s.memberId, s.shareBp]))
  }, [incomes])
}

/**
 * La répartition du mois affiché.
 *
 * Elle ignore volontairement le filtre par membre de l'en-tête : une charge
 * commune n'appartient à personne, donc filtrer sur quelqu'un la ferait
 * disparaître. C'est une lecture du foyer, et l'écran qui la porte se retire
 * quand un filtre est actif plutôt que d'afficher un zéro trompeur.
 */
export function useMonthSplit(ym?: YearMonth): MonthSplit {
  const entries = useEntries()
  const current = useCurrentYm()
  const members = useMembers()
  const incomes = useMemberIncomes()
  const kindOf = useKindOf()
  const month = ym ?? current

  return useMemo(() => {
    const shared = sharedEntries(entries, month, kindOf)
    const amounts = shared.map((e) => e.amount)
    const missing = new Set(incomes.filter((i) => i.income === null).map((i) => i.memberId))
    return {
      total: sum(amounts),
      entries: shared,
      shares: memberShares(incomes, amounts),
      unknown: members.filter((m) => missing.has(m.id)),
    }
  }, [entries, month, kindOf, members, incomes])
}

/**
 * Ce que le mois affiché coûte au membre filtré, ses charges d'un côté et sa
 * part du foyer de l'autre.
 *
 * `null` hors filtre — le foyer entier n'a pas de part, il a une répartition —
 * et tant que le prorata ne se calcule pas : l'en-tête du mois dit alors ce qui
 * manque, et une tuile de plus le répéterait sans rien ajouter.
 */
export function useMemberCharges(): MemberCharges | null {
  const entries = useEntries()
  const current = useCurrentYm()
  const member = useMemberFilter()
  const kindOf = useKindOf()
  const incomes = useMemberIncomes()

  return useMemo(
    () =>
      member === undefined ? null : memberCharges(entries, current, member, kindOf, incomes),
    [entries, current, member, kindOf, incomes],
  )
}

/* --- Crédits --------------------------------------------------------------*/

/**
 * L'état de chaque crédit, le plus lourd d'abord. La mensualité vient de la
 * récurrence liée : c'est elle qui fait foi, et la modifier se répercute ici
 * sans qu'on ait à ressaisir le crédit.
 */
export function useDebtStatuses(): DebtStatus[] {
  const debts = useDebts()
  const recurrences = useRecurrences()
  const entries = useEntries()
  return useMemo(() => {
    const now = today()
    const monthlyOf = new Map(recurrences.map((r) => [r.id, r.amount]))
    return debts
      .map((debt) =>
        debtStatus(
          debt,
          entries,
          debt.recurrenceId === undefined ? null : (monthlyOf.get(debt.recurrenceId) ?? null),
          now,
        ),
      )
      .sort((a, b) => b.remaining - a.remaining)
  }, [debts, recurrences, entries])
}

export function useDebtStatus(id: string | undefined): DebtStatus | null {
  const statuses = useDebtStatuses()
  return useMemo(
    () => (id === undefined ? null : (statuses.find((s) => s.debt.id === id) ?? null)),
    [statuses, id],
  )
}

export function useMonthProgress(): number {
  const month = useCurrentYm()
  return useMemo(() => monthProgress(month, today()), [month])
}

/* --- Abonnements ----------------------------------------------------------*/

export function useSubscriptionTotals(direction: 'in' | 'out' = 'out'): SubscriptionTotals {
  const recurrences = useRecurrences()
  const amountOf = useAmountOf()
  return useMemo(
    () => subscriptionTotals(recurrences, amountOf, today(), direction),
    [recurrences, amountOf, direction],
  )
}

export type MonthPending = {
  /** Échéances prêtes à confirmer telles quelles. */
  fixed: Entry[]
  /** Échéances dont le montant reste à saisir (cahier §4.3). */
  variable: Entry[]
}

/** Les échéances prévues du mois affiché, les variables listées à part. */
export function useMonthPending(): MonthPending {
  const entries = useMonthEntries()
  const recurrences = useRecurrences()
  return useMemo(() => {
    const variableIds = new Set(
      recurrences.filter((r) => r.amount === null).map((r) => r.id),
    )
    const planned = entries
      .filter((e) => e.status === 'planned')
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    return {
      fixed: planned.filter((e) => e.recurrenceId === undefined || !variableIds.has(e.recurrenceId)),
      variable: planned.filter(
        (e) => e.recurrenceId !== undefined && variableIds.has(e.recurrenceId),
      ),
    }
  }, [entries, recurrences])
}

/** Les entrées confirmées du mois, de la plus récente à la plus ancienne. */
export function useMonthConfirmed(): Entry[] {
  const entries = useMonthEntries()
  return useMemo(
    () =>
      entries
        .filter((e) => e.status === 'confirmed')
        .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0)),
    [entries],
  )
}

export function useIsMonthOpened(): boolean {
  const ym = useCurrentYm()
  const months = useStore((s) => s.data.months)
  return useMemo(() => months.some((m) => m.ym === ym), [months, ym])
}

export type RecurrenceRow = {
  recurrence: Recurrence
  /** Prochaine échéance à venir, ou null si la récurrence est terminée. */
  next: ISODate | null
  monthly: Money | null
  annual: Money | null
  priceChange: PriceChange | null
  stopped: boolean
}

/**
 * La liste des abonnements, triée par prochaine échéance. Ceux qui n'ont plus
 * d'échéance passent à la fin : ils ne se disputent pas l'attention.
 */
export function useRecurrenceRows(): RecurrenceRow[] {
  const recurrences = useRecurrences()
  const entries = useEntries()
  const amountOf = useAmountOf()
  return useMemo(() => {
    const now = today()
    const rows = recurrences.map((recurrence) => {
      const priced: Recurrence = { ...recurrence, amount: amountOf(recurrence) }
      return {
        recurrence,
        next: nextOccurrence(recurrence, now)?.date ?? null,
        monthly: monthlyEquivalent(priced),
        annual: annualCost(priced),
        priceChange: detectPriceChange(entries, recurrence.id),
        // `endedOn` est la dernière date couverte : `expandRecurrence` s'arrête
        // dessus, incluse. Un abonnement arrêté aujourd'hui n'a donc plus
        // d'échéance à venir — le compter encore actif jusqu'à demain laissait
        // « Arrêter » sans effet visible le jour même où on l'actionne.
        stopped: recurrence.endedOn !== undefined && recurrence.endedOn <= now,
      }
    })
    return rows.sort((a, b) => {
      if (a.next === null) return b.next === null ? 0 : 1
      if (b.next === null) return -1
      return a.next < b.next ? -1 : a.next > b.next ? 1 : 0
    })
  }, [recurrences, entries, amountOf])
}

/* --- Historique -----------------------------------------------------------*/

export function useTrailingMonths(count = 12): MonthPoint[] {
  const { entries } = useMonthScope()
  const month = useCurrentYm()
  return useMemo(() => trailingMonths(entries, month, count), [entries, month, count])
}

/** Bornes de navigation : on ne remonte pas avant la première donnée. */
/** Un abonnement et ses chiffres dérivés. `null` s'il n'existe pas (ou plus). */
export function useRecurrenceRow(id: string | undefined): RecurrenceRow | null {
  const rows = useRecurrenceRows()
  return useMemo(
    () => (id === undefined ? null : (rows.find((row) => row.recurrence.id === id) ?? null)),
    [rows, id],
  )
}

export function useMonthBounds(): { min: YearMonth; max: YearMonth } {
  const entries = useEntries()
  const months = useStore((s) => s.data.months)
  return useMemo(() => {
    const covered = coveredMonths({ entries, months })
    const now = today().slice(0, 7)
    const first = covered[0] ?? now
    const last = covered.at(-1) ?? now
    // Un mois d'avance est toujours accessible : c'est ce qui permet d'ouvrir
    // le mois suivant et d'y voir tomber les échéances.
    return {
      min: first < now ? first : now,
      max: addMonthsToYm(last > now ? last : now, 1),
    }
  }, [entries, months])
}

export function useHasAnyData(): boolean {
  const entries = useEntries()
  const recurrences = useRecurrences()
  return entries.length > 0 || recurrences.length > 0
}
