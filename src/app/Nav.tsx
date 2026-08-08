import { NavLink, useLocation } from 'react-router-dom'
import { fr } from '@/i18n/fr'
import { cn } from '@/lib/cn'
import { scrollToTop } from '@/lib/reveal'
import { ABOUT_PATH, NAV_ROUTES, SETTINGS_PATH, STYLEGUIDE_ROUTE } from './routes'

/* Un onglet ramène en haut de sa section, qu'on y soit déjà ou non — c'est ce
   que fait le logo d'un site. Sans ça, toucher l'onglet actif ne produisait
   rien, et changer d'onglet rouvrait l'écran suivant à la hauteur qu'on avait
   quittée sur le précédent. Le bouton « retour » du navigateur, lui, n'est pas
   concerné : il n'y a que la navigation par onglet qui remonte. */

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
      {/* Le nom est facultatif — il ne se demande plus au premier lancement.
          Vide, la seconde ligne ne s'affiche pas plutôt que de tenir une place
          blanche : le nom de l'app est au-dessus, et il suffit à dire où l'on
          est. Aucun repli à inventer. */}
      <div className="mb-6 flex flex-col gap-0.5 px-3">
        <span className="t-eyebrow text-muted">{fr.app.name}</span>
        {householdName.trim() !== '' && (
          <span className="t-section truncate">{householdName}</span>
        )}
      </div>

      {NAV_ROUTES.map((route) => {
        const Icon = route.icon
        return (
          <NavLink
            key={route.path}
            to={route.path}
            end={route.path === '/'}
            onClick={scrollToTop}
            className={({ isActive }) =>
              cn(
                ITEM,
                'h-11 justify-start gap-3',
                isActive ? 'bg-accent text-accent-fg' : 'hover:bg-surface-2',
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            {route.label}
          </NavLink>
        )
      })}

      {/* Les deux liens secondaires se groupent, et c'est le groupe qui porte
          le `mt-auto`. « À propos » au-dessus : c'est le seul des deux qui
          s'adresse à qui utilise l'app. */}
      <div className="mt-auto flex flex-col gap-1">
        {[
          { path: ABOUT_PATH, label: fr.nav.about },
          STYLEGUIDE_ROUTE,
        ].map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              cn(
                ITEM,
                'h-11 justify-start text-muted',
                isActive ? 'bg-surface-2 text-text' : 'hover:bg-surface-2',
              )
            }
          >
            {route.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/** Barre d'onglets mobile. Cible tactile de 56px, au-delà du minimum du DS. */
export function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label={fr.nav.label}
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface lg:hidden',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="flex">
        {NAV_ROUTES.map((route) => {
          const Icon = route.icon
          /* Les vues des réglages allument leur onglet toutes seules — elles
             sont sous `/reglages`, que `NavLink` apparie par préfixe. « À
             propos », non : elle vit à la racine parce qu'elle parle de l'app
             et répond avant même qu'un foyer existe. Or sous 1024px on n'y
             arrive que par les réglages, et la barre disait alors qu'on avait
             quitté la section — cinq onglets éteints, sans aucun moyen de
             savoir d'où l'on venait. La colonne latérale, elle, porte son
             propre lien « À propos » et n'a pas ce trou. */
          const inSection = route.path === SETTINGS_PATH && pathname.startsWith(ABOUT_PATH)
          return (
            <li key={route.path} className="min-w-0 flex-1">
              <NavLink
                to={route.path}
                end={route.path === '/'}
                onClick={scrollToTop}
                className={({ isActive }) =>
                  cn(
                    'flex h-14 flex-col items-center justify-center gap-0.5 px-1 text-center',
                    'text-[11px] leading-tight',
                    isActive || inSection ? 'text-text' : 'text-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* L'onglet actif est une pilule lime derrière le glyphe.
                        Le DS interdit lime en `color` — faute de contraste sur
                        les deux fonds — mais pas en remplissage, et c'est
                        justement là que la marque doit se voir. */}
                    <span
                      className={cn(
                        'flex h-7 w-12 items-center justify-center rounded-chip',
                        'transition-colors duration-[var(--dur)] ease-ds',
                        (isActive || inSection) && 'bg-accent text-accent-fg',
                      )}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="w-full truncate">{route.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
