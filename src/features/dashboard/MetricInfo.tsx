import { fr } from '@/i18n/fr'
import { Eyebrow } from '@/ui/Eyebrow'
import { Sheet } from '@/ui/Sheet'

export type MetricKey = 'balance' | 'forecast' | 'remaining' | 'capacity'

type Explanation = {
  title: string
  /** Ce que le chiffre est, en une phrase. */
  lead: string
  /** Comment il se calcule. */
  calculation: string
  /** Ce qui le sépare de son voisin — la vraie question devant la grille. */
  apart: string
}

const CONTENT: Record<MetricKey, Explanation> = {
  balance: { title: fr.dashboard.balance, ...fr.dashboard.info.balance },
  forecast: { title: fr.dashboard.forecast, ...fr.dashboard.info.forecast },
  remaining: { title: fr.dashboard.remaining, ...fr.dashboard.info.remaining },
  capacity: { title: fr.dashboard.capacity, ...fr.dashboard.info.capacity },
}

/**
 * Ce que dit un chiffre du tableau de bord, et ce qui le distingue de ses
 * voisins.
 *
 * Quatre tuiles portent un solde qui se ressemble à l'œil sans dire la même
 * chose. Leur lecture secondaire l'explique — mais une tuile d'une rangée fait
 * 88px, et cette ligne n'y tient qu'au-delà de 1024px : sur un téléphone,
 * l'explication existait sans jamais s'afficher.
 *
 * La phrase vient avant le calcul. L'inverse — ce qu'on lisait d'abord ici —
 * ouvre sur du vocabulaire qu'on n'a pas encore de quoi comprendre. Et le
 * calcul est composé comme du texte : sur quatre chiffres, deux « formules »
 * sont des phrases, et la mono de onze pixels des axes de graphique les
 * réduisait à deux lignes collées.
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
          <p className="t-body">{content.lead}</p>

          <section className="flex flex-col gap-2 border-t border-border pt-4">
            <Eyebrow>{fr.dashboard.info.calculationLabel}</Eyebrow>
            <p className="t-body">{content.calculation}</p>
          </section>

          <section className="flex flex-col gap-2 border-t border-border pt-4">
            <Eyebrow>{fr.dashboard.info.apartLabel}</Eyebrow>
            <p className="t-body">{content.apart}</p>
          </section>
        </div>
      )}
    </Sheet>
  )
}
