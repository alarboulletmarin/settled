import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { ExportReminder } from '@/features/settings/ExportReminder'
import { fr } from '@/i18n/fr'
import { useHouseholdName } from '@/store/selectors'
import { Sidebar, TabBar } from './Nav'

/** Coquille de l'app : navigation et gabarit. Aucune règle métier ici. */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const householdName = useHouseholdName()

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-input focus:bg-surface focus:px-4 focus:py-2"
      >
        {fr.a11y.skipToContent}
      </a>

      <div className="mx-auto flex w-full max-w-7xl">
        <Sidebar householdName={householdName} />
        <main
          id="contenu"
          key={pathname}
          className="view-enter min-w-0 flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-8 lg:pb-10"
        >
          <ExportReminder />
          {children}
        </main>
      </div>

      <TabBar />
    </>
  )
}
