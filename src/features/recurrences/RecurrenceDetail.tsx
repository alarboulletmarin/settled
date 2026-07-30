import { type ReactNode, useState } from 'react'
import { today } from '@/domain/date'
import type { Recurrence } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDate, formatMoney, tpl } from '@/i18n/format'
import { removeRecurrence, resumeRecurrence, stopRecurrence } from '@/store/actions'
import type { RecurrenceRow } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { Eyebrow } from '@/ui/Eyebrow'
import { Warning } from '@/ui/Icons'
import { Sheet } from '@/ui/Sheet'
import { useCurrency } from '@/ui/currency'
import { describePeriod } from './period'

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="t-label">{label}</span>
      <span className="t-body text-right">{children}</span>
    </div>
  )
}

/** La fiche d'un abonnement : ce qu'il coûte, quand il tombe, comment l'arrêter. */
export function RecurrenceDetail({
  row,
  onClose,
  onEdit,
}: {
  row: RecurrenceRow | null
  onClose: () => void
  onEdit: (recurrence: Recurrence) => void
}) {
  const currency = useCurrency()
  const [confirmingRemoval, setConfirmingRemoval] = useState(false)
  if (row === null) return null
  const { recurrence, monthly, annual, priceChange, stopped } = row

  return (
    <Sheet
      open
      onClose={onClose}
      title={recurrence.label}
      footer={
        <>
          <Button variant="secondary" onClick={() => { onEdit(recurrence) }}>
            {fr.common.edit}
          </Button>
          {stopped ? (
            <Button onClick={() => { resumeRecurrence(recurrence.id); onClose() }}>
              {fr.recurrences.resume}
            </Button>
          ) : (
            <Button onClick={() => { stopRecurrence(recurrence.id, today()); onClose() }}>
              {fr.recurrences.stop}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {priceChange !== null && (
          <p className="flex items-start gap-2 rounded-inner bg-surface-2 p-3 text-danger-text">
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
          <div className="flex flex-col gap-2">
            <Eyebrow>{fr.recurrences.form.note}</Eyebrow>
            <p className="t-body">{recurrence.note}</p>
          </div>
        )}

        <p className="t-label">{fr.recurrences.stopHint}</p>

        {/* Suppression en deux temps : le bouton devient sa propre confirmation,
            plutôt qu'une boîte de dialogue empilée sur une feuille modale. */}
        {confirmingRemoval ? (
          <div className="flex flex-col gap-2 rounded-inner bg-surface-2 p-3">
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
                  onClose()
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
    </Sheet>
  )
}
