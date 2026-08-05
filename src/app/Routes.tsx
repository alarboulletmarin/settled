import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdvanceFormPage } from '@/features/advances/AdvanceFormPage'
import { AboutPage } from '@/features/about/AboutPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { CreditFormPage } from '@/features/credits/CreditFormPage'
import { CreditsPage } from '@/features/credits/CreditsPage'
import { EntryPage } from '@/features/month/EntryPage'
import { MonthPage } from '@/features/month/MonthPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { RecurrenceDetailPage } from '@/features/recurrences/RecurrenceDetailPage'
import { RecurrenceFormPage } from '@/features/recurrences/RecurrenceFormPage'
import { RecurrencesPage } from '@/features/recurrences/RecurrencesPage'
import { SavingsPage } from '@/features/savings/SavingsPage'
import { SplitPage } from '@/features/split/SplitPage'
import { fr } from '@/i18n/fr'
import { useStore } from '@/store/store'
import { AppShell } from './AppShell'
import { PlainShell } from './PlainShell'
import {
  ABOUT_PATH,
  ADVANCE_NEW_PATH,
  LANDING_PATH,
  LEGAL_NOTICE_PATH,
  ONBOARDING_PATH,
  PRIVACY_PATH,
  RECURRENCES_PATH,
  RECURRENCE_NEW_PATH,
  TERMS_PATH,
} from './routes'

/**
 * Les deux écrans qu'on n'ouvre pas tous les jours, et qui pèsent le plus.
 *
 * L'historique emporte avec lui les trois graphiques de `src/charts` — barres,
 * lignes cumulées, curseur —, dont aucun autre écran ne se sert. Les réglages
 * emportent l'import, l'export, les sauvegardes et le catalogue de catégories.
 * Ni l'un ni l'autre n'est sur le chemin du geste quotidien, qui est d'ouvrir
 * son mois et d'y saisir une ligne.
 *
 * Le reste ne se découpe pas : le mois, la saisie, le calendrier et les fiches
 * s'atteignent en un geste depuis n'importe où, et un aller-retour de réseau à
 * chaque fois coûterait plus que les quelques kilo-octets gagnés. Le service
 * worker précache de toute façon tous ces morceaux — un écran chargé à la
 * demande reste joignable hors ligne dès la seconde visite.
 */
const HistoryPage = lazy(async () => ({
  default: (await import('@/features/history/HistoryPage')).HistoryPage,
}))
const SettingsPage = lazy(async () => ({
  default: (await import('@/features/settings/SettingsPage')).SettingsPage,
}))

/**
 * Les trois pages juridiques, dans un seul morceau.
 *
 * Elles sortent du même module, donc `lazy` n'en produit qu'un : leur prose —
 * plusieurs kilo-octets que personne ne lit deux fois — ne pèse sur le premier
 * chargement de personne, et ouvrir l'une des trois les amène toutes, ce qui est
 * exactement l'usage (on arrive sur les mentions et on va lire la
 * confidentialité).
 */
const LegalNoticePage = lazy(async () => ({
  default: (await import('@/features/legal/LegalPage')).LegalNoticePage,
}))
const PrivacyPage = lazy(async () => ({
  default: (await import('@/features/legal/LegalPage')).PrivacyPage,
}))
const TermsPage = lazy(async () => ({
  default: (await import('@/features/legal/LegalPage')).TermsPage,
}))

/**
 * L'attente d'un écran qui arrive par le réseau.
 *
 * Discrète, et sans anneau : la coquille est déjà là — navigation, bandeau,
 * titre —, et seul le contenu manque. Un écran de chargement pleine page à sa
 * place ferait clignoter tout ce qui n'a pas bougé. La région live de la
 * coquille, elle, a déjà annoncé le titre de l'écran où l'on arrive.
 */
function RouteFallback() {
  return <p className="t-label">{fr.shell.loading}</p>
}

/** Les routes de l'app, une fois le foyer créé. */
export function AppRoutes() {
  return (
    <AppShell>
      {/* Autour des routes et non dans chacune : le repli remplace le contenu
          de la coquille, qui reste en place. */}
      <Suspense fallback={<RouteFallback />}>
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
          {/* Mêmes raisons que « à propos » : elles parlent du site et non d'un
              foyer, et elles héritent ici de la navigation. */}
          <Route path={LEGAL_NOTICE_PATH} element={<LegalNoticePage />} />
          <Route path={PRIVACY_PATH} element={<PrivacyPage />} />
          <Route path={TERMS_PATH} element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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
    /* Les trois pages juridiques arrivent par le réseau ici aussi : sans ce
       `Suspense`, l'attente remonterait jusqu'à la racine, qui n'en a pas. */
    <Suspense fallback={<RouteFallback />}>
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
        {/* L'obligation de se rendre identifiable ne commence pas à la création
            du premier foyer : ces trois-là répondent avant, sans quoi le pied de
            la présentation — le seul écran que voit un visiteur qui ne crée
            rien — pointerait vers des adresses qui redirigent. */}
        <Route
          path={LEGAL_NOTICE_PATH}
          element={
            <PlainShell>
              <LegalNoticePage />
            </PlainShell>
          }
        />
        <Route
          path={PRIVACY_PATH}
          element={
            <PlainShell>
              <PrivacyPage />
            </PlainShell>
          }
        />
        <Route
          path={TERMS_PATH}
          element={
            <PlainShell>
              <TermsPage />
            </PlainShell>
          }
        />
        <Route path="*" element={<Navigate to={LANDING_PATH} replace />} />
      </Routes>
    </Suspense>
  )
}
