import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { currentYm } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { addMember, addRecurrence, removeMember, renameMember, setHouseholdName } from '@/store/actions'
import { useCategoryMap, useHouseholdName, useMembers } from '@/store/selectors'
import { useStore } from '@/store/store'
import { Tile } from '@/ui/Tile'
import { HouseholdStep } from './HouseholdStep'
import { MembersStep } from './MembersStep'
import { StarterStep } from './StarterStep'
import { StepProgress } from './StepProgress'
import { HouseholdPreview, MembersPreview, StarterPreview } from './StepPreview'
import { starterLines, starterRecurrences } from './starter'

const LAST_STEP = 3

/**
 * Deux questions, une proposition, puis l'app est utilisable. Le jeu de
 * catégories par défaut est déjà posé par le document initial : il n'y a rien
 * à demander de plus.
 *
 * La troisième étape n'est pas une question, c'est une offre — voir
 * `StarterStep`. Les deux premières créent le foyer ; celle-ci lui donne de
 * quoi parler dès le premier écran, et se saute d'un bouton visible.
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
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const householdName = useHouseholdName()
  const [draftName, setDraftName] = useState(householdName)
  const members = useMembers()
  const categories = useCategoryMap()
  const finishOnboarding = useStore((s) => s.finishOnboarding)
  const navigate = useNavigate()

  /* Les montants de la troisième étape vivent ici plutôt que dans l'étape :
     l'aperçu posé à côté les lit à chaque frappe, comme le nom du foyer à la
     première question, et deux états qui décrivent la même saisie auraient fini
     par diverger d'un chiffre. */
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const lines = useMemo(() => starterLines(members), [members])

  /* `replace`, pour que le retour ramène à la présentation et non à un
     formulaire dont le foyer est déjà créé. Naviguer plutôt que laisser le
     filet `*` d'`AppRoutes` rediriger : le filet marcherait, au prix d'un rendu
     intermédiaire à l'URL des questions et d'une animation d'entrée jouée deux
     fois. */
  const open = (): void => {
    finishOnboarding()
    void navigate('/', { replace: true })
  }

  /* Poser les règles *avant* d'ouvrir, et c'est ce qui fait que le mois arrive
     déjà écrit : tant que le statut est « onboarding », rien ne s'enregistre et
     aucun mois n'est ouvert, si bien que ces récurrences n'ont encore aucune
     échéance. C'est `finishOnboarding` qui ouvre le mois courant, et c'est là
     que leurs échéances naissent — à confirmer, comme n'importe quel mois qui
     s'ouvre. */
  const startWith = (): void => {
    for (const payload of starterRecurrences(
      lines,
      amounts,
      (id) => categories.has(id),
      currentYm(),
    )) {
      addRecurrence(payload)
    }
    open()
  }

  return (
    /* Le cadre d'`AppShell`, comme la présentation et la coquille d'« à propos ».
       Le `px-5` d'origine datait de la carte `max-w-md` centrée : l'écran est
       devenu une page à deux colonnes, et trois écrans voisins à trois marges
       différentes se voient dès qu'on passe de l'un à l'autre. */
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-8 px-4 py-10 md:px-8">
      <StepProgress
        step={step}
        {...(step === 1
          ? {}
          : {
              onBack: () => {
                setStep(step === 3 ? 2 : 1)
              },
            })}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Tile>
          {step === 1 && (
            <HouseholdStep
              name={draftName}
              onChange={setDraftName}
              onSubmit={(name) => {
                setHouseholdName(name)
                setStep(2)
              }}
            />
          )}
          {step === 2 && (
            <MembersStep
              members={members}
              onAdd={(name) => {
                addMember(name)
              }}
              onRename={renameMember}
              onRemove={removeMember}
              onNext={() => {
                setStep(3)
              }}
            />
          )}
          {step === 3 && (
            <StarterStep
              lines={lines}
              amounts={amounts}
              onAmount={(key, value) => {
                setAmounts((current) => ({ ...current, [key]: value }))
              }}
              onSubmit={startWith}
              onSkip={open}
            />
          )}
        </Tile>

        {step === 1 && <HouseholdPreview name={draftName} />}
        {step === 2 && <MembersPreview members={members} />}
        {step === 3 && <StarterPreview lines={lines} amounts={amounts} members={members} />}
      </div>

      <div className="flex flex-col gap-1">
        <p className="t-label">{fr.onboarding.privacy}</p>
        {/* La contrepartie du local-first, à la dernière étape : elle ne se
            découvrait qu'au bout de trente jours, par un bandeau. Ici parce que
            c'est le moment où la promesse de la ligne au-dessus est faite, et
            là seulement pour ne pas la répéter trois fois. */}
        {step === LAST_STEP && <p className="t-label">{fr.onboarding.backup}</p>}
      </div>
    </div>
  )
}
