import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { onPageHidden } from '@/persistence/lifecycle'
import { useStore } from '@/store/store'
import { useApplyTheme } from '@/theme/useTheme'
import { Toaster } from '@/ui/Toaster'
import { CurrencyContext } from '@/ui/currency'
import { BootScreen } from './BootScreen'
import { AppRoutes, OnboardingRoutes } from './Routes'
import { LANDING_PATH } from './routes'
import { UpdatePrompt } from './UpdatePrompt'

/**
 * Les deux écrans qui ne servent pas au foyer qui s'en sert tous les jours.
 *
 * Le nuancier est une route de développement : neuf cents lignes qui rendent
 * chaque token et chaque composant dans les deux thèmes, importées jusqu'ici
 * par tout le monde — pour un écran que personne n'ouvre depuis l'app. Il n'a
 * aucune raison de voyager avec elle.
 *
 * La présentation, elle, ne se voit qu'avant que le foyer n'existe : c'est le
 * seul écran dont le chargement à la demande se paie, et il se paie chez qui
 * arrive pour la première fois. Le compte reste bon — celui qui revient ouvre
 * son mois sans emporter la page qui explique l'app, et celui qui arrive
 * attend un aller-retour de moins que ce que lui coûtait la coquille entière.
 */
const StyleguidePage = lazy(async () => ({
  default: (await import('@/styleguide/StyleguidePage')).StyleguidePage,
}))
const LandingPage = lazy(async () => ({
  default: (await import('@/features/landing/LandingPage')).LandingPage,
}))

function Booted() {
  const status = useStore((s) => s.status)
  if (status === 'loading') return <BootScreen />
  if (status === 'onboarding') return <OnboardingRoutes />
  return <AppRoutes />
}

export function App() {
  const hydrate = useStore((s) => s.hydrate)
  const theme = useStore((s) => s.data.settings.theme)
  const currency = useStore((s) => s.data.settings.currency)
  useApplyTheme(theme)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  /* Le writer débounce à 400 ms : sans ce flush, fermer l'onglet dans la
     seconde qui suit une saisie la perdait, en silence. Le store est lu par
     `getState` plutôt que par un sélecteur — l'effet ne doit se réabonner à
     rien, il doit vivre aussi longtemps que la page. */
  useEffect(() => onPageHidden(() => void useStore.getState().flush()), [])

  return (
    <CurrencyContext value={currency}>
      <BrowserRouter>
        {/* L'écran d'attente est déjà celui de la relecture du document : ces
            deux-là arrivent par le réseau plutôt que d'IndexedDB, mais c'est la
            même attente, et elle se dit pareil. */}
        <Suspense fallback={<BootScreen />}>
          <Routes>
            {/* Livrable permanent, joignable à tout moment — y compris avant
                que le foyer ne soit créé. */}
            <Route path="/styleguide" element={<StyleguidePage />} />
            {/* La présentation ne parle pas d'un foyer, elle parle de l'app :
                elle répond donc dans les deux états, et surtout avant que
                l'hydratation ait dit lequel — c'est le premier écran, il n'a pas
                à attendre une lecture d'IndexedDB pour s'afficher. */}
            <Route path={LANDING_PATH} element={<LandingPage />} />
            <Route path="*" element={<Booted />} />
          </Routes>
        </Suspense>
        <Toaster />
        <UpdatePrompt />
      </BrowserRouter>
    </CurrencyContext>
  )
}
