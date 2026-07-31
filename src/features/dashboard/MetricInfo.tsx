import { fr } from '@/i18n/fr'
import { Sheet } from '@/ui/Sheet'

export type MetricKey = 'balance' | 'forecast' | 'remaining' | 'capacity'

const CONTENT: Record<MetricKey, { title: string; formula: string; body: readonly string[] }> = {
  balance: {
    title: fr.dashboard.balance,
    formula: fr.dashboard.info.balanceFormula,
    body: fr.dashboard.info.balanceBody,
  },
  forecast: {
    title: fr.dashboard.forecast,
    formula: fr.dashboard.info.forecastFormula,
    body: fr.dashboard.info.forecastBody,
  },
  remaining: {
    title: fr.dashboard.remaining,
    formula: fr.dashboard.info.remainingFormula,
    body: fr.dashboard.info.remainingBody,
  },
  capacity: {
    title: fr.dashboard.capacity,
    formula: fr.dashboard.info.capacityFormula,
    body: fr.dashboard.info.capacityBody,
  },
}

/**
 * Ce que dit un chiffre du tableau de bord, et ce qui le distingue de ses
 * voisins.
 *
 * Quatre tuiles portent un solde qui se ressemble à l'œil sans dire la même
 * chose. Leur lecture secondaire l'explique — mais une tuile d'une rangée fait
 * 88px, et cette ligne n'y tient qu'au-delà de 1024px : sur un téléphone,
 * l'explication existait sans jamais s'afficher. Elle est désormais à un
 * toucher, dans la feuille modale que le design system avait prévue.
 */
export function MetricInfo({
  metric,
  onClose,
}: {
  metric: MetricKey | null
  onClose: () => void
}) {
  const content = metric === null ? null : CONTENT[metric]

  return (
    <Sheet open={content !== null} onClose={onClose} title={content?.title ?? ''}>
      {content !== null && (
        <div className="flex flex-col gap-4">
          <p className="t-axis tnum rounded-inner bg-surface-2 px-3 py-2.5">{content.formula}</p>
          {content.body.map((paragraph) => (
            <p key={paragraph} className="t-body">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </Sheet>
  )
}
