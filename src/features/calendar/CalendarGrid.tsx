import { today } from '@/domain/date'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDate, tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import { useCategoryMap } from '@/store/selectors'
import { Dot } from '@/ui/Dot'
import type { CalendarDay, CalendarMonth } from './useCalendarDays'

const MAX_DOTS = 4

function countLabel(count: number): string {
  if (count === 0) return fr.calendar.noEntry
  if (count === 1) return fr.calendar.oneEntry
  return tpl(fr.calendar.someEntries, count)
}

/** Une pastille par échéance, couleur de la catégorie, atténuée si prévue. */
function Dots({ entries, colorOf }: { entries: Entry[]; colorOf: (id: string) => string }) {
  const shown = entries.slice(0, MAX_DOTS)
  const rest = entries.length - shown.length
  return (
    <span className="flex min-h-3 flex-wrap items-center justify-center gap-1">
      {shown.map((entry) => (
        <Dot
          key={entry.id}
          color={colorOf(entry.categoryId)}
          outlined={entry.status === 'planned'}
          size={7}
        />
      ))}
      {rest > 0 && <span className="t-axis leading-none">{tpl(fr.calendar.more, rest)}</span>}
    </span>
  )
}

function Cell({
  day,
  selected,
  isToday,
  colorOf,
  onSelect,
}: {
  day: CalendarDay
  selected: boolean
  isToday: boolean
  colorOf: (id: string) => string
  onSelect: (date: string) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={tpl(fr.calendar.dayLabel, formatDate(day.date), countLabel(day.entries.length))}
      onClick={() => {
        onSelect(day.date)
      }}
      className={cn(
        // Hauteur explicite plutôt qu'aspect-square : un élément de grille est
        // étiré par sa rangée, si bien qu'un ratio dicterait la hauteur de toute
        // la ligne et qu'un max-height ne la ramènerait jamais.
        'flex h-14 flex-col items-center justify-center gap-1 rounded-inner p-1 md:h-16',
        'transition-colors duration-[var(--dur)] ease-ds',
        selected ? 'bg-accent text-accent-fg' : 'hover:bg-surface-2',
        isToday && !selected && 'ring-1 ring-border ring-inset',
      )}
    >
      <span className={cn('t-body tnum leading-none', isToday && 'font-semibold')}>{day.day}</span>
      <Dots entries={day.entries} colorOf={colorOf} />
    </button>
  )
}

export function CalendarGrid({
  month,
  selected,
  onSelect,
}: {
  month: CalendarMonth
  selected: string | null
  onSelect: (date: string) => void
}) {
  const categories = useCategoryMap()
  const colorOf = (id: string): string => categories.get(id)?.color ?? 'var(--cat-rest)'
  const now = today()

  return (
    /* Sept colonnes de 44px demandent 308px, et le cadre de la page (16px), celui
       de la tuile (20px) et les six gouttières (4px) en prennent 96 de plus : en
       dessous de 404px de fenêtre, la case tombe à 32px de large — la moitié des
       téléphones en portrait, pour une cible que le DS §8 fixe à 44px partout.

       La grille passe donc à bord perdu sous ce seuil et abandonne ses
       gouttières : le motif est celui du bandeau du mois, et il rend 312px pour
       sept cases, soit 44,5px. Le jour choisi se distingue à son fond arrondi,
       jamais à la gouttière — c'est elle qu'on sacrifie, pas la cible.

       Le bord perdu est posé sur la tuile et non ici : c'est son cadre qu'il
       faut reprendre autant que celui de la page, et une grille qui sortirait
       seule de la tuile laisserait ses cases hors de la surface.

       Les deux rangées portent la même gouttière : sans quoi le nom du jour
       cesse de tomber au-dessus de sa colonne dès que la grille en a une. */
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1 max-[404px]:gap-0">
        {fr.calendarNames.weekdaysNarrow.map((label, index) => (
          <span
            key={`${label}-${String(index)}`}
            className="t-axis text-center"
            aria-hidden="true"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 max-[404px]:gap-0">
        {Array.from({ length: month.leading }, (_, i) => (
          <span key={`vide-${String(i)}`} aria-hidden="true" />
        ))}
        {month.days.map((day) => (
          <Cell
            key={day.date}
            day={day}
            selected={selected === day.date}
            isToday={day.date === now}
            colorOf={colorOf}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
