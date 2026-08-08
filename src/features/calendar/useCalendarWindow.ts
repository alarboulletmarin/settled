import { useMemo } from 'react'
import type { ISODate } from '@/domain/date'
import type { Entry } from '@/domain/types'
import { useCurrentYm, useRangeEntries } from '@/store/selectors'
import { type GridCell, compareForDay, gridRange, monthGrid } from './grid'

export type CalendarWindow = {
  cells: GridCell[]
  /** Les échéances de chaque jour, déjà triées. Absent = jour vide. */
  byDate: ReadonlyMap<ISODate, Entry[]>
}

/* Une seule instance pour les quarante-deux cases vides : `?? []` en allouerait
   autant de tableaux neufs à chaque rendu, tous identiques et tous jetés. */
const EMPTY: readonly Entry[] = []

/** Les échéances d'un jour de la fenêtre, dans l'ordre des pastilles. */
export function entriesOn(window: CalendarWindow, date: ISODate): readonly Entry[] {
  return window.byDate.get(date) ?? EMPTY
}

/**
 * La fenêtre affichée, et ce qui tombe dedans.
 *
 * L'adaptateur entre le store et `grid.ts` : le seul module qui connaisse à la
 * fois la fenêtre de six semaines et l'endroit où vivent les échéances. C'est
 * aussi pourquoi il ne rejoint pas `grid.ts` — `useMemo` et `useStore` y
 * feraient entrer React, et il faudrait alors monter un store pour vérifier
 * qu'un mois fait quarante-deux cases.
 */
export function useCalendarWindow(): CalendarWindow {
  const ym = useCurrentYm()
  const { from, to } = useMemo(() => gridRange(ym), [ym])
  const entries = useRangeEntries(from, to)

  return useMemo(() => {
    /* Une seule passe sur les échéances, et non un `filter` par case : la
       seconde forme balaierait le mois quarante-deux fois par rendu, pour le
       même résultat. Le tri se fait ici, une fois par jour peuplé, plutôt qu'au
       rendu — les pastilles de la case et la liste de la feuille se retrouvent
       ordonnées pareil sans que rien ne l'ait demandé. */
    const byDate = new Map<ISODate, Entry[]>()
    for (const entry of entries) {
      const bucket = byDate.get(entry.date)
      if (bucket === undefined) byDate.set(entry.date, [entry])
      else bucket.push(entry)
    }
    for (const bucket of byDate.values()) bucket.sort(compareForDay)

    return { cells: monthGrid(ym), byDate }
  }, [ym, entries])
}
