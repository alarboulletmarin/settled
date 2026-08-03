import { useNavigate } from 'react-router-dom'
import { MonthlyBars } from '@/charts/MonthlyBars'
import { entryNewPath } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { formatMoney, formatYearMonth, tpl } from '@/i18n/format'
import {
  useCurrencyCode,
  useCurrentYm,
  useEntries,
  useRecurrences,
  useTrailingMonths,
} from '@/store/selectors'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { HistoryIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { MonthCompare } from './MonthCompare'
import { SearchSection } from './SearchSection'
import { YearCompare } from './YearCompare'

/** Entrées, sorties et solde sur les douze derniers mois. */
function Trailing() {
  const points = useTrailingMonths(12)
  const currency = useCurrencyCode()
  const ym = useCurrentYm()
  const filled = points.filter((point) => point.hasData)

  return (
    <Tile className="gap-4">
      <Eyebrow icon={HistoryIcon}>{fr.history.trailing}</Eyebrow>
      {filled.length === 0 ? (
        <p className="t-label">{fr.history.trailingEmpty}</p>
      ) : (
        /* Plus de légende sous le tracé : elle nommait les trois séries sans
           les chiffrer, et la lecture au-dessus du graphique dit désormais les
           deux — mêmes pastilles, mêmes mots, plus la valeur du mois lu. Deux
           blocs pour un seul sens, c'était le second qui ne servait pas. */
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
      )}
    </Tile>
  )
}

export function HistoryPage() {
  const entries = useEntries()
  const recurrences = useRecurrences()
  const navigate = useNavigate()

  /* Rien du tout, et non « pas assez pour cette tuile-ci » : c'est le seul cas
     où les quatre n'ont rien à dire à la fois, donc le seul où les remplacer ne
     cache rien. Les récurrences comptent parce que la recherche les trouve —
     un foyer qui n'a posé que des règles arrêtées n'a aucune entrée, et il
     aurait pourtant quelque chose à chercher. */
  if (entries.length === 0 && recurrences.length === 0) {
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
        <SearchSection />
        <Trailing />
        <MonthCompare />
        <YearCompare />
      </div>
    </>
  )
}
