import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fr } from '@/i18n/fr'
import { addMember, removeMember, renameMember, setHouseholdName } from '@/store/actions'
import { useHouseholdName, useMembers } from '@/store/selectors'
import { useStore } from '@/store/store'
import { Tile } from '@/ui/Tile'
import { HouseholdStep } from './HouseholdStep'
import { MembersStep } from './MembersStep'
import { StepProgress } from './StepProgress'
import { HouseholdPreview, MembersPreview } from './StepPreview'

/**
 * Deux questions, puis l'app est utilisable. Le jeu de catégories par défaut est
 * déjà posé par le document initial : il n'y a rien à demander de plus.
 *
 * L'écran ne fait plus que ça. Les trois façons de ne pas commencer par une page
 * blanche — restaurer un export, partir de ses notes, charger un exemple —
 * vivaient sous ce formulaire ; elles sont désormais sur la présentation, donc
 * *avant* qu'on demande quoi que ce soit, ce qui est exactement ce que leur
 * argument réclamait. Le retour de l'en-tête y ramène d'un geste.
 *
 * Chaque question porte son aperçu : à gauche ce qu'on répond, à droite ce que
 * la réponse change. Sous 1024px l'aperçu passe dessous — la question reste la
 * tâche, et c'est elle qui doit tomber sous le pouce.
 */
export function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const householdName = useHouseholdName()
  const [draftName, setDraftName] = useState(householdName)
  const members = useMembers()
  const finishOnboarding = useStore((s) => s.finishOnboarding)
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-8 px-5 py-10">
      <StepProgress
        step={step}
        {...(step === 2
          ? {
              onBack: () => {
                setStep(1)
              },
            }
          : {})}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Tile>
          {step === 1 ? (
            <HouseholdStep
              name={draftName}
              onChange={setDraftName}
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
              onDone={() => {
                finishOnboarding()
                /* Naviguer plutôt que laisser le filet `*` d'`AppRoutes`
                   rediriger : le filet marcherait, au prix d'un rendu
                   intermédiaire à l'URL des questions et d'une animation
                   d'entrée jouée deux fois. `replace`, pour que le retour
                   ramène à la présentation et non à un formulaire dont le
                   foyer est déjà créé. */
                void navigate('/', { replace: true })
              }}
            />
          )}
        </Tile>

        {step === 1 ? (
          <HouseholdPreview name={draftName} />
        ) : (
          <MembersPreview members={members} />
        )}
      </div>

      <p className="t-label">{fr.onboarding.privacy}</p>
    </div>
  )
}
