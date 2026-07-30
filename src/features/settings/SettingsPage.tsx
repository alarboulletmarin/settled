import { fr } from '@/i18n/fr'
import { useStore } from '@/store/store'
import { Eyebrow } from '@/ui/Eyebrow'
import { PageTitle } from '@/ui/PageTitle'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'
import { CategoriesSection } from './CategoriesSection'
import { DataSection } from './DataSection'
import { HouseholdSection } from './HouseholdSection'

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
      <Eyebrow>{fr.theme.label}</Eyebrow>
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

export function SettingsPage() {
  return (
    <>
      <PageTitle title={fr.nav.settings} />
      <div className="flex max-w-3xl flex-col gap-4">
        <HouseholdSection />
        <CategoriesSection />
        <ThemeSection />
        <DataSection />
      </div>
    </>
  )
}
