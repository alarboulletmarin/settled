import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import {
  useMemberFilter,
  useMemberMap,
  useMembers,
  useMonthBounds,
  useMonthScope,
  useMonthSplit,
} from '@/store/selectors'
import { useStore } from '@/store/store'
import { Chip } from '@/ui/Chip'
import { MonthNav } from '@/ui/MonthNav'

/** Filtre par membre. Absent tant que le foyer n'a pas de membres. */
function MemberFilter() {
  const members = useMembers()
  const active = useMemberFilter()
  const setMemberFilter = useStore((s) => s.setMemberFilter)
  if (members.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={fr.shell.filterByMember}>
      <Chip
        active={active === undefined}
        onClick={() => {
          setMemberFilter(undefined)
        }}
      >
        {fr.shell.everyone}
      </Chip>
      {members.map((member) => (
        <Chip
          key={member.id}
          color={member.color}
          active={active === member.id}
          onClick={() => {
            setMemberFilter(member.id)
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
  const active = useMemberFilter()
  const { prorated, partial } = useMonthScope()
  const members = useMemberMap()
  const { unknown } = useMonthSplit()

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
  prorataNote = false,
}: {
  withMemberFilter?: boolean
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
        {withMemberFilter && <MemberFilter />}
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
