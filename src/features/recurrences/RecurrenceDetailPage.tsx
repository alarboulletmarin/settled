import { type ReactNode, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { today } from '@/domain/date'
import { isCostly } from '@/domain/priceHistory'
import { fr } from '@/i18n/fr'
import { formatDate, formatMoney, tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import { removeRecurrence, resumeRecurrence, stopRecurrence, undoable } from '@/store/actions'
import { useKindOf, useRecurrenceRow } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Eyebrow } from '@/ui/Eyebrow'
import { Warning } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { toast } from '@/ui/toast'
import { RECURRENCES_PATH, recurrenceEditPath } from '@/app/routes'
import { describePeriod } from './period'

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="t-label">{label}</span>
      <span className="t-body text-right">{children}</span>
    </div>
  )
}

/**
 * La fiche d’une récurrence : ce qu'elle coûte, quand elle tombe, comment l'arrêter.
 * Écran plein comme le formulaire qu'elle ouvre — une feuille qui se referme
 * pour laisser place à une page ferait faire deux mouvements pour un seul pas.
 */
export function RecurrenceDetailPage() {
  const { id } = useParams()
  const row = useRecurrenceRow(id)
  const navigate = useNavigate()
  const currency = useCurrency()
  const kindOf = useKindOf()
  const [confirming, setConfirming] = useState<'stop' | 'remove' | null>(null)
  const close = (): void => {
    setConfirming(null)
  }

  // Supprimé depuis un autre onglet, ou URL fausse.
  if (row === null) return <Navigate to={RECURRENCES_PATH} replace />

  const { recurrence, monthly, annual, priceChange, stopped } = row
  const kind = kindOf(recurrence.categoryId)
  const costly = priceChange !== null && isCostly(priceChange, recurrence.direction, kind)

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <PageTitle
        title={recurrence.label}
        onBack={() => {
          void navigate(RECURRENCES_PATH)
        }}
      >
        {stopped && <Eyebrow className="shrink-0">{fr.recurrences.stoppedBadge}</Eyebrow>}
      </PageTitle>

      {/* Rouge et panneau seulement quand le changement coûte : une charge qui
          monte, un revenu qui baisse — jamais l'épargne, qui reste au foyer.
          Le DS §2.3 réserve le rouge aux dépassements et aux erreurs — une
          augmentation de salaire n'en est pas, verser plus sur un livret non
          plus. */}
      {priceChange !== null && (
        <p className={cn('tile flex items-start gap-2 p-4', costly && 'text-danger-text')}>
          {costly && <Warning size={18} className="mt-0.5 shrink-0" />}
          <span className="t-label">
            {tpl(
              // Un virement d'épargne n'a pas de prix : son montant change.
              kind === 'saving' ? fr.recurrences.amountChanged : fr.recurrences.priceChanged,
              formatMoney(priceChange.previous, currency),
              formatMoney(priceChange.current, currency),
            )}{' '}
            {tpl(fr.recurrences.priceChangedSince, formatDate(priceChange.since))}
          </span>
        </p>
      )}

      <Tile className="gap-4">
        <div className="flex flex-col divide-y divide-border">
          <Line label={fr.recurrences.form.period}>
            {describePeriod(recurrence.period, recurrence.startedOn)}
          </Line>
          <Line label={fr.recurrences.nextDue}>
            {row.next === null ? fr.recurrences.noNextDue : formatDate(row.next)}
          </Line>
          <Line label={fr.recurrences.monthlyCost}>
            {monthly === null ? (
              fr.recurrences.variable
            ) : (
              <Amount value={monthly} direction={recurrence.direction} />
            )}
          </Line>
          <Line label={fr.recurrences.annualCost}>
            {annual === null ? (
              fr.recurrences.variable
            ) : (
              <Amount value={annual} direction={recurrence.direction} />
            )}
          </Line>
          <Line label={fr.recurrences.form.startedOn}>{formatDate(recurrence.startedOn)}</Line>
          {recurrence.endedOn !== undefined && (
            <Line label={fr.recurrences.stopped}>{formatDate(recurrence.endedOn)}</Line>
          )}
        </div>

        {recurrence.note !== undefined && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Eyebrow>{fr.recurrences.form.note}</Eyebrow>
            <p className="t-body">{recurrence.note}</p>
          </div>
        )}
      </Tile>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            void navigate(recurrenceEditPath(recurrence.id))
          }}
        >
          {fr.common.edit}
        </Button>
        {/* Arrêter et reprendre laissent sur la fiche : elle montre justement
            ce que l'action vient de changer — échéance suivante et badge. */}
        {stopped ? (
          <Button
            onClick={() => {
              resumeRecurrence(recurrence.id)
              toast(fr.recurrences.resumed)
            }}
          >
            {fr.recurrences.resume}
          </Button>
        ) : (
          /* Arrêter emporte toutes les échéances prévues au-delà du jour :
             c'est destructif, donc ça se demande, comme tout le reste. */
          <Button
            onClick={() => {
              setConfirming('stop')
            }}
          >
            {fr.recurrences.stop}
          </Button>
        )}
      </div>

      <p className="t-label">{fr.recurrences.stopHint}</p>

      <div className="border-t border-border pt-4">
        <Button
          variant="ghost"
          onClick={() => {
            setConfirming('remove')
          }}
        >
          {fr.recurrences.remove}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming === 'stop'}
        title={fr.recurrences.stop}
        steps={[{ question: fr.recurrences.stopConfirm, action: fr.recurrences.stopAction }]}
        onCancel={close}
        onConfirm={() => {
          close()
          undoable(fr.recurrences.stopped, () => {
            stopRecurrence(recurrence.id, today())
          })
        }}
      />

      <ConfirmDialog
        open={confirming === 'remove'}
        title={fr.recurrences.remove}
        steps={[{ question: fr.recurrences.removeConfirm, action: fr.common.delete }]}
        onCancel={close}
        onConfirm={() => {
          close()
          undoable(fr.recurrences.deleted, () => {
            removeRecurrence(recurrence.id)
          })
          void navigate(RECURRENCES_PATH, { replace: true })
        }}
      />
    </div>
  )
}
