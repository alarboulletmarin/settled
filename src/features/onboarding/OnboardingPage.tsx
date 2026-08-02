import { useState } from 'react'
import { tpl } from '@/i18n/format'
import { fr } from '@/i18n/fr'
import { addMember, removeMember, renameMember, setHouseholdName } from '@/store/actions'
import { useHouseholdName, useMembers } from '@/store/selectors'
import { useStore } from '@/store/store'
import { ExampleControl } from '@/features/settings/ExampleControl'
import { ImportControl } from '@/features/settings/ImportControl'
import { SchemaControl } from '@/features/settings/SchemaControl'
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
            onRename={renameMember}
            onRemove={removeMember}
            onDone={finishOnboarding}
          />
        )}
      </Tile>

      {/* Trois façons de ne pas commencer par une page blanche, pour les trois
          personnes qui arrivent ici : celle qui restaure une sauvegarde, celle
          qui a déjà tout écrit ailleurs, et celle qui veut seulement voir.
          Aucune n'a de raison de créer d'abord un foyer qu'elle remplacera dans
          la foulée — c'est déjà ce que l'import promet, et le message d'erreur
          de l'hydratation avec lui. */}
      <div className="flex flex-col items-start gap-5 border-t border-border pt-5">
        <div className="flex flex-col items-start gap-2">
          <p className="t-label">{fr.onboarding.importHint}</p>
          <ImportControl />
        </div>

        <div className="flex flex-col items-start gap-2">
          <p className="t-label">{fr.onboarding.schemaHint}</p>
          <SchemaControl />
        </div>

        {/* Aucune confirmation : rien n'a encore été enregistré, et faire
            confirmer la perte de rien n'apprend qu'une chose — que les
            questions de cette app ne veulent rien dire. */}
        <div className="flex flex-col items-start gap-2">
          <p className="t-label">{fr.onboarding.exampleHint}</p>
          <ExampleControl confirm={false} />
        </div>
      </div>

      <p className="t-label">{fr.onboarding.privacy}</p>
    </div>
  )
}
