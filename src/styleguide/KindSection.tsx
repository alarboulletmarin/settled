import type { CategoryKind } from '@/domain/types'
import { directionOfKind, isSpending } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { Eyebrow } from '@/ui/Eyebrow'
import { Section } from './Section'
import { DualTheme } from './ThemePane'

const KINDS: CategoryKind[] = ['resource', 'charge', 'debt', 'saving']

/**
 * Les quatre natures et ce qu'elles impliquent, côte à côte. C'est le tableau
 * qui rend visible la seule subtilité du modèle : `debt` et `saving` sortent
 * du compte toutes les deux, mais une seule est consommée.
 */
export function KindSection() {
  return (
    <Section title={fr.styleguide.sections.kinds} note={fr.styleguide.kindsNote}>
      <DualTheme stacked>
        <div className="overflow-x-auto">
          <table className="w-full min-w-100 border-collapse text-left">
            <thead>
              <tr className="t-axis">
                <th className="py-2 pr-3 font-normal">{fr.settings.familyKind}</th>
                <th className="py-2 pr-3 font-normal">{fr.entry.direction}</th>
                <th className="py-2 font-normal">{fr.dashboard.spendingHint}</th>
              </tr>
            </thead>
            <tbody>
              {KINDS.map((kind) => (
                <tr key={kind} className="border-t border-border">
                  <td className="py-2 pr-3">
                    <Eyebrow>{fr.kinds[kind]}</Eyebrow>
                  </td>
                  <td className="t-body py-2 pr-3">
                    {directionOfKind(kind) === 'in' ? fr.direction.in : fr.direction.out}
                  </td>
                  <td className="t-body py-2">{isSpending(kind) ? fr.common.yes : fr.common.no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DualTheme>
    </Section>
  )
}
