import { useNavigate } from 'react-router-dom'
import { totalRemaining } from '@/domain/debt'
import { CREDITS_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useDebtStatuses } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { CreditsIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/**
 * Ce qu'il reste à devoir, tous crédits confondus, et le chemin vers le détail.
 * La tuile disparaît sans crédit suivi : une ligne à zéro n'apprend rien, et
 * l'écran du mois n'a pas à porter une case vide.
 *
 * **`2x1`, et non plus `2x2`.** C'est une synthèse, pas une lecture du mois :
 * on ne consulte pas trois fois par jour ce qu'on doit encore sur une voiture.
 * Une demi-colonne suffit à la porter, et la paire qu'elle forme avec la
 * Répartition rend au tableau de bord des tuiles de tailles inégales — ce que
 * des blocs pleine largeur empilés ne font pas. Ses deux lectures — ce que le
 * chiffre est, et combien de crédits courent — tenaient sur deux lignes ; elles
 * se joignent en une, qui suit le seuil des tuiles plates (DS §5) et se lit
 * entière dans le nom accessible.
 */
export function CreditsTile() {
  const statuses = useDebtStatuses()
  const currency = useCurrency()
  const navigate = useNavigate()
  if (statuses.length === 0) return null

  const remaining = totalRemaining(statuses)
  const running = statuses.filter((status) => !status.settled).length
  const hint = tpl(
    '%s · %s',
    fr.dashboard.creditsRemaining,
    tpl(running > 1 ? fr.dashboard.creditsRunningMany : fr.dashboard.creditsRunningOne, running),
  )

  return (
    <Tile
      span="2x1"
      className="justify-between"
      onClick={() => {
        void navigate(CREDITS_PATH)
      }}
      /* Comme la Répartition voisine : le nom accessible porte les chiffres,
         puisque l'`aria-label` d'un bouton remplace ce qu'il contient. */
      label={tpl(fr.dashboard.srCreditsTile, formatMoney(remaining, currency), hint)}
      affordance={{ kind: 'navigate' }}
    >
      <Eyebrow icon={CreditsIcon}>{fr.dashboard.credits}</Eyebrow>
      <div className="flex flex-wrap items-baseline gap-x-2">
        {/* Sans les centimes, seul chiffre de la grille dans ce cas : un
            capital restant dû tient six chiffres, et « 217 182,47 € » demande
            140px là où une demi-colonne en offre 139 à 390px — le symbole se
            faisait trancher au bord. Le DS §3 tranche la question : une lecture
            qui masque les centimes **arrondit** l'unité, elle ne la tronque
            pas, et deux centimes ne changent rien à un capital qu'on met
            quinze ans à rendre. Le montant exact reste dans le nom accessible,
            et sur l'écran au bout du chevron. */}
        <Amount value={remaining} size="tile-fit" withCents={false} />
        <span className="t-label tile-hint">{hint}</span>
      </div>
    </Tile>
  )
}
