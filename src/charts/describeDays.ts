import { parseISO } from '@/domain/date'
import type { DayTotals } from '@/domain/stats'

/** Lecture textuelle du graphique : les trois jours les plus dépensiers. */
export function describeDays(days: readonly DayTotals[], format: (cents: number) => string): string {
  const spent = days.filter((day) => day.total > 0)
  if (spent.length === 0) return ''
  const top = [...spent].sort((a, b) => b.total - a.total).slice(0, 3)
  return top.map((day) => `${String(parseISO(day.date).d)} : ${format(day.total)}`).join(', ')
}
