import { type KeyboardEvent, useEffect, useId, useRef } from 'react'
import type { ISODate, YearMonth } from '@/domain/date'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatWeekdayDate, formatYearMonth, de, tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import { useCategoryMap } from '@/store/selectors'
import { Dot } from '@/ui/Dot'
import { type GridCell, density, keyboardMove, weekdays } from './grid'
import { type CalendarWindow, entriesOn } from './useCalendarWindow'

function countLabel(count: number): string {
  if (count === 0) return fr.calendar.noEntry
  if (count === 1) return fr.calendar.oneEntry
  return tpl(fr.calendar.someEntries, count)
}

/**
 * Le nom d'une case, qui dit tout ce que la case montre.
 *
 * Les pastilles sont `aria-hidden` et le « +N » aussi : une couleur et un
 * compte muet ne portent l'information qu'à la vue, ce que le DS §8 refuse. Le
 * cadre d'aujourd'hui et le chiffre atténué d'un voisin sont dans le même cas,
 * d'où les deux mentions ajoutées à la fin.
 */
function cellLabel(cell: GridCell, count: number, isToday: boolean): string {
  return [
    tpl(fr.calendar.dayLabel, formatWeekdayDate(cell.date), countLabel(count)),
    isToday ? fr.calendar.dayToday : '',
    cell.inMonth ? '' : fr.calendar.dayOutside,
  ]
    .filter((part) => part !== '')
    .join(fr.calendar.labelJoin)
}

/** Une pastille par échéance, couleur de la catégorie, en pointillés si prévue. */
function Dots({ entries, colorOf }: { entries: readonly Entry[]; colorOf: (id: string) => string }) {
  const { shown, rest } = density(entries.length)
  return (
    <>
      <span aria-hidden="true" className="flex min-h-1.5 items-center justify-center gap-0.5">
        {entries.slice(0, shown).map((entry) => (
          <Dot
            key={entry.id}
            color={colorOf(entry.categoryId)}
            outlined={entry.status === 'planned'}
            size={6}
          />
        ))}
      </span>
      {/* La seconde ligne est réservée même vide : sans elle, une case qui gagne
          une cinquième échéance grandit et pousse toute sa rangée — et le carré
          demande que les quarante-deux cases portent exactement la même pile. */}
      <span aria-hidden="true" className="t-axis min-h-3 leading-none">
        {rest > 0 ? tpl(fr.calendar.more, rest) : ''}
      </span>
    </>
  )
}

function Cell({
  cell,
  entries,
  colorOf,
  opened,
  isToday,
  anchored,
  onOpen,
  register,
}: {
  cell: GridCell
  entries: readonly Entry[]
  colorOf: (id: string) => string
  opened: boolean
  isToday: boolean
  anchored: boolean
  onOpen: (date: ISODate) => void
  register: (date: ISODate, node: HTMLButtonElement | null) => void
}) {
  return (
    <button
      type="button"
      ref={(node) => {
        register(cell.date, node)
      }}
      /* Un seul arrêt de tabulation pour quarante-deux cases, comme le curseur
         des graphiques : les flèches déplacent le focus, Tab traverse la
         grille. Sans ça, atteindre le panneau du jour demandait quarante-deux
         tabulations. */
      tabIndex={anchored ? 0 : -1}
      /* Et non `aria-pressed` : la case n'est plus une bascule depuis que le
         jour s'ouvre en feuille — une modale couvre la grille, on ne peut donc
         pas re-toucher la case pour la relâcher. Elle ouvre quelque chose, elle
         le dit. */
      aria-haspopup="dialog"
      aria-label={cellLabel(cell, entries.length, isToday)}
      onClick={() => {
        onOpen(cell.date)
      }}
      className={cn(
        // Plancher de 44px (DS §8) plutôt qu'une hauteur fixe : c'est la cible
        // qui commande, et la case grandit si son contenu le demande.
        'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-inner p-1',
        // Le carré n'entre en jeu qu'au-dessus de 448px, où la colonne dépasse
        // enfin la hauteur de la pile (chiffre 20 + pastilles 6 + « +N » 12 +
        // gouttières et cadre = 50px). En dessous, un ratio ne changerait rien :
        // la taille minimale du contenu gagne, ce qui est bien ce qu'on veut.
        'min-[448px]:aspect-square',
        'transition-colors duration-[var(--dur)] ease-ds hover:bg-surface-2',
      )}
    >
      {/* Deux formes sur la même pilule, jamais deux teintes (DS §8) :
          aujourd'hui la porte en contour, le jour ouvert en remplissage. Le
          pixel de cadre est réservé d'avance et transparent, faute de quoi le
          chiffre se décalerait d'un pixel en devenant l'un ou l'autre.

          Le remplissage était sur la case entière, et `--cat-1` EST le lime :
          la pastille d'une catégorie 1 disparaissait purement sur le jour qu'on
          venait d'ouvrir. Il tient maintenant dans le chiffre, comme l'onglet
          actif de la barre de navigation — et les pastilles restent sur la
          surface de la tuile, quoi qu'il arrive. */}
      <span
        className={cn(
          'flex h-5 min-w-5 items-center justify-center rounded-chip border px-1',
          't-body tnum leading-none',
          isToday && 'font-semibold',
          opened
            ? 'border-accent bg-accent text-accent-fg'
            : cn(
                isToday ? 'border-muted' : 'border-transparent',
                /* Un jour voisin n'est pas un jour éteint : ses échéances
                   existent, c'est son quantième qui n'appartient pas au mois
                   qu'on lit. C'est donc le chiffre qui s'atténue, jamais la
                   donnée — et le nom accessible le dit en toutes lettres.

                   Les deux signaux se composent plutôt que de s'exclure :
                   regarder juillet le 7 août montre un chiffre atténué dans
                   son contour, ce qui est exactement ce qu'il est — un jour
                   voisin, et aujourd'hui. */
                !cell.inMonth && 'text-muted',
              ),
        )}
      >
        {cell.day}
      </span>
      <Dots entries={entries} colorOf={colorOf} />
    </button>
  )
}

export type CalendarGridProps = {
  month: YearMonth
  window: CalendarWindow
  /** Le jour ouvert, ou `null`. */
  opened: ISODate | null
  /** Le jour qui porte l'arrêt de tabulation. */
  anchor: ISODate
  onAnchor: (date: ISODate, paging: boolean) => void
  onOpen: (date: ISODate) => void
  /** Vrai si la date est atteignable — hors bornes, la case ne promet rien. */
  reachable: (date: ISODate) => boolean
  /**
   * Le jour à refocaliser après le rendu.
   *
   * Un objet neuf à chaque demande, et non la date seule : redemander deux fois
   * le même jour est un cas courant — refermer la feuille rend le focus à la
   * case qu'on vient de quitter — et une dépendance sur la chaîne ne verrait
   * pas la seconde demande.
   */
  focusOn: { date: ISODate } | null
  today: ISODate
}

export function CalendarGrid({
  month,
  window: grid,
  opened,
  anchor,
  onAnchor,
  onOpen,
  reachable,
  focusOn,
  today,
}: CalendarGridProps) {
  const categories = useCategoryMap()
  const colorOf = (id: string): string => categories.get(id)?.color ?? 'var(--cat-rest)'
  const hintId = useId()
  const cells = useRef(new Map<ISODate, HTMLButtonElement>())

  const register = (date: ISODate, node: HTMLButtonElement | null): void => {
    if (node === null) cells.current.delete(date)
    else cells.current.set(date, node)
  }

  /* Le focus est reposé après le rendu, et pas dans le gestionnaire de touche :
     une flèche qui sort de la fenêtre change de mois, et le bouton d'origine
     est démonté avant qu'un `.focus()` synchrone puisse l'atteindre. L'effet
     sans dépendances part à chaque rendu, ce qui est exactement ce qu'on veut —
     il ne fait que servir une demande en attente. */
  useEffect(() => {
    if (focusOn === null) return
    cells.current.get(focusOn.date)?.focus()
  }, [focusOn])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // Les mêmes modificateurs que `useHotkeys` : ⌘← remonte dans l'historique
    // du navigateur, ce geste-là ne nous appartient pas.
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const move = keyboardMove(event.key, anchor)
    if (move === null) return

    /* `preventDefault` avant tout examen, et même quand le déplacement est
       refusé : sans lui la page défile sous ↓ et Page suivante, et surtout
       `useHotkeys` s'efface sur une frappe déjà consommée. Sans lui, une flèche
       déplacerait le jour *et* changerait le mois, à deux étages. Refuser un
       déplacement sans consommer la touche donnerait à la même flèche deux
       effets différents selon qu'on est au bord ou non. */
    event.preventDefault()
    if (!reachable(move.date)) return
    onAnchor(move.date, move.paging)
  }

  return (
    <div>
      {/* Les deux rangées portent la même gouttière : sans quoi le nom du jour
          cesse de tomber au-dessus de sa colonne dès que la grille en a une. */}
      <div className="mb-1 grid grid-cols-7 gap-1 max-[404px]:gap-0" aria-hidden="true">
        {weekdays().map((day) => (
          // Le nom complet en clé : les initiales ne sont pas uniques en
          // français — mardi et mercredi donnent tous deux « M ».
          <span key={day.name} className="t-axis text-center">
            {day.initial}
          </span>
        ))}
      </div>

      {/* Sept colonnes de 44px demandent 308px, et le cadre de la page (16px),
          celui de la tuile (20px) et les six gouttières (4px) en prennent 96 de
          plus : en dessous de 404px de fenêtre, la case tombe à 32px de large —
          la moitié des téléphones en portrait, pour une cible que le DS §8 fixe
          à 44px partout.

          La grille passe donc à bord perdu sous ce seuil et abandonne ses
          gouttières : le motif est celui du bandeau du mois, et il rend 312px
          pour sept cases, soit 44,5px. Le jour ouvert se distingue à la pilule
          derrière son chiffre, jamais à la gouttière — c'est elle qu'on
          sacrifie, pas la cible. Le bord perdu est posé sur la tuile et non ici :
          c'est son cadre qu'il faut reprendre autant que celui de la page.

          `items-start` est indispensable au carré : un élément de grille est
          étiré par sa rangée, et un ratio posé sur une case étirée est ignoré.
          Les sept colonnes ayant la même largeur et les quarante-deux cases la
          même pile, la rangée reste régulière sans l'étirement. */}
      <div
        role="group"
        aria-label={tpl(fr.calendar.gridLabel, de(formatYearMonth(month)))}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        className="grid grid-cols-7 items-start gap-1 max-[404px]:gap-0"
      >
        {grid.cells.map((cell) =>
          reachable(cell.date) ? (
            <Cell
              key={cell.date}
              cell={cell}
              entries={entriesOn(grid, cell.date)}
              colorOf={colorOf}
              opened={cell.date === opened}
              isToday={cell.date === today}
              anchored={cell.date === anchor}
              onOpen={onOpen}
              register={register}
            />
          ) : (
            /* Un jour de débord dont le mois sort des bornes du store garde son
               chiffre et perd son geste : on ne propose jamais un mois que le
               store refuse d'ouvrir, c'est déjà la règle des chevrons. Muet
               pour un lecteur d'écran, parce qu'un quantième nu qu'on ne peut
               pas atteindre n'apprend rien. */
            <span
              key={cell.date}
              aria-hidden="true"
              className="flex min-h-11 items-center justify-center p-1 min-[448px]:aspect-square"
            >
              <span className="t-body tnum leading-none text-muted opacity-50">{cell.day}</span>
            </span>
          ),
        )}
      </div>

      <p id={hintId} className="sr-only-text">
        {fr.a11y.calendarGridHint}
      </p>
    </div>
  )
}
