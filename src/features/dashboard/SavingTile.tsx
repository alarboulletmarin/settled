import { savingCapacity, savingRate } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatPercent, tpl } from '@/i18n/format'
import { useKindTotals } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { RemainingIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'

/**
 * Capacité d'épargne : ressources − charges − crédits, donc avant versements.
 *
 * C'est ce que le solde du mois ne dit pas. Lui compte un versement comme une
 * sortie — exact en trésorerie — si bien qu'un mois où l'on met 300 € de côté
 * se lit comme un mois où l'on a dépensé 300 € de plus. Cette tuile répond à
 * l'autre question : combien pouvais-je mettre de côté, et combien l'ai-je
 * effectivement fait.
 */
export function SavingTile() {
  const totals = useKindTotals()
  const capacity = savingCapacity(totals)
  const rate = savingRate(totals)

  return (
    // 4×1 et non 2×1 : « CAPACITÉ D'ÉPARGNE » ne tient pas dans la centaine de
    // pixels utiles d'une demi-colonne mobile, et c'est de toute façon un
    // chiffre de tête de gondole, pas une valeur d'appoint.
    <Tile span="4x1" className="justify-between">
      <Eyebrow icon={RemainingIcon}>{fr.dashboard.capacity}</Eyebrow>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Amount value={capacity} size="tile-fit" tone={capacity < 0 ? 'danger' : 'default'} />
        <span className="t-label max-lg:sr-only">
          {rate === null
            ? fr.dashboard.savingRateNone
            : tpl(fr.dashboard.savingRate, formatPercent(rate))}
        </span>
      </div>
    </Tile>
  )
}
