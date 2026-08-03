import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MonthHeader } from '@/app/MonthHeader'
import { entryNewPath, entryPath } from '@/app/routes'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDate } from '@/i18n/format'
import { useCategoryMap, useMemberMap } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button, IconButton } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { Close, Plus } from '@/ui/Icons'
import { ListRow } from '@/ui/ListRow'
import { Tile } from '@/ui/Tile'
import { useHotkeys } from '@/ui/useHotkeys'
import { CalendarGrid } from './CalendarGrid'
import { useCalendarDays } from './useCalendarDays'

/** Les entrées du jour sélectionné. */
function DayPanel({
  entries,
  date,
  onOpen,
  onAdd,
  onClose,
}: {
  entries: Entry[]
  date: string
  onOpen: (e: Entry) => void
  onAdd: (direction: 'in' | 'out') => void
  onClose: () => void
}) {
  const categories = useCategoryMap()
  const members = useMemberMap()

  return (
    <Tile className="flex flex-col gap-3">
      {/* Le panneau se referme, et pas seulement en ouvrant un autre jour : la
          grille n'avait aucun geste pour revenir à la vue du mois. La croix
          double le re-clic sur la case, qui promet déjà la bascule par son
          `aria-pressed` — le geste naturel se découvre mal, la croix se voit. */}
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>{formatDate(date)}</Eyebrow>
        <IconButton label={fr.calendar.closeDay} onClick={onClose}>
          <Close size={18} />
        </IconButton>
      </div>
      {entries.length === 0 ? (
        <p className="t-label">{fr.calendar.emptyDay}</p>
      ) : (
        <ul className="flex flex-col">
          {entries.map((entry) => {
            const name = entry.memberId === undefined ? undefined : members.get(entry.memberId)?.name
            return (
              <li key={entry.id}>
                <ListRow
                  color={categories.get(entry.categoryId)?.color ?? 'var(--cat-rest)'}
                  label={entry.label}
                  {...(name === undefined ? {} : { meta: name })}
                  planned={entry.status === 'planned'}
                  trailing={<Amount value={entry.amount} direction={entry.direction} />}
                  onClick={() => { onOpen(entry) }}
                />
              </li>
            )
          })}
        </ul>
      )}
      {/* Le jour choisi est déjà la réponse à « quelle date ? » : la saisie
          s'ouvre dessus plutôt que de la redemander. Et le sens se choisit
          ici, pas dans un formulaire intitulé « dépense ». */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onAdd('out')
          }}
        >
          <Plus size={16} />
          {fr.entry.newOut}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onAdd('in')
          }}
        >
          <Plus size={16} />
          {fr.entry.newIn}
        </Button>
      </div>
    </Tile>
  )
}

export function CalendarPage() {
  const month = useCalendarDays()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)

  const create = (direction: 'in' | 'out', date?: string): void => {
    void navigate(entryNewPath(date === undefined ? { direction } : { direction, date }))
  }

  const hasAny = month.days.some((day) => day.entries.length > 0)
  // La sélection est dérivée, pas synchronisée : un jour d'un autre mois ne se
  // retrouve simplement pas dans la grille, sans effet ni remise à zéro.
  const day = month.days.find((d) => d.date === selected)

  /* Une bascule, pas une affectation : la case porte `aria-pressed`, elle doit
     donc se relâcher. Sans ça, un jour ouvert ne se refermait jamais — on ne
     pouvait qu'en ouvrir un autre, et la vue du mois seule était perdue. */
  const toggle = (date: string): void => {
    setSelected((current) => (current === date ? null : date))
  }

  /* Le panneau du jour n'est pas une feuille — il s'ouvre sous la grille, sans
     couche par-dessus —, donc rien ne lui donnait la touche que `<dialog>`
     offre gratuitement à toutes les autres. C'est pourtant le même geste :
     refermer ce qu'on vient d'ouvrir. Le raccourci ne fait rien quand aucun
     jour n'est ouvert, plutôt que d'être posé sous condition — un écouteur qui
     apparaît et disparaît sous les doigts se comporte moins bien. */
  useHotkeys({
    Escape: () => {
      setSelected(null)
    },
  })

  return (
    <>
      <MonthHeader />
      <div className="flex max-w-2xl flex-col gap-4">
        {/* Pleine largeur sous 404px, cadre annulé : c'est la seule façon de
            tenir la case de 44px du DS §8 sur un téléphone — le calcul est dans
            `CalendarGrid`. Au-dessus du seuil, la tuile est une tuile. */}
        <Tile className="max-[404px]:-mx-4 max-[404px]:rounded-none max-[404px]:border-x-0 max-[404px]:p-1">
          <CalendarGrid month={month} selected={day?.date ?? null} onSelect={toggle} />
        </Tile>

        {day !== undefined ? (
          <DayPanel
            entries={day.entries}
            date={day.date}
            onOpen={(entry) => {
              void navigate(entryPath(entry.id))
            }}
            onAdd={(direction) => {
              create(direction, day.date)
            }}
            onClose={() => {
              setSelected(null)
            }}
          />
        ) : (
          // L'invitation portait une action — « ouvre le mois » — que cet écran
          // n'offre pas. Elle porte maintenant celle qu'il sait faire.
          !hasAny && (
            <EmptyState message={fr.calendar.empty}>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  onClick={() => {
                    create('out')
                  }}
                >
                  {fr.entry.addOut}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    create('in')
                  }}
                >
                  {fr.entry.addIn}
                </Button>
              </div>
            </EmptyState>
          )
        )}
      </div>
    </>
  )
}
