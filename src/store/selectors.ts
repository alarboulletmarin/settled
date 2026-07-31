/* ============================================================================
 * Sélecteurs — le seul chemin par lequel un composant lit une statistique.
 *
 * Chaque hook lit des tranches stables du store puis dérive avec useMemo :
 * un sélecteur zustand qui renverrait un objet neuf à chaque rendu relancerait
 * le rendu en boucle.
 * ==========================================================================*/

import { useMemo } from 'react'
import { type ISODate, type YearMonth, addMonthsToYm, today } from '@/domain/date'
import { type MonthPoint, trailingMonths } from '@/domain/history'
import { coveredMonths, lastConfirmedAmount } from '@/domain/month'
import type { Money } from '@/domain/money'
import { type PriceChange, detectPriceChange } from '@/domain/priceHistory'
import { annualCost, monthlyEquivalent, nextOccurrence } from '@/domain/recurrence'
import {
  type CategorySlice,
  type DayTotals,
  type MonthTotals,
  type SubscriptionTotals,
  type Upcoming,
  breakdownByCategory,
  dailyBreakdown,
  entriesOfMonth,
  monthProgress,
  monthTotals,
  restToLive,
  subscriptionTotals,
  upcomingEntries,
} from '@/domain/stats'
import type { Category, Entry, Member, Recurrence } from '@/domain/types'
import { useStore } from './store'

/* --- Tranches brutes ------------------------------------------------------*/

export const useEntries = (): Entry[] => useStore((s) => s.data.entries)
export const useRecurrences = (): Recurrence[] => useStore((s) => s.data.recurrences)
export const useCategories = (): Category[] => useStore((s) => s.data.categories)
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

export function useMonthEntries(ym?: YearMonth): Entry[] {
  const entries = useEntries()
  const current = useCurrentYm()
  const member = useMemberFilter()
  const month = ym ?? current
  return useMemo(() => entriesOfMonth(entries, month, member), [entries, month, member])
}

export function useMonthTotals(ym?: YearMonth): MonthTotals {
  const entries = useEntries()
  const current = useCurrentYm()
  const member = useMemberFilter()
  const month = ym ?? current
  return useMemo(() => monthTotals(entries, month, member), [entries, month, member])
}

export function useRestToLive(): Money {
  const entries = useEntries()
  const month = useCurrentYm()
  const member = useMemberFilter()
  return useMemo(() => restToLive(entries, month, today(), member), [entries, month, member])
}

export function useCategoryBreakdown(direction: 'in' | 'out' = 'out'): CategorySlice[] {
  const entries = useEntries()
  const month = useCurrentYm()
  const member = useMemberFilter()
  return useMemo(
    () => breakdownByCategory(entries, month, direction, member),
    [entries, month, direction, member],
  )
}

export function useDailyBreakdown(direction: 'in' | 'out' = 'out'): DayTotals[] {
  const entries = useEntries()
  const month = useCurrentYm()
  const member = useMemberFilter()
  return useMemo(
    () => dailyBreakdown(entries, month, direction, member),
    [entries, month, direction, member],
  )
}

export function useUpcoming(limit = 5): Upcoming[] {
  const entries = useEntries()
  const member = useMemberFilter()
  return useMemo(() => upcomingEntries(entries, today(), limit, member), [entries, limit, member])
}

export function useMonthProgress(): number {
  const month = useCurrentYm()
  return useMemo(() => monthProgress(month, today()), [month])
}

/* --- Abonnements ----------------------------------------------------------*/

export function useSubscriptionTotals(): SubscriptionTotals {
  const recurrences = useRecurrences()
  const entries = useEntries()
  return useMemo(() => {
    const now = today()
    return subscriptionTotals(
      recurrences,
      (recurrence) => lastConfirmedAmount(entries, recurrence.id, now),
      now,
    )
  }, [recurrences, entries])
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
  return useMemo(() => {
    const now = today()
    const rows = recurrences.map((recurrence) => {
      const resolved =
        recurrence.amount ?? lastConfirmedAmount(entries, recurrence.id, now)
      const priced: Recurrence = { ...recurrence, amount: resolved }
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
  }, [recurrences, entries])
}

/* --- Historique -----------------------------------------------------------*/

export function useTrailingMonths(count = 12): MonthPoint[] {
  const entries = useEntries()
  const month = useCurrentYm()
  const member = useMemberFilter()
  return useMemo(() => trailingMonths(entries, month, count, member), [entries, month, count, member])
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
