import { cn } from '@/lib/cn'

export type SegmentedOption<T extends string> = { value: T; label: string }

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (next: T) => void
  label: string
  className?: string
}

/**
 * Bascule à quelques positions — sens d'un flux, choix de thème, axe de
 * regroupement.
 *
 * Elle passe à la ligne plutôt que de déborder : trois positions aux libellés
 * un peu longs frôlent déjà la largeur d'une tuile sur un écran de 320px, et la
 * dernière sortait du cadre. Un débordement horizontal aurait rogné le focus
 * clavier, dont l'`outline-offset` mord de deux pixels hors du bouton.
 *
 * La rangée de filtres du mois, elle, défile (`.filter-scroller`) — ce n'est pas
 * une contradiction. Elle vit à bord perdu dans un bandeau, où une piste peut se
 * donner les quatre pixels de cadre qui logent l'anneau ; une bascule vit dans
 * une tuile, dont la largeur est le cadre lui-même. Et son nombre de positions
 * est connu d'avance, quand la rangée de filtres compte autant de pilules que le
 * foyer a de membres.
 */
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
      className={cn('inline-flex max-w-full flex-wrap gap-1 rounded-chip bg-surface-2 p-1', className)}
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
              'min-h-11 rounded-chip px-3.5 text-[13px] font-medium',
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
