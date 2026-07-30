import { NavLink } from 'react-router-dom'
import { fr } from '@/i18n/fr'
import { cn } from '@/lib/cn'
import { NAV_ROUTES, STYLEGUIDE_ROUTE } from './routes'

const ITEM = cn(
  'flex items-center justify-center rounded-input px-3 text-[13px] font-medium',
  'transition-colors duration-[var(--dur)] ease-ds',
)

/** Colonne latérale, à partir de la tablette. */
export function Sidebar({ householdName }: { householdName: string }) {
  return (
    <nav
      aria-label={fr.nav.label}
      className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 p-5 lg:flex"
    >
      <div className="mb-6 flex flex-col gap-0.5 px-3">
        <span className="t-eyebrow text-muted">{fr.app.name}</span>
        <span className="t-section truncate">{householdName}</span>
      </div>

      {NAV_ROUTES.map((route) => (
        <NavLink
          key={route.path}
          to={route.path}
          end={route.path === '/'}
          className={({ isActive }) =>
            cn(ITEM, 'h-11 justify-start', isActive ? 'bg-accent text-accent-fg' : 'hover:bg-surface-2')
          }
        >
          {route.label}
        </NavLink>
      ))}

      <NavLink
        to={STYLEGUIDE_ROUTE.path}
        className={({ isActive }) =>
          cn(
            ITEM,
            'mt-auto h-11 justify-start text-muted',
            isActive ? 'bg-surface-2 text-text' : 'hover:bg-surface-2',
          )
        }
      >
        {STYLEGUIDE_ROUTE.label}
      </NavLink>
    </nav>
  )
}

/** Barre d'onglets mobile. Cible tactile de 56px, au-delà du minimum du DS. */
export function TabBar() {
  return (
    <nav
      aria-label={fr.nav.label}
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface lg:hidden',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="flex">
        {NAV_ROUTES.map((route) => (
          <li key={route.path} className="min-w-0 flex-1">
            <NavLink
              to={route.path}
              end={route.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-14 flex-col items-center justify-center gap-1 px-1 text-center',
                  'text-[11px] leading-tight',
                  isActive ? 'text-text' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-1 w-6 rounded-chip transition-colors duration-[var(--dur)] ease-ds',
                      isActive ? 'bg-accent' : 'bg-transparent',
                    )}
                  />
                  <span className="truncate">{route.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
