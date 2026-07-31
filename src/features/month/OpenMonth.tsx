import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { openMonth } from '@/store/actions'
import { useCurrentYm, useIsMonthOpened, useRecurrences } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { Eyebrow } from '@/ui/Eyebrow'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'

/**
 * L'ouverture du mois. Déclenchée automatiquement au premier lancement du
 * mois courant ; rejouable ici, et disponible pour un mois jamais ouvert.
 */
function useOpenMonth(): () => void {
  const ym = useCurrentYm()

  return (): void => {
    const outcome = openMonth(ym)
    toast(
      outcome.created === 0
        ? fr.month.openedNone
        : tpl(
            fr.month.openedSome,
            outcome.created,
            outcome.created > 1 ? 's' : '',
            outcome.created > 1 ? 's' : '',
          ),
    )
  }
}

/**
 * Le rappel d'un mois jamais ouvert. C'est un bloc de pleine largeur, jamais un
 * élément de rangée : posé à côté d'un bouton `shrink-0`, il se ferait écraser
 * sous sa largeur min-content et le texte tomberait en colonne d'une lettre.
 *
 * Sans abonnement, il n'y a rien à poser : le rappel disparaît plutôt que de
 * proposer une action sans effet.
 */
export function OpenMonthNotice() {
  const opened = useIsMonthOpened()
  const recurrences = useRecurrences()
  const run = useOpenMonth()

  if (opened || recurrences.length === 0) return null

  return (
    <Tile className="mb-4 w-full items-start gap-3">
      <Eyebrow>{fr.month.notOpenedTitle}</Eyebrow>
      <p className="t-body max-w-prose">{fr.month.notOpened}</p>
      <Button onClick={run}>{fr.month.open}</Button>
    </Tile>
  )
}

/** Rejoue l'ouverture. Action de maintenance : absente s'il n'y a rien à poser. */
export function RegenerateEntriesButton() {
  const opened = useIsMonthOpened()
  const recurrences = useRecurrences()
  const run = useOpenMonth()

  if (!opened || recurrences.length === 0) return null

  return (
    <Button variant="secondary" size="sm" onClick={run}>
      {fr.month.reopen}
    </Button>
  )
}
