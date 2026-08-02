import { useNavigate } from 'react-router-dom'
import { MonthlyBars } from '@/charts/MonthlyBars'
import { entryNewPath } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { formatMoney, formatYearMonth, tpl } from '@/i18n/format'
import { useCurrencyCode, useCurrentYm, useEntries, useTrailingMonths } from '@/store/selectors'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { TrailingIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { MonthCompare } from './MonthCompare'
import { YearCompare } from './YearCompare'

const LEGEND = [
  { label: fr.history.legendIn, color: 'var(--flow-in)', kind: 'bar' as const },
  { label: fr.history.legendOut, color: 'var(--flow-out)', kind: 'bar' as const },
  { label: fr.history.legendBalance, color: 'var(--text)', kind: 'line' as const },
]

/** Entrées, sorties et solde sur les douze derniers mois. */
function Trailing() {
  const points = useTrailingMonths(12)
  const currency = useCurrencyCode()
  const ym = useCurrentYm()
  const filled = points.filter((point) => point.hasData)

  return (
    <Tile className="gap-4">
      <Eyebrow icon={TrailingIcon}>{fr.history.trailing}</Eyebrow>
      {filled.length === 0 ? (
        <p className="t-label">{fr.history.trailingEmpty}</p>
      ) : (
        <>
          <MonthlyBars
            points={points}
            label={tpl('%s — %s', fr.history.trailing, formatYearMonth(ym))}
            srText={tpl(
              fr.history.srTrailing,
              filled
                .map((p) => `${formatYearMonth(p.ym)} ${formatMoney(p.balance, currency, false)}`)
                .join(', '),
            )}
          />
          <ul className="flex flex-wrap gap-4">
            {LEGEND.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={item.kind === 'bar' ? 'h-3 w-3 rounded-[3px]' : 'h-0.5 w-6 rounded-chip'}
                  style={{ backgroundColor: item.color }}
                />
                <span className="t-label">{item.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Tile>
  )
}

export function HistoryPage() {
  const entries = useEntries()
  const navigate = useNavigate()

  /* Aucune entrée du tout, et non « pas assez pour cette tuile-ci » : c'est le
     seul cas où les trois n'ont rien à dire à la fois, donc le seul où les
     remplacer ne cache rien. Dès la première dépense, chacune reprend sa place
     et dit elle-même ce qui lui manque encore. */
  if (entries.length === 0) {
    return (
      <>
        <PageTitle title={fr.history.title} />
        <EmptyState
          message={fr.history.empty}
          actionLabel={fr.entry.addOut}
          onAction={() => {
            void navigate(entryNewPath({ direction: 'out' }))
          }}
        >
          <p className="t-label max-w-sm">{fr.history.emptyHint}</p>
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <PageTitle title={fr.history.title} />
      <div className="flex max-w-3xl flex-col gap-4">
        <Trailing />
        <MonthCompare />
        <YearCompare />
      </div>
    </>
  )
}
