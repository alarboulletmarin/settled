import { useMemo } from 'react'
import { type ISODate, dayOfWeek, daysOfMonth, startOfMonth } from '@/domain/date'
import type { Entry } from '@/domain/types'
import { useCurrentYm, useMonthEntries } from '@/store/selectors'

export type CalendarDay = {
  date: ISODate
  day: number
  entries: Entry[]
}

export type CalendarMonth = {
  /** Cases vides avant le 1er, pour que la semaine commence un lundi. */
  leading: number
  days: CalendarDay[]
}

/** Le mois affiché, découpé en jours, chacun portant ses échéances. */
export function useCalendarDays(): CalendarMonth {
  const ym = useCurrentYm()
  const entries = useMonthEntries()

  return useMemo(() => {
    const byDate = new Map<ISODate, Entry[]>()
    for (const entry of entries) {
      const bucket = byDate.get(entry.date) ?? []
      bucket.push(entry)
      byDate.set(entry.date, bucket)
    }
    return {
      leading: dayOfWeek(startOfMonth(ym)) - 1,
      days: daysOfMonth(ym).map((date, index) => ({
        date,
        day: index + 1,
        entries: byDate.get(date) ?? [],
      })),
    }
  }, [ym, entries])
}
