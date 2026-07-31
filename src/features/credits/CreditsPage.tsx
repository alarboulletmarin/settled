import { useNavigate } from 'react-router-dom'
import { CREDIT_NEW_PATH, creditEditPath } from '@/app/routes'
import { totalRemaining } from '@/domain/debt'
import type { DebtStatus } from '@/domain/debt'
import { fr } from '@/i18n/fr'
import { formatDate, formatPercent, tpl } from '@/i18n/format'
import { useCategoryMap, useDebtStatuses } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { CreditsIcon, Plus } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Ring } from '@/ui/Ring'
import { Tile } from '@/ui/Tile'

function plural(n: number): string {
  return n > 1 ? 's' : ''
}

/**
 * Une ligne par crédit : l'anneau signature porte la part remboursée, le
 * chiffre porte ce qui reste. C'est ce qui reste qui compte — le total versé
 * inclut les intérêts, et le confondre avec l'amortissement ferait croire un
 * prêt soldé bien avant qu'il ne le soit.
 */
function DebtRow({ status, onOpen }: { status: DebtStatus; onOpen: () => void }) {
  const categories = useCategoryMap()
  const { debt, remaining, progress, monthsLeft, monthly, settled } = status
  const category = categories.get(debt.categoryId)

  return (
    <Tile onClick={onOpen} label={debt.label} className="gap-3">
      <div className="flex items-center gap-4">
        <Ring
          size={72}
          thickness={10}
          value={progress}
          label={tpl(fr.credits.progress, formatPercent(progress))}
          color={category?.color ?? 'var(--cat-rest)'}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="t-body truncate font-medium">{debt.label}</span>
          <Amount value={remaining} size="tile" />
          <span className="t-axis">
            {settled
              ? fr.credits.settled
              : tpl(fr.credits.monthsLeft, monthsLeft, plural(monthsLeft), plural(monthsLeft))}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-3">
        <span className="t-label">{fr.credits.monthly}</span>
        {monthly === null ? (
          <span className="t-label">{fr.credits.linkedNone}</span>
        ) : (
          <Amount value={monthly} size="body" direction="out" />
        )}
        <span className="t-axis w-full">{formatDate(debt.endsOn)}</span>
      </div>
    </Tile>
  )
}

export function CreditsPage() {
  const statuses = useDebtStatuses()
  const navigate = useNavigate()

  const openCreate = (): void => {
    void navigate(CREDIT_NEW_PATH)
  }

  return (
    <>
      {/* L'état vide porte déjà le même bouton : le garder en titre l'afficherait
          deux fois dans le même écran. */}
      <PageTitle title={fr.credits.title}>
        {statuses.length > 0 && (
          <Button onClick={openCreate}>
            <Plus size={18} />
            {fr.common.add}
          </Button>
        )}
      </PageTitle>

      {statuses.length === 0 ? (
        <EmptyState message={fr.credits.empty} actionLabel={fr.credits.add} onAction={openCreate} />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <Tile variant="accent">
            <Eyebrow icon={CreditsIcon}>{fr.credits.total}</Eyebrow>
            <Amount value={totalRemaining(statuses)} size="tile" className="mt-3" />
          </Tile>

          <div className="flex flex-col gap-3">
            {statuses.map((status) => (
              <DebtRow
                key={status.debt.id}
                status={status}
                onOpen={() => {
                  void navigate(creditEditPath(status.debt.id))
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
