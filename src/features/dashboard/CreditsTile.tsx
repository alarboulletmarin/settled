import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  if (statuses.length === 0) return null

  const remaining = totalRemaining(statuses)
  const running = statuses.filter((status) => !status.settled).length

  return (
    /* La tuile entière mène au détail, comme la capacité d'épargne mène à
       l'épargne. Elle portait jusqu'ici un lien de la taille du compte de
       crédits, posé dans une tuile morte : deux motifs opposés pour le même
       travail, et le plus petit des deux était la seule porte. Le compte reste,
       en texte — c'est une lecture, pas un chemin. */
    <Tile
      span="2x2"
      className="justify-between"
      onClick={() => {
        void navigate(CREDITS_PATH)
      }}
      label={tpl(fr.dashboard.showCredits, fr.dashboard.credits)}
      affordance={{ kind: 'navigate' }}
    >
      <Eyebrow icon={CreditsIcon}>{fr.dashboard.credits}</Eyebrow>
      <div className="flex flex-col gap-1">
        <Amount value={remaining} size="tile-fit" />
        <span className="t-label">{fr.dashboard.creditsRemaining}</span>
        <span className="t-label">
          {tpl(running > 1 ? fr.dashboard.creditsRunningMany : fr.dashboard.creditsRunningOne, running)}
        </span>
      </div>
    </Tile>
  )
}
