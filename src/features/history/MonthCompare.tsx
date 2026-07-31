import { useMemo, useState } from 'react'
import { type YearMonth, addMonthsToYm } from '@/domain/date'
import { compareMonths } from '@/domain/history'
import { coveredMonths } from '@/domain/month'
import { fr } from '@/i18n/fr'
import { formatDelta, formatYearMonth } from '@/i18n/format'
import { useCategoryMap, useEntries, useMemberFilter } from '@/store/selectors'
import { useStore } from '@/store/store'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { CompareIcon } from '@/ui/Icons'
import { Dot } from '@/ui/Dot'
import { Field, Select } from '@/ui/Field'
import { Tile } from '@/ui/Tile'

function MonthSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: YearMonth
  options: YearMonth[]
  onChange: (next: YearMonth) => void
}) {
  return (
    <Field label={label} className="flex-1">
      {(id) => (
        <Select
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
        >
          {options.map((month) => (
            <option key={month} value={month}>
              {formatYearMonth(month)}
            </option>
          ))}
        </Select>
      )}
    </Field>
  )
}

/** Écart par catégorie entre deux mois, en valeur et en pourcentage. */
export function MonthCompare() {
  const entries = useEntries()
  const months = useStore((s) => s.data.months)
  const categories = useCategoryMap()
  const member = useMemberFilter()

  const available = useMemo(() => coveredMonths({ entries, months }), [entries, months])
  const last = available.at(-1) ?? ''
  const [right, setRight] = useState<YearMonth>(last)
  const [left, setLeft] = useState<YearMonth>(
    () => available.at(-2) ?? addMonthsToYm(last, -1),
  )

  const deltas = useMemo(
    () => compareMonths(entries, left, right, 'out', member),
    [entries, left, right, member],
  )

  if (available.length < 2) {
    return (
      <Tile className="gap-3">
        <Eyebrow icon={CompareIcon}>{fr.history.compare}</Eyebrow>
        <p className="t-label">{fr.history.compareSingleMonth}</p>
      </Tile>
    )
  }

  return (
    <Tile className="gap-4">
      <Eyebrow icon={CompareIcon}>{fr.history.compare}</Eyebrow>

      <div className="flex flex-wrap gap-3">
        <MonthSelect
          label={fr.history.compareLeft}
          value={left}
          options={available}
          onChange={setLeft}
        />
        <MonthSelect
          label={fr.history.compareRight}
          value={right}
          options={available}
          onChange={setRight}
        />
      </div>

      {deltas.length === 0 ? (
        <p className="t-label">{fr.history.compareEmpty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {deltas.map((delta) => (
            <li key={delta.categoryId} className="flex items-center gap-3 py-2">
              <Dot color={categories.get(delta.categoryId)?.color ?? 'var(--cat-rest)'} />
              <span className="t-body min-w-0 flex-1 truncate">
                {categories.get(delta.categoryId)?.label ?? fr.common.other}
              </span>
              <span className="flex shrink-0 flex-col items-end">
                <Amount
                  value={delta.delta}
                  size="label"
                  signed
                  tone={delta.delta > 0 ? 'danger' : 'default'}
                />
                <span className="t-axis tnum">{formatDelta(delta.deltaRatio)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  )
}
