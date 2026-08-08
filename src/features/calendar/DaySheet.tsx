import type { ISODate } from '@/domain/date'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatWeekdayDate, tpl } from '@/i18n/format'
import { useCategoryMap, useMemberMap } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { Eyebrow } from '@/ui/Eyebrow'
import { ListRow } from '@/ui/ListRow'
import { Sheet } from '@/ui/Sheet'
import { dayNet } from './grid'

function countLabel(count: number): string {
  if (count === 0) return fr.calendar.noEntry
  if (count === 1) return fr.calendar.oneEntry
  return tpl(fr.calendar.someEntries, count)
}

export type DaySheetProps = {
  /** Le jour ouvert, ou `null` — la feuille reste montée, fermée. */
  date: ISODate | null
  entries: readonly Entry[]
  onOpen: (entry: Entry) => void
  onAdd: (nature: 'in' | 'out' | 'saving') => void
  onClose: () => void
}

/**
 * Le jour ouvert, en feuille montante.
 *
 * Il vivait en tuile sous la grille, et devait alors se réécrire ce que
 * `<dialog>` donne : la touche Échap, le clic à côté, le piège de focus, et le
 * retour du focus à la case d'où l'on vient. Le DS §6 réserve la feuille aux
 * questions fermées et l'interdit à la saisie — celle-ci ne saisit rien, elle
 * lit, et passe la main à l'écran plein pour créer.
 *
 * Le total est la somme des lignes juste en dessous, entières, jamais à la part
 * de quelqu'un : c'est pourquoi cet écran monte son bandeau sans note de
 * lecture. La note existe pour les totaux dont les lignes ne sont nulle part à
 * l'écran ; ici elles y sont toutes, et le chiffre se vérifie à l'œil.
 */
export function DaySheet({ date, entries, onOpen, onAdd, onClose }: DaySheetProps) {
  const categories = useCategoryMap()
  const members = useMemberMap()

  return (
    <Sheet
      open={date !== null}
      onClose={onClose}
      title={date === null ? '' : formatWeekdayDate(date)}
      footer={
        /* Le jour ouvert est déjà la réponse à « quelle date ? » : la saisie
           s'ouvre dessus plutôt que de la redemander. Et la nature se choisit
           ici, pas dans un formulaire intitulé « dépense » — l'épargne a sa
           porte, comme sur le mois et le bouton flottant.

           Sans le « + » que portait le panneau : le pied de feuille partage sa
           largeur en trois, ce qui laisse 93px par bouton à 320px, et le glyphe
           s'y faisait écraser contre son libellé. Une icône qui n'aide ni à agir
           ni à se repérer décore (DS §9), et une icône rognée fait moins que
           décorer. */
        <>
          <Button
            variant="secondary"
            onClick={() => {
              onAdd('out')
            }}
          >
            {fr.entry.newOut}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onAdd('in')
            }}
          >
            {fr.entry.newIn}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onAdd('saving')
            }}
          >
            {fr.entry.newSaving}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{fr.calendar.dayTotal}</Eyebrow>
          {/* Sans `direction` : c'est un solde, donc le « − » s'affiche (DS §3).
              Un jour n'a pas de sens propre — il en a deux, et leur différence
              est justement ce qu'on vient chercher. */}
          <Amount value={dayNet(entries)} />
        </div>
        <p className="t-label">{countLabel(entries.length)}</p>

        {entries.length === 0 ? (
          <p className="t-body">{fr.calendar.emptyDay}</p>
        ) : (
          /* La liste se lit dans l'ordre exact des pastilles de la case : le tri
             est posé une fois pour toutes dans `useCalendarWindow`. */
          <ul className="flex flex-col">
            {entries.map((entry) => {
              const name =
                entry.memberId === undefined ? undefined : members.get(entry.memberId)?.name
              return (
                <li key={entry.id}>
                  <ListRow
                    color={categories.get(entry.categoryId)?.color ?? 'var(--cat-rest)'}
                    label={entry.label}
                    {...(name === undefined ? {} : { meta: name })}
                    planned={entry.status === 'planned'}
                    trailing={<Amount value={entry.amount} direction={entry.direction} />}
                    onClick={() => {
                      onOpen(entry)
                    }}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Sheet>
  )
}
