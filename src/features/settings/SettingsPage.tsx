import { Link } from 'react-router-dom'
import { ABOUT_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { useStore } from '@/store/store'
import { Eyebrow } from '@/ui/Eyebrow'
import { InfoIcon, ThemeIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'
import { CategoriesSection } from './CategoriesSection'
import { DataSection } from './DataSection'
import { HouseholdSection } from './HouseholdSection'
import { StorageSection } from './StorageSection'

const THEME_OPTIONS = [
  { value: 'light' as const, label: fr.theme.light },
  { value: 'dark' as const, label: fr.theme.dark },
  { value: 'system' as const, label: fr.theme.system },
]

function ThemeSection() {
  const theme = useStore((s) => s.data.settings.theme)
  const setTheme = useStore((s) => s.setTheme)
  return (
    <Tile className="gap-3">
      <Eyebrow icon={ThemeIcon}>{fr.theme.label}</Eyebrow>
      <p className="t-label">{fr.settings.themeHint}</p>
      <Segmented
        options={THEME_OPTIONS}
        value={theme}
        onChange={setTheme}
        label={fr.theme.label}
        className="w-fit"
      />
    </Tile>
  )
}

/**
 * Après la tuile des données, et non avant : sa triple confirmation clôt un
 * sujet, pas la page, et « à propos » est ce qu'on lit quand on n'a plus rien à
 * régler. C'est surtout **la seule porte vers `/a-propos` sous 1024px** — la
 * barre d'onglets ne peut pas en porter une sixième sans tronquer un libellé.
 */
function AboutSection() {
  return (
    <Tile className="gap-3">
      <Eyebrow icon={InfoIcon}>{fr.nav.about}</Eyebrow>
      <p className="t-label">{fr.about.whatBody}</p>
      <Link
        to={ABOUT_PATH}
        className="t-label inline-flex min-h-11 w-fit items-center rounded-input underline underline-offset-2"
      >
        {fr.settings.aboutLink}
      </Link>
    </Tile>
  )
}

export function SettingsPage() {
  return (
    <>
      <PageTitle title={fr.nav.settings} />
      <div className="flex max-w-3xl flex-col gap-4">
        <HouseholdSection />
        <CategoriesSection />
        <ThemeSection />
        {/* Avant les données : celle-ci dit où elles vivent, la suivante
            comment les en faire sortir — et se termine sur un effacement, qui
            clôt un sujet plutôt qu'il n'en ouvre un. */}
        <StorageSection />
        <DataSection />
        <AboutSection />
      </div>
    </>
  )
}
