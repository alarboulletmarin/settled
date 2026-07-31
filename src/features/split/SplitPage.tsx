import { useNavigate } from 'react-router-dom'
import { RECURRENCE_NEW_PATH } from '@/app/routes'
import { totalDue } from '@/domain/split'
import type { MemberShare } from '@/domain/split'
import { fr } from '@/i18n/fr'
import { formatMoney, formatPercent, tpl } from '@/i18n/format'
import { useMemberMap, useMembers, useMonthSplit } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Dot } from '@/ui/Dot'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { SplitIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/** « Alix », « Alix et Camille », « Alix, Camille et Sacha ». */
function enumerate(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} et ${names.at(-1) ?? ''}`
}

function ShareRow({ share }: { share: MemberShare }) {
  const members = useMemberMap()
  const currency = useCurrency()
  const member = members.get(share.memberId)

  return (
    <Tile className="gap-3">
      <div className="flex items-center gap-3">
        <Dot color={member?.color ?? 'var(--cat-rest)'} />
        <span className="t-body min-w-0 flex-1 truncate font-medium">{member?.name ?? ''}</span>
        <span className="t-axis tnum shrink-0">{formatPercent(share.shareBp / 10_000, 1)}</span>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-3">
        <span className="t-label">{fr.split.due}</span>
        <Amount value={share.due} size="tile" direction="out" />
        <span className="t-axis w-full">
          {`${fr.split.income} ${formatMoney(share.income, currency, false)}`}
        </span>
      </div>
    </Tile>
  )
}

/**
 * Le détail de la répartition du mois — l'écran qu'ouvre la tuile.
 *
 * Il montre le calcul plutôt que son seul résultat : c'est ce qui rend un
 * partage acceptable entre deux personnes. Le total des parts est affiché à
 * côté du total des charges, et les deux sont égaux au centime — c'est ce que
 * garantit la répartition aux plus forts restes, et le montrer vaut mieux que
 * de l'affirmer.
 */
export function SplitPage() {
  const { total, shares, unknown } = useMonthSplit()
  const members = useMembers()
  const currency = useCurrency()
  const navigate = useNavigate()

  const goToSettings = (): void => {
    void navigate('/reglages')
  }

  if (members.length < 2) {
    return (
      <>
        <PageTitle title={fr.split.title} />
        <EmptyState
          message={fr.split.soloTitle}
          actionLabel={fr.split.goToSettings}
          onAction={goToSettings}
        >
          <p className="t-label max-w-xs">{fr.split.soloHint}</p>
        </EmptyState>
      </>
    )
  }

  if (shares === null) {
    const names = unknown.map((m) => m.name)
    return (
      <>
        <PageTitle title={fr.split.title} />
        <EmptyState
          message={tpl(
            names.length === 1 ? fr.split.missingOne : fr.split.missingMany,
            enumerate(names),
          )}
          actionLabel={fr.split.goToIncome}
          onAction={() => {
            void navigate(RECURRENCE_NEW_PATH)
          }}
        >
          <p className="t-label max-w-sm">{fr.split.missingHint}</p>
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <PageTitle title={fr.split.title} />

      <div className="flex max-w-3xl flex-col gap-4">
        <p className="t-label">{fr.split.subtitle}</p>

        <Tile variant="accent">
          <Eyebrow icon={SplitIcon}>{fr.split.total}</Eyebrow>
          <Amount value={total} size="tile" className="mt-3" />
          <span className="t-label mt-1">{fr.split.totalHint}</span>
        </Tile>

        {total <= 0 ? (
          <p className="t-label">{fr.split.nothing}</p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {shares.map((share) => (
                <ShareRow key={share.memberId} share={share} />
              ))}
            </div>

            <Tile className="gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="t-body">{fr.split.checkTotal}</span>
                <Amount value={totalDue(shares)} size="body" direction="out" />
              </div>
              <p className="t-label">{fr.split.checkHint}</p>
            </Tile>
          </>
        )}

        <Tile className="gap-2">
          <Eyebrow>{fr.split.method}</Eyebrow>
          <p className="t-body mt-1">{fr.split.methodFormula}</p>
          <p className="t-label">{fr.split.methodIncome}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li className="t-label">{fr.split.methodIncluded}</li>
            <li className="t-label">{fr.split.methodFlagged}</li>
          </ul>
          <p className="t-label">{fr.split.methodExcluded}</p>
        </Tile>

        <p className="sr-only-text">{formatMoney(total, currency)}</p>
      </div>
    </>
  )
}
