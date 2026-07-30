import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { MonthPage } from '@/features/month/MonthPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { RecurrencesPage } from '@/features/recurrences/RecurrencesPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { useStore } from '@/store/store'
import { StyleguidePage } from '@/styleguide/StyleguidePage'
import { useApplyTheme } from '@/theme/useTheme'
import { Toaster } from '@/ui/Toaster'
import { CurrencyContext } from '@/ui/currency'
import { AppShell } from './AppShell'
import { BootScreen } from './BootScreen'

/** Les routes de l'app, une fois le foyer créé. */
function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<MonthPage />} />
        <Route path="/calendrier" element={<CalendarPage />} />
        <Route path="/abonnements" element={<RecurrencesPage />} />
        <Route path="/historique" element={<HistoryPage />} />
        <Route path="/reglages" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

function Booted() {
  const status = useStore((s) => s.status)
  if (status === 'loading') return <BootScreen />
  if (status === 'onboarding') return <OnboardingPage />
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

  return (
    <CurrencyContext value={currency}>
      <BrowserRouter>
        <Routes>
          {/* Livrable permanent, joignable à tout moment — y compris avant
              que le foyer ne soit créé. */}
          <Route path="/styleguide" element={<StyleguidePage />} />
          <Route path="*" element={<Booted />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </CurrencyContext>
  )
}
