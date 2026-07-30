import { cn } from '@/lib/cn'

export type SegmentedOption<T extends string> = { value: T; label: string }

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (next: T) => void
  label: string
  className?: string
}

/** Bascule à deux ou trois positions — sens d'un flux, choix de thème. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex gap-1 rounded-chip bg-surface-2 p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              onChange(option.value)
            }}
            className={cn(
              'min-h-9 rounded-chip px-3.5 text-[13px] font-medium',
              'transition-colors duration-[var(--dur)] ease-ds',
              active ? 'bg-accent text-accent-fg' : 'text-muted hover:text-text',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
