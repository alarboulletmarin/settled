import { fr } from '@/i18n/fr'
import { useStore } from '@/store/store'
import { PageTitle } from '@/ui/PageTitle'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'

const THEME_OPTIONS = [
  { value: 'light' as const, label: fr.theme.light },
  { value: 'dark' as const, label: fr.theme.dark },
  { value: 'system' as const, label: fr.theme.system },
]

export function SettingsPage() {
  const theme = useStore((s) => s.data.settings.theme)
  const setTheme = useStore((s) => s.setTheme)

  return (
    <>
      <PageTitle title={fr.nav.settings} />
      <div className="flex max-w-2xl flex-col gap-4">
        <Tile>
          <h2 className="t-body font-medium">{fr.theme.label}</h2>
          <p className="t-label mt-1 mb-4">{fr.settings.themeHint}</p>
          <Segmented options={THEME_OPTIONS} value={theme} onChange={setTheme} label={fr.theme.label} />
        </Tile>
      </div>
    </>
  )
}
