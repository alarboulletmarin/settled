import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import {
  useMemberFilter,
  useMemberMap,
  useMembers,
  useMonthFilter,
  useMonthBounds,
  useMonthScope,
  useMonthSplit,
} from '@/store/selectors'
import { useStore } from '@/store/store'
import { Chip } from '@/ui/Chip'
import { MonthNav } from '@/ui/MonthNav'

/**
 * Les trois lectures du mois : tout, le commun seul, ou une personne.
 *
 * « Commun » n'est pas le frère de « une personne » — c'est l'autre découpage
 * du même total (voir `MonthFilter`). Il vaut la peine d'être une pilule quand
 * même : le pot est ce qu'on regarde ensemble, et c'était le seul chiffre du
 * foyer qu'aucun tableau de bord ne savait isoler.
 *
 * Seules les personnes portent une pastille : c'est leur couleur, et elle ne
 * désigne qu'elles. En donner une au commun demandait l'accent, qui est bien sa
 * couleur ailleurs — mais une pilule active passe elle-même en accent, et la
 * pastille y disparaissait, exactement comme celle du premier membre avant
 * qu'il quitte le vert pomme.
 */
function MonthFilterChips({ withCommon }: { withCommon: boolean }) {
  const members = useMembers()
  const filter = useMonthFilter()
  const setFilter = useStore((s) => s.setFilter)
  if (members.length === 0) return null
  const common = withCommon && members.length > 1

  return (
    /* Une ligne qui défile, à bord perdu : le cadre de l'en-tête est annulé puis
       reposé sur la piste, pour que la première et la dernière pilule ne soient
       pas rognées et que la rangée file jusqu'au bord de l'écran. Les 4px de
       cadre vertical logent l'anneau de focus, et la marge négative les reprend
       pour que la hauteur du bandeau ne bouge pas. */
    <div
      className="filter-scroller -mx-4 -my-1 flex gap-2 px-4 py-1 md:-mx-8 md:px-8"
      role="group"
      aria-label={fr.shell.filterByMember}
    >
      <Chip
        className="shrink-0"
        active={filter.kind === 'all'}
        onClick={() => {
          setFilter({ kind: 'all' })
        }}
      >
        {fr.shell.all}
      </Chip>
      {/* Sans deux membres, il n'y a rien à partager : le commun se confond
          alors avec tout, et une pilule de plus ne dirait que ça. */}
      {common && (
        <Chip
          className="shrink-0"
          active={filter.kind === 'common'}
          onClick={() => {
            setFilter({ kind: 'common' })
          }}
        >
          {fr.shell.common}
        </Chip>
      )}
      {/* Les deux premières pilules n'ont pas de pastille parce qu'elles ne
          désignent personne — une pastille est la couleur de quelqu'un. Sans
          rien pour le dire, cette absence se lit comme un oubli ; le filet la
          rend voulue, et sépare les lectures des personnes.

          En `--text-muted` atténué, et non en `--border` : ce dernier vaut 8 %
          d'encre, calibré pour une bordure posée sur une surface. Le bandeau,
          lui, est sur le fond de page, où un trait d'un pixel à 8 % ne se voit
          pas — un séparateur qu'on ne distingue pas ne sépare rien. */}
      <span aria-hidden="true" className="my-auto h-5 w-px shrink-0 bg-muted opacity-40" />
      {members.map((member) => (
        <Chip
          key={member.id}
          className="shrink-0"
          color={member.color}
          active={filter.kind === 'member' && filter.memberId === member.id}
          onClick={() => {
            setFilter({ kind: 'member', memberId: member.id })
          }}
        >
          {member.name}
        </Chip>
      ))}
    </div>
  )
}

/**
 * Comment se lisent les chiffres sous un filtre.
 *
 * Un mois filtré sur quelqu'un ne montre pas que ses lignes : il y ajoute sa
 * part des charges communes. C'est une règle de lecture, elle se dit là où on
 * choisit le filtre — sans quoi le chiffre paraît sorti de nulle part, puisque
 * la liste dessous n'en porte aucune trace.
 *
 * Quand le prorata ne se calcule pas, ce qui manque est nommé : on retombe sur
 * ses seules lignes, et un total qui ignore le loyer sans le dire vaut moins
 * qu'un total qui l'avoue.
 */
function ProrataNote() {
  const filter = useMonthFilter()
  const active = useMemberFilter()
  const { prorated, partial } = useMonthScope()
  const members = useMemberMap()
  const { unknown } = useMonthSplit()

  // Le commun se lit à son montant plein, sans prorata : la note dit ce qui
  // entre dans le pot, puisque c'est la seule question qu'on se pose devant.
  if (filter.kind === 'common') return <p className="t-label">{fr.shell.commonNote}</p>

  if (active === undefined) return null
  const name = members.get(active)?.name ?? ''

  if (prorated) {
    return <p className="t-label">{tpl(fr.shell.prorata, name)}</p>
  }
  if (!partial) return null

  const missing = unknown.map((member) => member.name).join(', ')
  if (missing === '') return <p className="t-label">{fr.shell.prorataOnlyOwn}</p>

  const wording = unknown.length > 1 ? fr.shell.prorataMissingMany : fr.shell.prorataMissingOne
  return <p className="t-label">{tpl(wording, missing)}</p>
}

/**
 * En-tête des écrans rattachés à un mois. Le mois courant vit dans le store :
 * changer de mois ici le change partout.
 */
export function MonthHeader({
  withMemberFilter = true,
  withCommon = true,
  prorataNote = false,
}: {
  withMemberFilter?: boolean
  /* L'épargne ne se partage jamais : sur son écran, « Commun » ne rendrait que
     des zéros, et proposer une lecture vide vaut moins que ne pas la proposer. */
  withCommon?: boolean
  /* Réservé aux écrans de chiffres : le calendrier montre les échéances
     réelles, où une charge commune tombe en entier et n'est à personne. */
  prorataNote?: boolean
}) {
  const ym = useStore((s) => s.ym)
  const setYm = useStore((s) => s.setYm)
  const bounds = useMonthBounds()

  return (
    /* C'est l'en-tête lui-même qui colle, et non un bloc à l'intérieur : un
       élément collant ne dépasse jamais les bornes de son parent, et un parent
       haut de deux commandes le laisse partir au premier écran de défilement.
       Son parent à lui est `main`, c'est-à-dire la page entière — et la note de
       lecture sort donc de l'en-tête pour ne pas coller avec.

       Les marges négatives annulent le cadre de `main` : sans elles, le fond
       s'arrête aux bords du contenu et les lignes passent dans les gouttières
       pendant qu'elles défilent dessous. Le fond est celui de la page, pas
       d'une tuile — le bandeau n'est pas une surface de plus, c'est la page qui
       reste en place. Le cadre vertical est le sien, et non celui de `main` qui
       défile : sans lui, le mois toucherait le bord de l'écran une fois figé.

       Sous la barre d'onglets (`z-20`) et sous les surcouches : un bandeau
       collant qui passerait devant un toast masquerait ce qu'on vient de
       faire. */
    <>
      <header
        className={cn(
          'sticky top-0 z-10 -mx-4 flex flex-col gap-4 bg-bg px-4 py-3',
          'md:-mx-8 md:px-8',
        )}
      >
        <MonthNav
          value={ym}
          onChange={setYm}
          min={bounds.min}
          max={bounds.max}
          className="max-w-sm"
        />
        {withMemberFilter && <MonthFilterChips withCommon={withCommon} />}
      </header>

      {/* La note de lecture ne colle pas : c'est une phrase qui s'explique une
          fois, pas une commande, et elle coûterait deux lignes de haut d'écran
          à chaque défilement sur téléphone.

          Le bloc est rendu même vide : sa marge est celle que l'en-tête portait
          avant de coller, et une marge sur un élément collant laisserait une
          bande transparente sous le bandeau, dans laquelle le contenu se
          verrait défiler. */}
      <div className="mb-5">{withMemberFilter && prorataNote && <ProrataNote />}</div>
    </>
  )
}
