import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { CreditFormPage } from '@/features/credits/CreditFormPage'
import { CreditsPage } from '@/features/credits/CreditsPage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { EntryPage } from '@/features/month/EntryPage'
import { MonthPage } from '@/features/month/MonthPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { RecurrenceDetailPage } from '@/features/recurrences/RecurrenceDetailPage'
import { RecurrenceFormPage } from '@/features/recurrences/RecurrenceFormPage'
import { RecurrencesPage } from '@/features/recurrences/RecurrencesPage'
import { SavingsPage } from '@/features/savings/SavingsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { SplitPage } from '@/features/split/SplitPage'
import { useStore } from '@/store/store'
import { StyleguidePage } from '@/styleguide/StyleguidePage'
import { useApplyTheme } from '@/theme/useTheme'
import { RECURRENCES_PATH, RECURRENCE_NEW_PATH } from './routes'
import { Toaster } from '@/ui/Toaster'
import { CurrencyContext } from '@/ui/currency'
import { AppShell } from './AppShell'
import { BootScreen } from './BootScreen'
import { UpdatePrompt } from './UpdatePrompt'

/** Les routes de l'app, une fois le foyer créé. */
function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<MonthPage />} />
        <Route path="/depense" element={<EntryPage />} />
        <Route path="/depense/:id" element={<EntryPage />} />
        <Route path="/calendrier" element={<CalendarPage />} />
        <Route path={RECURRENCES_PATH} element={<RecurrencesPage />} />
        <Route path={RECURRENCE_NEW_PATH} element={<RecurrenceFormPage />} />
        <Route path={`${RECURRENCES_PATH}/:id`} element={<RecurrenceDetailPage />} />
        <Route path={`${RECURRENCES_PATH}/:id/modifier`} element={<RecurrenceFormPage />} />
        {/* L'écran s'appelait « Abonnements », et son URL le disait. Un lien
            partagé, un signet ou une icône posée sur l'écran d'accueil pointent
            encore là : ils atterrissent sur la liste plutôt que sur le mois. */}
        <Route path="/abonnements/*" element={<Navigate to={RECURRENCES_PATH} replace />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/credits/nouveau" element={<CreditFormPage />} />
        <Route path="/credits/:id" element={<CreditFormPage />} />
        <Route path="/repartition" element={<SplitPage />} />
        <Route path="/epargne" element={<SavingsPage />} />
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
        <UpdatePrompt />
      </BrowserRouter>
    </CurrencyContext>
  )
}
