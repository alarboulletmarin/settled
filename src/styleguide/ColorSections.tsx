import { fr } from '@/i18n/fr'
import { Section, SubTitle } from './Section'
import { ThemePane } from './ThemePane'
import { BASE_PALETTE, CATEGORY_PALETTE, SEMANTIC_TOKENS, type TokenEntry } from './tokens.data'

function Swatch({ entry }: { entry: TokenEntry }) {
  return (
    <li className="flex flex-col gap-2">
      <span
        className="h-14 rounded-inner border border-border"
        style={{ backgroundColor: `var(${entry.name})` }}
      />
      <span className="t-axis">{entry.name}</span>
      <span className="t-label">{entry.value}</span>
    </li>
  )
}

export function BasePaletteSection() {
  return (
    <Section title={fr.styleguide.sections.base} note={fr.styleguide.baseNote}>
      {BASE_PALETTE.map((group) => (
        <div key={group.title} className="flex flex-col gap-3">
          <SubTitle>{group.title}</SubTitle>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {group.entries.map((entry) => (
              <Swatch key={entry.name} entry={entry} />
            ))}
          </ul>
        </div>
      ))}
    </Section>
  )
}

function SemanticList() {
  return (
    <ul className="flex flex-col gap-2">
      {SEMANTIC_TOKENS.map((entry) => (
        <li key={entry.name} className="flex items-center gap-3">
          <span
            className="size-8 shrink-0 rounded-inner border border-border"
            style={{ backgroundColor: `var(${entry.name})` }}
          />
          <span className="t-axis w-52 shrink-0">{entry.name}</span>
          <span className="t-label truncate">{entry.value}</span>
        </li>
      ))}
    </ul>
  )
}

export function SemanticTokensSection() {
  return (
    <Section title={fr.styleguide.sections.semantic} note={fr.styleguide.semanticNote}>
      <div className="grid gap-4 md:grid-cols-2">
        <ThemePane theme="light">
          <SemanticList />
        </ThemePane>
        <ThemePane theme="dark">
          <SemanticList />
        </ThemePane>
      </div>
    </Section>
  )
}

export function CategoryPaletteSection() {
  return (
    <Section title={fr.styleguide.sections.categories} note={fr.styleguide.categoriesNote}>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {CATEGORY_PALETTE.map((entry) => (
          <Swatch key={entry.name} entry={entry} />
        ))}
      </ul>
    </Section>
  )
}
