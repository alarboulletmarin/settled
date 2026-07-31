import { useState } from 'react'
import { type Money, parseAmount, toAmountInput } from '@/domain/money'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDateCompact, tpl } from '@/i18n/format'
import { confirmEntries, confirmEntry } from '@/store/actions'
import { useCategoryMap, useMonthPending } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { AmountInput } from '@/ui/Field'
import { Check, ToConfirmIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'

function useColor(): (categoryId: string) => string {
  const categories = useCategoryMap()
  return (categoryId) => categories.get(categoryId)?.color ?? 'var(--cat-rest)'
}

/** Une échéance à montant fixe : elle se confirme telle quelle. */
function FixedRow({ entry, color }: { entry: Entry; color: string }) {
  return (
    <li className="flex h-14 items-center gap-3 px-1">
      <Dot color={color} outlined />
      <span className="flex min-w-0 flex-col">
        <span className="t-body truncate">{entry.label}</span>
        <span className="t-axis">{formatDateCompact(entry.date)}</span>
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        <Amount value={entry.amount} direction={entry.direction} />
        <Button
          size="sm"
          onClick={() => {
            confirmEntry(entry.id)
            toast(fr.month.confirmedOne)
          }}
        >
          <Check size={16} />
          <span className="sr-only">{fr.month.confirmOne}</span>
        </Button>
      </span>
    </li>
  )
}

/** Une échéance à montant variable : le montant est saisi avant confirmation. */
function VariableRow({ entry, color }: { entry: Entry; color: string }) {
  const [text, setText] = useState(() => toAmountInput(entry.amount))
  const parsed: Money | null = parseAmount(text)

  return (
    <li className="flex flex-wrap items-center gap-3 px-1 py-2">
      <Dot color={color} outlined />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="t-body truncate">{entry.label}</span>
        <span className="t-axis">{formatDateCompact(entry.date)}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <AmountInput
          value={text}
          aria-label={`${fr.entry.amount} — ${entry.label}`}
          className="w-28"
          onChange={(e) => {
            setText(e.target.value)
          }}
        />
        <Button
          size="sm"
          disabled={parsed === null}
          onClick={() => {
            if (parsed === null) return
            confirmEntry(entry.id, parsed)
            toast(fr.month.confirmedOne)
          }}
        >
          <Check size={16} />
          <span className="sr-only">{fr.month.confirmOne}</span>
        </Button>
      </span>
    </li>
  )
}

/** Les échéances prévues du mois : confirmation à l'unité ou en bloc. */
export function PendingSection() {
  const { fixed, variable } = useMonthPending()
  const colorOf = useColor()
  if (fixed.length === 0 && variable.length === 0) return null

  const confirmAll = (): void => {
    confirmEntries(fixed.map((e) => e.id))
    toast(fr.month.confirmedAll)
  }

  return (
    <Tile className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow icon={ToConfirmIcon}>
          {tpl(`${fr.month.toConfirm} · %s`, fixed.length + variable.length)}
        </Eyebrow>
        {fixed.length > 0 && <Button onClick={confirmAll}>{fr.month.confirmAll}</Button>}
      </div>

      {fixed.length > 0 && (
        <ul className="flex flex-col">
          {fixed.map((entry) => (
            <FixedRow key={entry.id} entry={entry} color={colorOf(entry.categoryId)} />
          ))}
        </ul>
      )}

      {variable.length > 0 && (
        <div className="flex flex-col gap-2 rounded-inner bg-surface-2 p-3">
          <Eyebrow>{fr.month.variableTitle}</Eyebrow>
          <p className="t-label">{fr.month.variableHint}</p>
          <ul className="flex flex-col">
            {variable.map((entry) => (
              <VariableRow key={entry.id} entry={entry} color={colorOf(entry.categoryId)} />
            ))}
          </ul>
        </div>
      )}
    </Tile>
  )
}
