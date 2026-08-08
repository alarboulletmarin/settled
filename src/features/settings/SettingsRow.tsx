import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Eyebrow } from '@/ui/Eyebrow'
import { ChevronRight, type IconComponent } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'

/**
 * Un groupe de réglages : une tuile, son étiquette, et des rangées.
 *
 * La page en comptait huit — une tuile par sujet, chacune avec son cadre, son
 * ombre et son eyebrow, qu'il s'agisse de choisir un thème ou de gérer
 * quarante-six catégories. Huit cadres identiques donnent le même poids à tout,
 * et c'est exactement ce qu'une page de réglages ne doit pas faire.
 *
 * La tuile redevient donc ce que le DS §6 en dit — un **groupe logique** — et la
 * hiérarchie passe à l'intérieur : l'étiquette nomme le groupe, les rangées
 * portent les réglages, un filet les sépare. Rien de nouveau dans le design
 * system : `Tile`, `Eyebrow`, et la même règle de filet que les sections de
 * `DataSection` posaient déjà à la main.
 *
 * Le titre est facultatif : une liste de familles ou de résultats de recherche
 * est un groupe sans nom — la page en porte déjà un, et le répéter au-dessus de
 * la première ligne ne dirait rien de plus.
 */
export function SettingsGroup({
  title,
  icon,
  children,
}: {
  title?: string
  icon?: IconComponent
  children: ReactNode
}) {
  return (
    <Tile className="gap-2">
      {title !== undefined && <Eyebrow {...(icon ? { icon } : {})}>{title}</Eyebrow>}
      {/* Le filet entre deux rangées, et jamais avant la première : c'est le
          sélecteur qui le pose, pas chaque appelant — une rangée n'a pas à
          savoir si elle est la première du groupe. */}
      <div className="flex flex-col [&>*+*]:border-t [&>*+*]:border-border">{children}</div>
    </Tile>
  )
}

/**
 * Le gabarit d'une rangée.
 *
 * Le cadre de la tuile fait la marge : la rangée déborde de huit pixels de
 * chaque côté, si bien que son fond de survol dépasse le texte sans que le
 * texte, lui, sorte de la colonne où l'étiquette du groupe l'a posé. Sans ce
 * débordement, un survol collé au mot se lit comme une sélection ; avec, il se
 * lit comme une rangée.
 *
 * 56px de haut au minimum : le plancher tactile du DS §8 est de 44, et une
 * rangée qu'on vise au pouce dans une liste en prend douze de plus, comme
 * `ListRow`.
 */
const ROW = '-mx-2 flex min-h-14 items-center gap-3 rounded-inner px-2 py-2 text-left'

const ROW_ACTION =
  'transition-colors duration-[var(--dur)] ease-ds hover:bg-surface-2 active:bg-surface-2'

export type SettingsRowProps = {
  label: string
  /**
   * L'identifiant du contrôle que l'étiquette nomme. Renseigné, elle devient un
   * vrai `<label>` — c'est ce qui donne son nom accessible à un sélecteur, et
   * ce qui fait qu'on peut le déplier en touchant le mot plutôt que la flèche.
   */
  labelFor?: string
  /** Une seconde ligne : la valeur du réglage, ou ce que la vue contient. */
  description?: string
  /** À droite du libellé — un compte, un sélecteur court. */
  trailing?: ReactNode
  /** Avant le libellé — une pastille de couleur. */
  leading?: ReactNode
  /**
   * Un contrôle posé **sous** l'étiquette, pour ceux qui ne tiennent pas à sa
   * droite : à 320px, une tuile n'offre que 250px utiles, et une bascule à
   * trois positions les prend presque tous.
   */
  control?: ReactNode
  /** Mène à une vue. Exclusif d'`onClick`. */
  to?: string
  onClick?: () => void
}

/**
 * Une rangée de réglage : ce qu'on règle, sa valeur, et où l'on va.
 *
 * Un lien quand elle mène ailleurs, un bouton quand elle agit sur place, un
 * simple bloc quand elle ne fait que porter un contrôle — jamais un `div`
 * cliquable : le chevron promet une navigation, et une navigation se tabule,
 * s'ouvre dans un onglet et s'annonce comme telle.
 *
 * Le chevron n'apparaît que là où le geste existe, exactement comme le repère
 * d'une tuile (`Tile`) : une rangée sans chevron est une rangée qu'on lit.
 */
export function SettingsRow({
  label,
  labelFor,
  description,
  trailing,
  leading,
  control,
  to,
  onClick,
}: SettingsRowProps) {
  const heading = (
    <span className="flex min-w-0 flex-1 flex-col">
      {labelFor === undefined ? (
        <span className="t-body truncate">{label}</span>
      ) : (
        <label htmlFor={labelFor} className="t-body truncate">
          {label}
        </label>
      )}
      {/* Le libellé se tronque, la seconde ligne passe à la ligne : un nom de
          foyer trop long doit tenir sur une rangée, mais une valeur coupée —
          « Rien n'est converti : seul le s… » — ne dit plus rien de ce qu'elle
          avertit. */}
      {description !== undefined && <span className="t-label">{description}</span>}
    </span>
  )

  const content = (chevron: boolean): ReactNode => (
    <>
      {leading}
      {heading}
      {trailing !== undefined && <span className="flex shrink-0 items-center">{trailing}</span>}
      {/* `aria-hidden` : le nom accessible du lien dit déjà où il mène, et un
          chevron annoncé une seconde fois ne l'apprendrait pas mieux. */}
      {chevron && <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden="true" />}
    </>
  )

  if (control !== undefined) {
    return (
      <div className="-mx-2 flex flex-col gap-2 px-2 py-3">
        {heading}
        {control}
      </div>
    )
  }

  if (to !== undefined) {
    return (
      <Link to={to} className={cn(ROW, ROW_ACTION)}>
        {content(true)}
      </Link>
    )
  }

  if (onClick !== undefined) {
    return (
      <button type="button" onClick={onClick} className={cn(ROW, ROW_ACTION)}>
        {content(true)}
      </button>
    )
  }

  return <div className={ROW}>{content(false)}</div>
}
