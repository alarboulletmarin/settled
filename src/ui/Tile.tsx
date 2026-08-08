import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { ChevronDown, ChevronRight, InfoIcon } from './Icons'

/** Formats autorisés par le DS §5. Rien d'autre, sinon la grille se délite. */
export type TileSpan = '2x1' | '2x2' | '4x1' | '4x2' | '6x2'

export type TileVariant = 'default' | 'accent' | 'accent-2'

/**
 * Ce que le clic fait — et donc le repère posé au coin de la tuile.
 *
 * Douze tuiles rigoureusement identiques à l'œil cachaient cinq comportements :
 * ouvrir une feuille d'explication, partir sur un autre écran, faire défiler
 * vers une section plus bas, ne rien faire, ou ne rien faire sauf par un lien
 * minuscule posé à l'intérieur. Le seul indice était un survol qui soulève la
 * tuile d'un pixel — donc rien du tout au doigt.
 *
 * Un repère par comportement, et rien sur ce qui ne fait rien : c'est cette
 * dernière règle qui rend les trois autres lisibles. Une tuile sans repère est
 * une tuile qu'on lit, pas une tuile qu'on rate.
 */
export type TileAffordance =
  /**
   * Mène ailleurs. `destination` nomme l'écran d'arrivée — savoir que c'est
   * cliquable ne dit pas encore où l'on atterrit —, et se tait quand cet écran
   * porte déjà le nom de la tuile : « RÉPARTITION … Répartition › » n'apprend
   * rien de plus que le chevron seul, et prend la largeur du chiffre.
   */
  | { kind: 'navigate'; destination?: string }
  /** Ouvre une feuille sur place. Pas de destination, il n'y en a pas. */
  | { kind: 'explain' }
  /** Fait défiler vers une section de la même page. La flèche descend, elle ne
   *  pointe pas de côté : « plus bas », et non « ailleurs ». */
  | { kind: 'scroll'; destination: string }

/**
 * Le même repère, mais cliquable — et la tuile reste une section.
 *
 * Une tuile actionnable est un `<button>`, qui n'admet que du contenu de
 * phrase : trois d'entre elles y plaçaient une liste, ce qu'aucun navigateur ne
 * valide et qu'un lecteur d'écran aplatit derrière le nom unique du bouton. Le
 * DS §6 prescrit alors la tuile non cliquable avec un vrai lien au coin, et
 * `MemberShareTile` en écrit le rationale.
 *
 * Le lien est ce repère-ci et non un lien posé dans le flux : le coin est en
 * position absolue, il ne coûte donc ni la hauteur ni la largeur qu'une 2×2 n'a
 * pas — son budget vertical est compté au pixel dans `donut.ts`. La cible de
 * 44px du DS §8 s'obtient par un cadre qui déborde dans celui de la tuile, où
 * rien d'autre n'est actionnable.
 */
export type TileLink = {
  to: string
  /** Ce que le lien dit hors de son contexte : « Le détail de la répartition ». */
  label: string
  /** Nomme l'écran d'arrivée à côté du chevron, comme `TileAffordance`. */
  destination?: string
}

export type TileProps = {
  children: ReactNode
  variant?: TileVariant
  /** Omis, la tuile n'est pas posée dans une grille bento et occupe son flux. */
  span?: TileSpan
  className?: string
  /** Rend la tuile actionnable. La cible tactile fait alors toute la tuile. */
  onClick?: () => void
  label?: string
  /** Sans objet sans `onClick` : on n'annonce pas un geste qui n'existe pas. */
  affordance?: TileAffordance
  /** Exclusif d'`onClick` : le repère du coin devient le seul geste de la tuile. */
  link?: TileLink
}

const VARIANT_CLASS: Record<TileVariant, string> = {
  default: '',
  accent: 'tile--accent',
  'accent-2': 'tile--accent-2',
}

const PADDING = 'p-5 md:p-6'

/**
 * Une tuile d'une seule rangée fait 88px de haut : à 20px de cadre il ne reste
 * que 48px, et l'eyebrow avec le chiffre en demandent 57. Elle resserre donc
 * son cadre — sans quoi la lecture secondaire, puis le chiffre lui-même, se
 * coupent au bord. Le chiffre s'y réduit aussi, dans `base.css`.
 *
 * **Le pendant en largeur, qui décide d'un `span` autant que la hauteur.** Une
 * `2x1` reste en demi-colonne sur mobile, seule de tous les formats : elle
 * n'offre que ~104px de contenu à 320px. L'eyebrow y est en `nowrap` et se
 * dégrade en trois paliers (`components.css`) — marges et interlettrage, puis
 * l'icône, puis le reste de l'interlettrage — après quoi il déborde et se fait
 * trancher par l'`overflow-hidden` ci-dessous.
 *
 * Mesuré, pas calculé : le plafond d'une `2x1` est de **13 caractères**.
 * « Reste à vivre » (13) tient, et ne tenait pas avant le troisième palier ;
 * « Capacité d'épargne » (18) déborde de 35px, d'où la `4x1` que `LandingTiles`
 * lui garde.
 * Passé 13 caractères, le format est `4x1` — c'est au format d'être choisi pour
 * le libellé, pas au libellé d'être raboté pour le format.
 */
const PADDING_FLAT = 'p-4'
const FLAT: readonly TileSpan[] = ['2x1', '4x1']

/**
 * Le repère, au coin haut-droit, hors du flux du contenu.
 *
 * En position absolue et non dans une rangée avec l'eyebrow : les tuiles ne
 * s'accordent pas sur ce qu'elles posent en tête — certaines une étiquette
 * seule, d'autres un chiffre héros collé dessous — et un repère qui participe
 * au flux les décalerait chacune différemment. Aligné sur le cadre de la tuile,
 * il tombe toujours sur la ligne de l'eyebrow.
 *
 * `aria-hidden` : le nom accessible de la tuile dit déjà où elle mène (« Voir
 * où placer 2 500 € »), et l'annoncer deux fois ne l'apprendrait pas mieux.
 */
function cornerClass(span: TileSpan | undefined): string {
  const flat = span !== undefined && FLAT.includes(span)

  return cn(
    'absolute flex max-w-[60%] items-center gap-1 text-text-muted',
    flat ? 'right-4' : 'right-5 md:right-6',
    /* Une 2×1 étroite n'offre qu'une centaine de pixels utiles, et
       « PRÉVISIONNEL » les consomme déjà à lui seul — le repère posé en
       haut lui passait dessus. Il descend donc au coin bas, libre tant que
       la lecture secondaire est masquée à cette largeur ; dès qu'elle
       s'affiche, la rangée du bas se remplit, celle du haut se dégage, et
       le repère remonte. Deux coins, jamais deux en même temps.
       C'est la largeur de la tuile qui arbitre, pas celle de l'écran :
       `.tile-affordance-flat` porte exactement le seuil de `.tile-hint`,
       sans quoi une tuile large sur un petit écran verrait les deux se
       disputer la ligne du bas. */
    span === '2x1' ? 'tile-affordance-flat' : flat ? 'top-4' : 'top-5 md:top-6',
  )
}

/** Le nom de la destination puis le glyphe — le repère lui-même, sans sa boîte. */
function Marker({
  destination,
  glyph: Glyph,
  span,
}: {
  destination: string | undefined
  glyph: typeof ChevronRight
  span: TileSpan | undefined
}) {
  return (
    <>
      {destination !== undefined && (
        <span className={cn('t-axis truncate', span === '2x1' && 'tile-affordance-name')}>
          {destination}
        </span>
      )}
      <Glyph size={14} />
    </>
  )
}

function Affordance({ affordance, span }: { affordance: TileAffordance; span?: TileSpan }) {
  const Glyph =
    affordance.kind === 'explain'
      ? InfoIcon
      : affordance.kind === 'scroll'
        ? ChevronDown
        : ChevronRight

  return (
    <span aria-hidden="true" className={cn('pointer-events-none', cornerClass(span))}>
      <Marker
        destination={affordance.kind === 'explain' ? undefined : affordance.destination}
        glyph={Glyph}
        span={span}
      />
    </span>
  )
}

/**
 * Le repère du coin, en vrai lien.
 *
 * Il porte son nom accessible plutôt que de compter sur son entourage : un
 * lecteur d'écran sait lister les liens d'une page hors de leur contexte, et
 * « › » n'y dit rien. C'est aussi ce qui autorise le chevron nu à l'écran, là où
 * l'eyebrow de la tuile nomme déjà la destination.
 */
function AffordanceLink({ link, span }: { link: TileLink; span?: TileSpan }) {
  return (
    <Link
      to={link.to}
      aria-label={link.label}
      className={cn(
        cornerClass(span),
        /* La cible de 44px, prise dans le cadre de la tuile plutôt que dans son
           contenu : le glyphe fait 14px, le cadre en ajoute 30, et la marge
           négative rend au repère sa position au pixel — un élément positionné
           se décale de ses marges. Le contenu, lui, ne bouge pas d'un pixel :
           c'est ce qui permet à une 2×2 de porter un lien sans que l'anneau
           remonte sur l'eyebrow (voir `donut.ts`). */
        '-m-[15px] rounded-input p-[15px]',
      )}
    >
      <Marker destination={link.destination} glyph={ChevronRight} span={span} />
    </Link>
  )
}

export function Tile({
  children,
  variant = 'default',
  span,
  className,
  onClick,
  label,
  affordance,
  link,
}: TileProps) {
  const flat = span !== undefined && FLAT.includes(span)
  const classes = cn(
    'tile flex min-w-0 flex-col overflow-hidden',
    flat ? PADDING_FLAT : PADDING,
    VARIANT_CLASS[variant],
    span && `span-${span}`,
    className,
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          classes,
          'text-left transition-[transform,box-shadow,filter] duration-[var(--dur)] ease-ds',
          // Le survol n'existe pas au doigt : sans état pressé, la moitié des
          // utilisateurs n'a aucun retour que le geste a été pris.
          'hover:-translate-y-px active:translate-y-0 active:brightness-95',
        )}
      >
        {affordance && <Affordance affordance={affordance} {...(span ? { span } : {})} />}
        {children}
      </button>
    )
  }

  return (
    <section className={classes} aria-label={label}>
      {link && <AffordanceLink link={link} {...(span ? { span } : {})} />}
      {children}
    </section>
  )
}

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('bento', className)}>{children}</div>
}
