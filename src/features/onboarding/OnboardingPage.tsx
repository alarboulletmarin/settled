import { useState } from 'react'
import { tpl } from '@/i18n/format'
import { fr } from '@/i18n/fr'
import { addMember, removeMember, setHouseholdName } from '@/store/actions'
import { useHouseholdName, useMembers } from '@/store/selectors'
import { useStore } from '@/store/store'
import { Tile } from '@/ui/Tile'
import { HouseholdStep } from './HouseholdStep'
import { MembersStep } from './MembersStep'

/**
 * Deux questions, puis l'app est utilisable. Le jeu de catégories par défaut
 * est déjà posé par le document initial : il n'y a rien à demander de plus.
 */
export function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const householdName = useHouseholdName()
  const members = useMembers()
  const finishOnboarding = useStore((s) => s.finishOnboarding)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-5 py-10">
      <header className="flex flex-col gap-1">
        <span className="t-eyebrow text-muted">{fr.app.name}</span>
        <span className="t-label">{tpl(fr.onboarding.step, step)}</span>
      </header>

      <Tile>
        {step === 1 ? (
          <HouseholdStep
            initialName={householdName}
            onSubmit={(name) => {
              setHouseholdName(name)
              setStep(2)
            }}
          />
        ) : (
          <MembersStep
            members={members}
            onAdd={(name) => {
              addMember(name)
            }}
            onRemove={removeMember}
            onDone={finishOnboarding}
          />
        )}
      </Tile>

      <p className="t-label">{fr.onboarding.privacy}</p>
    </div>
  )
}
