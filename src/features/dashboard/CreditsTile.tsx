import { Link } from 'react-router-dom'
import { totalRemaining } from '@/domain/debt'
import { CREDITS_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { useDebtStatuses } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { CreditsIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'

/**
 * Ce qu'il reste à devoir, tous crédits confondus, et le chemin vers le détail.
 * La tuile disparaît sans crédit suivi : une ligne à zéro n'apprend rien, et
 * l'écran du mois n'a pas à porter une case vide.
 */
export function CreditsTile() {
  const statuses = useDebtStatuses()
  if (statuses.length === 0) return null

  const remaining = totalRemaining(statuses)
  const running = statuses.filter((status) => !status.settled).length

  return (
    <Tile span="2x2" className="justify-between">
      <Eyebrow icon={CreditsIcon}>{fr.dashboard.credits}</Eyebrow>
      <div className="flex flex-col gap-1">
        <Amount value={remaining} size="tile" />
        <span className="t-label">{fr.dashboard.creditsRemaining}</span>
        <Link
          to={CREDITS_PATH}
          className="t-label inline-flex min-h-11 w-fit items-center rounded-input underline underline-offset-2"
        >
          {tpl(running > 1 ? '%s crédits' : '%s crédit', running)}
        </Link>
      </div>
    </Tile>
  )
}
