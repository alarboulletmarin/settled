import { CREDITS_PATH, SPLIT_PATH } from '@/app/routes'
import { totalRemaining } from '@/domain/debt'
import { fr } from '@/i18n/fr'
import { formatPercent, tpl } from '@/i18n/format'
import {
  useDebtStatuses,
  useMemberFilter,
  useMemberMap,
  useMonthSplit,
} from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Row, RowGroup } from '@/ui/RowGroup'

/**
 * Les deux écrans que le mois n'a qu'à désigner.
 *
 * La répartition entre personnes et le capital restant dû sont utiles et ne
 * sont pas quotidiens : on ne consulte pas trois fois par jour ce qu'on doit
 * encore sur une voiture. Ils prenaient chacun une tuile `2x2`, soit deux fois
 * 188px de haut sur un téléphone, pour un anneau à deux parts et un chiffre
 * qu'on va vérifier ailleurs de toute façon — les deux tuiles menaient déjà à
 * leur écran.
 *
 * Deux rangées dans un seul cadre le disent, et rendent à la page la hauteur
 * qu'elles occupaient : c'est mot pour mot le raisonnement de `Trackers` sur
 * l'écran des récurrences, deux portes voisines plutôt qu'une tuile chacune.
 * Ce que la rangée perd — l'anneau — se retrouve entier à un doigt de là, sur
 * l'écran qui est fait pour le montrer.
 *
 * Les deux gardes sont celles des tuiles qu'elles remplacent, au mot près : la
 * répartition ne se propose pas sous un filtre par membre (une charge commune
 * n'appartient à personne, aucune ne passerait le filtre), ni sans les revenus
 * de tout le monde, ni seul·e du foyer ; les crédits ne se proposent pas quand
 * aucun n'est suivi. Le cadre entier s'efface quand les deux s'effacent.
 */
export function MoreSection() {
  const { total, shares } = useMonthSplit()
  const members = useMemberMap()
  const filter = useMemberFilter()
  const statuses = useDebtStatuses()

  const withSplit = filter === undefined && members.size >= 2 && shares !== null && total > 0
  const withCredits = statuses.length > 0
  if (!withSplit && !withCredits) return null

  /* Les parts, dans l'ordre où la tuile les donnait. Sans pastille : le DS §9.1
     n'en veut pas sur une ligne de liste, et une rangée qui en porterait cinq
     ne serait plus un résumé. La couleur de chacun se lit sur l'écran au bout
     du chevron, où l'anneau la porte. */
  const spread =
    shares === null
      ? ''
      : shares
          .map(
            (share) =>
              `${members.get(share.memberId)?.name ?? ''} ${formatPercent(share.shareBp / 10_000)}`,
          )
          .join(' · ')

  const remaining = totalRemaining(statuses)
  const running = statuses.filter((status) => !status.settled).length

  return (
    <RowGroup>
      {withSplit && (
        <Row
          label={fr.dashboard.split}
          /* Ce que le montant compte, puis comment il se découpe : sans la
             première clause, un montant posé au bout d'une rangée nommée
             « Répartition » ne dit pas de quoi il est la répartition. */
          description={`${fr.dashboard.splitHint} · ${spread}`}
          trailing={<Amount value={total} direction="out" />}
          to={SPLIT_PATH}
        />
      )}
      {withCredits && (
        <Row
          label={fr.dashboard.credits}
          description={`${fr.dashboard.creditsRemaining} · ${tpl(
            running > 1 ? fr.dashboard.creditsRunningMany : fr.dashboard.creditsRunningOne,
            running,
          )}`}
          trailing={<Amount value={remaining} />}
          to={CREDITS_PATH}
        />
      )}
    </RowGroup>
  )
}
