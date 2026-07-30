import { money } from '@/domain/money'
import { fr } from '@/i18n/fr'
import { Amount } from '@/ui/Amount'
import { Section, SubTitle } from './Section'
import { DualTheme } from './ThemePane'
import { MOTION, RADII, SPACING_SCALE, TYPE_SCALE } from './tokens.data'

const SAMPLE = money(128450)

function TypeScale() {
  return (
    <ul className="flex flex-col gap-6">
      {TYPE_SCALE.map((row) => (
        <li key={row.role} className="flex flex-col gap-1">
          <span className="t-axis">
            {row.role} · {row.detail}
          </span>
          <span className={row.className}>Solde du mois</span>
        </li>
      ))}
    </ul>
  )
}

export function TypographySection() {
  return (
    <Section title={fr.styleguide.sections.type} note={fr.styleguide.typeNote}>
      <DualTheme>
        <TypeScale />
      </DualTheme>

      <SubTitle>{fr.styleguide.sampleAmount}</SubTitle>
      <DualTheme>
        <div className="flex flex-col gap-4">
          <Amount value={SAMPLE} size="hero" />
          <Amount value={SAMPLE} size="tile" />
          <div className="flex items-center gap-4">
            <Amount value={SAMPLE} size="body" direction="in" />
            <Amount value={SAMPLE} size="body" direction="out" />
            <Amount value={money(-4290)} size="body" />
            <Amount value={money(-4290)} size="body" tone="danger" />
            <Amount value={SAMPLE} size="label" tone="muted" />
          </div>
        </div>
      </DualTheme>
    </Section>
  )
}

export function ShapesSection() {
  return (
    <Section title={fr.styleguide.sections.shapes} note={fr.styleguide.shapesNote}>
      <DualTheme>
        <div className="flex flex-col gap-6">
          <ul className="flex flex-wrap gap-4">
            {RADII.map((radius) => (
              <li key={radius.name} className="flex flex-col items-center gap-2">
                <span
                  className="size-16 bg-surface-2"
                  style={{ borderRadius: `var(${radius.name})` }}
                />
                <span className="t-axis">{radius.name}</span>
                <span className="t-label">{radius.value}</span>
              </li>
            ))}
          </ul>

          <ul className="flex flex-wrap items-end gap-3">
            {SPACING_SCALE.map((step) => (
              <li key={step} className="flex flex-col items-center gap-2">
                <span className="bg-accent-2" style={{ width: step, height: step }} />
                <span className="t-axis tnum">{step}</span>
              </li>
            ))}
          </ul>

          <ul className="flex flex-col gap-1">
            {MOTION.map((entry) => (
              <li key={entry.name} className="flex gap-3">
                <span className="t-axis w-28 shrink-0">{entry.name}</span>
                <span className="t-label">{entry.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </DualTheme>
    </Section>
  )
}
