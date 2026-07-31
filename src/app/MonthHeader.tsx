import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
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
    <header className="mb-5 flex flex-col gap-4">
      <MonthNav value={ym} onChange={setYm} min={bounds.min} max={bounds.max} className="max-w-sm" />
      {withMemberFilter && (
        <div className="flex flex-col gap-2">
          <MemberFilter />
          {prorataNote && <ProrataNote />}
        </div>
      )}
    </header>
  )
}
