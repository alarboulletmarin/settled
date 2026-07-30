import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { openMonth } from '@/store/actions'
import { useCurrentYm, useIsMonthOpened } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'

/**
 * L'ouverture du mois. Déclenchée automatiquement au premier lancement du
 * mois courant ; rejouable ici, et disponible pour un mois jamais ouvert.
 */
export function OpenMonthCard() {
  const ym = useCurrentYm()
  const opened = useIsMonthOpened()

  const run = (): void => {
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

  if (opened) {
    return (
      <Button variant="ghost" size="sm" onClick={run}>
        {fr.month.reopen}
      </Button>
    )
  }

  return (
    <Tile className="flex flex-col items-start gap-3">
      <p className="t-body">{fr.month.notOpened}</p>
      <Button onClick={run}>{fr.month.open}</Button>
    </Tile>
  )
}
