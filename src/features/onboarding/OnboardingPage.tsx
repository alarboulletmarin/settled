import { fr } from '@/i18n/fr'
import { useStore } from '@/store/store'
import { Button } from '@/ui/Button'

/** Remplacé en phase 4 par le parcours en deux étapes du cahier §4.1. */
export function OnboardingPage() {
  const finishOnboarding = useStore((s) => s.finishOnboarding)
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="t-hero">{fr.app.name}</h1>
      <p className="t-body text-muted">{fr.app.tagline}</p>
      <Button onClick={finishOnboarding}>{fr.common.next}</Button>
    </div>
  )
}
