import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LandingPage } from '@/features/landing/LandingPage'
import { onPageHidden } from '@/persistence/lifecycle'
import { useStore } from '@/store/store'
import { StyleguidePage } from '@/styleguide/StyleguidePage'
import { useApplyTheme } from '@/theme/useTheme'
import { Toaster } from '@/ui/Toaster'
import { CurrencyContext } from '@/ui/currency'
import { BootScreen } from './BootScreen'
import { AppRoutes, OnboardingRoutes } from './Routes'
import { LANDING_PATH } from './routes'
import { UpdatePrompt } from './UpdatePrompt'

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
        <Toaster />
        <UpdatePrompt />
      </BrowserRouter>
    </CurrencyContext>
  )
}
