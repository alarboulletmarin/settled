import { fr } from '@/i18n/fr'
import { useTheme } from '@/theme/useTheme'
import { Segmented } from '@/ui/Segmented'
import { BasePaletteSection, CategoryPaletteSection, SemanticTokensSection } from './ColorSections'
import { ControlsSection } from './ControlsSection'
import { ListSection } from './ListSection'
import { RingSection } from './RingSection'
import { BentoSection, TileSection } from './TileSection'
import { ShapesSection, TypographySection } from './TypeSection'

const THEME_OPTIONS = [
  { value: 'light' as const, label: fr.theme.light },
  { value: 'dark' as const, label: fr.theme.dark },
  { value: 'system' as const, label: fr.theme.system },
]

/**
 * Livrable permanent : chaque token, chaque échelle typographique et chaque
 * composant du design system, dans les deux thèmes. Reste à jour tout au long
 * du projet.
 */
export function StyleguidePage() {
  const { preference, setPreference } = useTheme()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="t-eyebrow text-muted">{fr.app.name}</p>
          <h1 className="t-hero">{fr.styleguide.title}</h1>
          <p className="t-label max-w-prose">{fr.styleguide.subtitle}</p>
        </div>
        <Segmented
          options={THEME_OPTIONS}
          value={preference}
          onChange={setPreference}
          label={fr.theme.label}
        />
      </header>

      <BasePaletteSection />
      <SemanticTokensSection />
      <CategoryPaletteSection />
      <TypographySection />
      <ShapesSection />
      <TileSection />
      <ListSection />
      <RingSection />
      <ControlsSection />
      <BentoSection />
    </div>
  )
}
