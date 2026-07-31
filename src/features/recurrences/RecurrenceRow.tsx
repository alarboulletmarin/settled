import { diffDays, today } from '@/domain/date'
import { isCostly } from '@/domain/priceHistory'
import { fr } from '@/i18n/fr'
import { formatDayMonthShort, formatMoney, formatRelativeDays, tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import type { RecurrenceRow as Row } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Dot } from '@/ui/Dot'
import { Warning } from '@/ui/Icons'
import { useCurrency } from '@/ui/currency'

function meta(row: Row): string {
  if (row.stopped) return fr.recurrences.stoppedBadge
  if (row.next === null) return fr.recurrences.noNextDue
  return `${formatDayMonthShort(row.next)} · ${formatRelativeDays(diffDays(today(), row.next))}`
}

/**
 * Une ligne d'abonnement : prochaine échéance à gauche, coût mensuel amorti à
 * droite, coût annuel en seconde lecture. Un changement de prix se signale ici.
 */
export function RecurrenceRow({
  row,
  color,
  onOpen,
}: {
  row: Row
  color: string
  onOpen: () => void
}) {
  const currency = useCurrency()
  const { recurrence, monthly, annual, priceChange, stopped } = row

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 rounded-inner px-3 py-2.5 text-left',
        'transition-colors duration-[var(--dur)] ease-ds hover:bg-surface-2',
      )}
    >
      <Dot color={color} outlined={stopped} />

      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('t-body truncate', stopped && 'text-muted')}>{recurrence.label}</span>
        <span className="t-axis truncate">{meta(row)}</span>
        {priceChange !== null && (
          /* L'alerte ne se déclenche que quand le changement coûte : une charge
             qui monte, un revenu qui baisse. Un salaire augmenté en rouge avec
             un panneau d'avertissement dirait le contraire de ce qui arrive —
             et le DS §2.3 réserve le rouge aux dépassements et aux erreurs. */
          <span
            className={cn(
              't-label mt-0.5 flex items-center gap-1',
              isCostly(priceChange, recurrence.direction) && 'text-danger-text',
            )}
          >
            {isCostly(priceChange, recurrence.direction) && (
              <Warning size={14} className="shrink-0" />
            )}
            <span className="tnum truncate">
              {tpl(
                fr.recurrences.priceChanged,
                formatMoney(priceChange.previous, currency),
                formatMoney(priceChange.current, currency),
              )}
            </span>
          </span>
        )}
      </span>

      <span className="flex shrink-0 flex-col items-end">
        {monthly === null ? (
          <span className="t-label">{fr.recurrences.variable}</span>
        ) : (
          <>
            <Amount value={monthly} direction={recurrence.direction} />
            {annual !== null && (
              <span className="t-axis tnum">
                {tpl(fr.recurrences.perYear, formatMoney(annual, currency, false))}
              </span>
            )}
          </>
        )}
      </span>
    </button>
  )
}
