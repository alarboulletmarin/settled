import { Link } from 'react-router-dom'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useSubscriptionTotals } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/** Total des abonnements : mensuel, et annualisé en seconde lecture. */
export function SubscriptionsTile() {
  const totals = useSubscriptionTotals()
  const currency = useCurrency()

  return (
    <Tile span="2x2" className="justify-between">
      <Eyebrow>{fr.dashboard.subscriptions}</Eyebrow>
      <div className="flex flex-col gap-1">
        <Amount value={totals.monthly} size="tile" direction="out" />
        <span className="t-label tnum">
          {tpl(fr.dashboard.subscriptionsHint, formatMoney(totals.annual, currency, false))}
        </span>
        <Link
          to="/abonnements"
          className="t-label inline-flex min-h-11 w-fit items-center rounded-input underline underline-offset-2"
        >
          {fr.recurrences.title}
        </Link>
      </div>
    </Tile>
  )
}
