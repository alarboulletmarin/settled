import { useNavigate } from 'react-router-dom'
import { SPLIT_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { formatMoney, formatPercent, tpl } from '@/i18n/format'
import { useMemberFilter, useMemberMap, useMonthSplit } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { SplitIcon } from '@/ui/Icons'
import { Ring, type RingSegment } from '@/ui/Ring'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { DONUT_SIZE, DONUT_THICKNESS } from './donut'

/**
 * Ce que chacun verse sur les charges communes du mois, et le chemin vers le
 * détail du calcul.
 *
 * Elle s'efface dans deux cas. Sans les revenus de tout le monde, il n'y a pas
 * de prorata à afficher — et un zéro serait un mensonge plutôt qu'un vide.
 * Sous un filtre par membre, elle n'aurait plus rien à montrer : une charge
 * commune n'appartient à personne, donc aucune ne passe le filtre. La faire
 * disparaître dit ça mieux qu'une tuile à zéro.
 */
export function SplitTile() {
  const { total, shares } = useMonthSplit()
  const members = useMemberMap()
  const filter = useMemberFilter()
  const currency = useCurrency()
  const navigate = useNavigate()

  const open = (): void => {
    void navigate(SPLIT_PATH)
  }

  if (filter !== undefined || shares === null || total <= 0) return null

  const segments: RingSegment[] = shares.map((share) => ({
    id: share.memberId,
    value: share.shareBp / 10_000,
    color: members.get(share.memberId)?.color ?? 'var(--cat-rest)',
    label: members.get(share.memberId)?.name ?? '',
  }))

  const spoken = shares
    .map(
      (share) =>
        `${members.get(share.memberId)?.name ?? ''} ${formatMoney(share.due, currency)}`,
    )
    .join(', ')

  return (
    /* La tuile entière est la cible : un lien de 44px à l'intérieur ferait
       déborder les 148px de contenu d'une 2×2, et l'anneau remonterait sur
       l'eyebrow. La cible tactile y gagne, en prime. */
    <Tile span="2x2" className="gap-3" onClick={open} label={fr.dashboard.split}>
      <Eyebrow icon={SplitIcon}>{fr.dashboard.split}</Eyebrow>
      <div className="flex min-h-0 flex-1 items-center gap-4">
        <Ring
          size={DONUT_SIZE}
          thickness={DONUT_THICKNESS}
          segments={segments}
          label={fr.dashboard.split}
          srText={tpl(fr.split.srShares, spoken)}
          className="shrink-0"
        >
          <Amount value={total} size="label" direction="out" withCents={false} />
        </Ring>
        <ul className="flex min-w-0 flex-1 flex-col gap-1">
          {shares.map((share) => (
            <li key={share.memberId} className="flex items-center gap-2">
              <Dot color={members.get(share.memberId)?.color ?? 'var(--cat-rest)'} />
              <span className="t-label min-w-0 flex-1 truncate">
                {members.get(share.memberId)?.name ?? ''}
              </span>
              <span className="t-axis tnum shrink-0">
                {formatPercent(share.shareBp / 10_000)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="t-label underline underline-offset-2">{fr.dashboard.splitHint}</p>
    </Tile>
  )
}
