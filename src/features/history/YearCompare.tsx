import { useMemo, useState } from 'react'
import { CumulativeLines, type Serie } from '@/charts/CumulativeLines'
import { type YearPoint, coveredYears, hasDataInYear, yearSeries } from '@/domain/history'
import type { Money } from '@/domain/money'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useEntries, useMonthScope } from '@/store/selectors'
import { Eyebrow } from '@/ui/Eyebrow'
import { YearsIcon } from '@/ui/Icons'
import { Field, Select } from '@/ui/Field'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/**
 * Le cumul n'est tracé qu'entre le premier et le dernier mois portant des
 * données : un mois vide n'est pas un cumul plat, il n'est pas tracé du tout.
 */
function cumulative(points: readonly YearPoint[]): (number | null)[] {
  const first = points.findIndex((point) => point.hasData)
  if (first === -1) return points.map(() => null)
  let last = points.length - 1
  while (last > first && points[last]?.hasData !== true) last -= 1
  return points.map((point, index) => (index >= first && index <= last ? point.cumulative : null))
}

/** Cumul du solde mois après mois, année N contre année N−1. */
export function YearCompare() {
  const entries = useEntries()
  // Voir `MonthCompare` : la portée, pas le membre.
  const { entries: scoped } = useMonthScope()
  const currency = useCurrency()

  const years = useMemo(() => coveredYears(entries), [entries])
  const [year, setYear] = useState<number>(() => years.at(-1) ?? new Date().getFullYear())
  const previous = year - 1

  const current = useMemo(() => yearSeries(scoped, year), [scoped, year])
  const before = useMemo(() => yearSeries(scoped, previous), [scoped, previous])

  if (years.length === 0) {
    return (
      <Tile className="gap-3">
        <Eyebrow icon={YearsIcon}>{fr.history.years}</Eyebrow>
        <p className="t-label">{fr.history.yearsEmpty}</p>
      </Tile>
    )
  }

  const series: Serie[] = [
    {
      id: String(year),
      label: String(year),
      values: cumulative(current),
      color: 'var(--accent-2)',
    },
  ]
  if (hasDataInYear(entries, previous)) {
    series.push({
      id: String(previous),
      label: String(previous),
      values: cumulative(before),
      color: 'var(--text-muted)',
      dashed: true,
    })
  }

  const endOf = (points: typeof current): Money => points.at(-1)?.cumulative ?? (0 as Money)

  return (
    <Tile className="gap-4">
      <Eyebrow icon={YearsIcon}>{fr.history.years}</Eyebrow>

      <Field label={fr.history.year} className="max-w-40">
        {(id) => (
          <Select
            id={id}
            value={String(year)}
            onChange={(e) => {
              setYear(Number(e.target.value))
            }}
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <CumulativeLines
        series={series}
        label={fr.history.cumulative}
        srText={tpl(
          fr.history.srYears,
          year,
          previous,
          `${formatMoney(endOf(current), currency, false)} / ${formatMoney(endOf(before), currency, false)}`,
        )}
      />

      <ul className="flex flex-wrap gap-4">
        {series.map((serie) => (
          <li key={serie.id} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-6 rounded-chip"
              style={{
                backgroundColor: serie.color,
                opacity: serie.dashed === true ? 0.7 : 1,
              }}
            />
            <span className="t-label tnum">{serie.label}</span>
          </li>
        ))}
      </ul>

      <p className="t-label">{fr.history.cumulative}</p>
    </Tile>
  )
}
