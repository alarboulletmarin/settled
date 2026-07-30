import { fr } from '@/i18n/fr'
import { useMemberFilter, useMembers, useMonthBounds } from '@/store/selectors'
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
 * En-tête des écrans rattachés à un mois. Le mois courant vit dans le store :
 * changer de mois ici le change partout.
 */
export function MonthHeader({ withMemberFilter = true }: { withMemberFilter?: boolean }) {
  const ym = useStore((s) => s.ym)
  const setYm = useStore((s) => s.setYm)
  const bounds = useMonthBounds()

  return (
    <header className="mb-5 flex flex-col gap-4">
      <MonthNav value={ym} onChange={setYm} min={bounds.min} max={bounds.max} className="max-w-sm" />
      {withMemberFilter && <MemberFilter />}
    </header>
  )
}
