import { useRef } from 'react'
import { type YearMonth, addMonthsToYm, parseYm } from '@/domain/date'
import { monthName } from '@/i18n/format'
import { fr } from '@/i18n/fr'
import { cn } from '@/lib/cn'
import { IconButton } from './Button'
import { ChevronLeft, ChevronRight } from './Icons'

export type MonthNavProps = {
  value: YearMonth
  onChange: (next: YearMonth) => void
  /** Bornes incluses. Au-delà, le chevron correspondant est désactivé. */
  min?: YearMonth
  max?: YearMonth
  className?: string
}

const SWIPE_THRESHOLD = 48

/** Chevrons de part et d'autre du mois, année en mono dessous. DS §6. */
export function MonthNav({ value, onChange, min, max, className }: MonthNavProps) {
  const { y, m } = parseYm(value)
  const previous = addMonthsToYm(value, -1)
  const next = addMonthsToYm(value, 1)
  const canGoBack = min === undefined || previous >= min
  const canGoForward = max === undefined || next <= max

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (event: React.TouchEvent) => {
    const point = event.touches[0]
    touchStart.current = point ? { x: point.clientX, y: point.clientY } : null
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current
    const point = event.changedTouches[0]
    touchStart.current = null
    if (!start || !point) return
    const dx = point.clientX - start.x
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(point.clientY - start.y)) return
    if (dx > 0 && canGoBack) onChange(previous)
    if (dx < 0 && canGoForward) onChange(next)
  }

  return (
    <div
      className={cn('flex items-center justify-between gap-2 select-none', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <IconButton
        label={fr.a11y.previousMonth}
        disabled={!canGoBack}
        onClick={() => {
          onChange(previous)
        }}
      >
        <ChevronLeft />
      </IconButton>

      <div className="flex flex-col items-center" aria-live="polite">
        <span className="t-section">{monthName(m)}</span>
        <span className="t-axis tnum">{y}</span>
      </div>

      <IconButton
        label={fr.a11y.nextMonth}
        disabled={!canGoForward}
        onClick={() => {
          onChange(next)
        }}
      >
        <ChevronRight />
      </IconButton>
    </div>
  )
}
