import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { upcomingRows } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatDate, formatRelativeDays } from '@/i18n/format'
import { cn } from '@/lib/cn'
import { useCategoryMap, useUpcoming } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { ChevronRight, UpcomingIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'

/** En deçà, le délai passe en encre pleine : c'est ce qui tombe tout de suite. */
const SOON_DAYS = 2

/**
 * Les cinq prochaines échéances, avec le nombre de jours restants.
 *
 * Trois colonnes franches — délai, libellé, montant — tenues par une `subgrid`
 * plutôt que par des largeurs devinées : chacune se cale sur la ligne la plus
 * large, et les trois s'alignent d'un bout à l'autre de la liste. La version
 * précédente posait le délai en flux entre deux éléments de largeur variable,
 * si bien qu'il démarrait à une abscisse différente sur chaque ligne : il n'y
 * avait pas de colonne à suivre, seulement cinq lignes à relire.
 *
 * Le délai remplace la date, et ne s'affiche qu'une fois par jour (voir
 * `upcomingRows`). Le cahier demande le nombre de jours restants, pas la date,
 * et c'est bien lui qu'on vient lire ici : « demain » se voit, « 01/08 » se
 * calcule. La date exacte reste dite au lecteur d'écran, et le calendrier est
 * à un lien de là.
 */
export function UpcomingTile() {
  const upcoming = useUpcoming(5)
  const categories = useCategoryMap()
  const rows = useMemo(() => upcomingRows(upcoming), [upcoming])

  return (
    <Tile span="4x2" className="gap-1">
      <div className="flex items-center justify-between gap-2">
        <Eyebrow icon={UpcomingIcon}>{fr.dashboard.upcoming}</Eyebrow>
        {/* Un vrai lien, et la seule tuile du tableau de bord qui en garde un :
            son contenu est une liste qu'on lit ligne à ligne, avec sa date
            dite au lecteur d'écran sur chacune. L'envelopper dans un bouton
            pour la rendre cliquable d'un bloc, comme les autres, effacerait
            tout ça derrière un nom unique — la cohérence coûterait ici plus
            qu'elle ne rapporte.

            Il prend en revanche la typographie et le chevron du repère des
            autres tuiles : même coin, même mono, même glyphe. La cible de 44px
            du DS §8 déborde dans le cadre, où rien d'autre n'est actionnable. */}
        <Link
          to="/calendrier"
          className="t-axis -my-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-input underline underline-offset-2"
        >
          {fr.nav.calendar}
          {/* À 320px, « PROCHAINES ÉCHÉANCES » et « Calendrier » se partagent la
              largeur au pixel près : le chevron passait par-dessus le bord. Il
              s'efface, et le soulignement continue de dire que c'est un lien —
              c'est le repère qu'on sacrifie, jamais le texte (DS §9.1). */}
          <ChevronRight size={14} aria-hidden="true" className="max-sm:hidden" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="t-label">{fr.dashboard.noUpcoming}</p>
      ) : (
        /* `content-start` sur une liste plus haute que sa boîte : ancrée en
           haut, un débordement éventuel se coupe par le bas, là où il ne
           recouvre rien. Centrée, elle remonterait sur l'eyebrow. */
        <ul className="grid min-h-0 flex-1 grid-cols-[auto_1fr_auto] content-start gap-x-3">
          {rows.map(({ entry, daysLeft, leadsDay }) => (
            /* La tuile fait 188px jusqu'à 1024px, et son cadre passe à 24px dès
               768 : c'est cette bande-là qui est la plus étroite, pas le
               mobile. Les lignes s'y règlent, et ne respirent qu'une fois la
               grille passée à 108px de rangée. */
            <li key={entry.id} className="col-span-3 grid grid-cols-subgrid items-center py-px lg:py-1">
              {/* Vide sur les suivantes du même jour : la cellule tient la
                  colonne, le délai se lit sur la ligne qui ouvre le jour. */}
              <span className={cn('t-axis tnum', daysLeft <= SOON_DAYS && 'text-text')}>
                {leadsDay ? formatRelativeDays(daysLeft) : ''}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <Dot color={categories.get(entry.categoryId)?.color ?? 'var(--cat-rest)'} outlined />
                <span className="t-label truncate text-text">{entry.label}</span>
                {/* Ce que l'œil lit en colonne, l'oreille le lit ligne à ligne :
                    chacune dit sa date, y compris celles dont la colonne de
                    délai est vide. */}
                <span className="sr-only-text">{formatDate(entry.date)}</span>
              </span>
              <Amount value={entry.amount} direction={entry.direction} size="label" />
            </li>
          ))}
        </ul>
      )}
    </Tile>
  )
}
