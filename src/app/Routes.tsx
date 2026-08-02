import { Navigate, Route, Routes } from 'react-router-dom'
import { AdvanceFormPage } from '@/features/advances/AdvanceFormPage'
import { AboutPage } from '@/features/about/AboutPage'
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
import { AppShell } from './AppShell'
import { PlainShell } from './PlainShell'
import {
  ABOUT_PATH,
  ADVANCE_NEW_PATH,
  LANDING_PATH,
  ONBOARDING_PATH,
  RECURRENCES_PATH,
  RECURRENCE_NEW_PATH,
} from './routes'

/** Les routes de l'app, une fois le foyer créé. */
export function AppRoutes() {
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
        <Route path={ADVANCE_NEW_PATH} element={<AdvanceFormPage />} />
        <Route path="/historique" element={<HistoryPage />} />
        <Route path="/reglages" element={<SettingsPage />} />
        {/* Déclarée ici *et* dans les routes d'avant le foyer, pour qu'elle
            hérite de la navigation quand celle-ci existe. La hisser au niveau de
            `/styleguide` l'en aurait privée une fois le foyer créé : pas de
            barre d'onglets sous 1024px, donc plus de sortie. */}
        <Route path={ABOUT_PATH} element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

/**
 * Les routes d'avant le foyer. Deux destinations, et un filet.
 *
 * Le filet ne mène pas aux questions mais à la présentation. Un signet vers
 * `/calendrier` ouvert sur un appareil neuf — ou juste après « Tout effacer » —
 * y atterrissait sans qu'aucune URL ne change : l'app affichait le formulaire à
 * l'adresse d'un écran qui n'existait pas encore. C'est aussi ce qui fait qu'une
 * remise à zéro depuis les réglages retombe sur ce qui explique l'app, et non
 * sur un formulaire nu.
 */
export function OnboardingRoutes() {
  /* Un document illisible n'ouvre pas les deux questions. La garde ne peut pas
     vivre seulement dans le bouton de l'arrivée : cette URL est un signet, et
     `finishOnboarding` écraserait là ce qu'on n'a pas su lire. Elle refuse deux
     fois — ici pour ne pas montrer le formulaire, dans le store pour ne pas
     écrire — parce qu'un seul des deux verrous se contourne. */
  const unreadable = useStore((s) => s.error?.kind === 'read')

  return (
    <Routes>
      <Route
        path={ONBOARDING_PATH}
        element={unreadable ? <Navigate to={LANDING_PATH} replace /> : <OnboardingPage />}
      />
      {/* Sans coquille : la colonne latérale nommerait un foyer sans nom et
          mènerait à cinq écrans qui n'existent pas encore. */}
      <Route
        path={ABOUT_PATH}
        element={
          <PlainShell>
            <AboutPage />
          </PlainShell>
        }
      />
      <Route path="*" element={<Navigate to={LANDING_PATH} replace />} />
    </Routes>
  )
}
