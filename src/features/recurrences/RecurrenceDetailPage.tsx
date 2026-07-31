import { type ReactNode, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { today } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { formatDate, formatMoney, tpl } from '@/i18n/format'
import { removeRecurrence, resumeRecurrence, stopRecurrence } from '@/store/actions'
import { useRecurrenceRow } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button, IconButton } from '@/ui/Button'
import { Eyebrow } from '@/ui/Eyebrow'
import { ChevronLeft, Warning } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { toast } from '@/ui/toast'
import { recurrenceEditPath } from '@/app/routes'
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
 * La fiche d'un abonnement : ce qu'il coûte, quand il tombe, comment l'arrêter.
 * Écran plein comme le formulaire qu'elle ouvre — une feuille qui se referme
 * pour laisser place à une page ferait faire deux mouvements pour un seul pas.
 */
export function RecurrenceDetailPage() {
  const { id } = useParams()
  const row = useRecurrenceRow(id)
  const navigate = useNavigate()
  const currency = useCurrency()
  const [confirmingRemoval, setConfirmingRemoval] = useState(false)

  // Supprimé depuis un autre onglet, ou URL fausse.
  if (row === null) return <Navigate to="/abonnements" replace />

  const { recurrence, monthly, annual, priceChange, stopped } = row

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div className="flex items-center gap-1">
        <IconButton
          label={fr.common.back}
          onClick={() => {
            void navigate('/abonnements')
          }}
        >
          <ChevronLeft />
        </IconButton>
        <h1 className="t-section min-w-0 truncate">{recurrence.label}</h1>
        {stopped && <Eyebrow className="shrink-0">{fr.recurrences.stoppedBadge}</Eyebrow>}
      </div>

      {priceChange !== null && (
        <p className="tile flex items-start gap-2 p-4 text-danger-text">
          <Warning size={18} className="mt-0.5 shrink-0" />
          <span className="t-label text-danger-text">
            {tpl(
              fr.recurrences.priceChanged,
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
          <Button
            onClick={() => {
              stopRecurrence(recurrence.id, today())
              toast(fr.recurrences.stopped)
            }}
          >
            {fr.recurrences.stop}
          </Button>
        )}
      </div>

      <p className="t-label">{fr.recurrences.stopHint}</p>

      {/* Suppression en deux temps : le bouton devient sa propre confirmation,
          plutôt qu'une boîte de dialogue empilée sur l'écran. */}
      <div className="border-t border-border pt-4">
        {confirmingRemoval ? (
          <div className="flex max-w-sm flex-col gap-2 rounded-inner bg-surface-2 p-3">
            <p className="t-label">{fr.recurrences.removeConfirm}</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmingRemoval(false)
                }}
                full
              >
                {fr.common.cancel}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  removeRecurrence(recurrence.id)
                  toast(fr.recurrences.deleted)
                  void navigate('/abonnements', { replace: true })
                }}
                full
              >
                {fr.common.delete}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => {
              setConfirmingRemoval(true)
            }}
          >
            {fr.recurrences.remove}
          </Button>
        )}
      </div>
    </div>
  )
}
