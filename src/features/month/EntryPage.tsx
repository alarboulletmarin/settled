import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { type ISODate, isValidISO } from '@/domain/date'
import { parseAmount, toAmountInput } from '@/domain/money'
import type { Direction, Entry } from '@/domain/types'
import { DIRECTION_PARAM, directionFromParam } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { addEntry, removeEntry, updateEntry } from '@/store/actions'
import { useCurrentYm, useEntry, useMembers } from '@/store/selectors'
import { Button, IconButton } from '@/ui/Button'
import { CategorySelect } from '@/ui/CategorySelect'
import { AmountInput, Field, Select, TextInput } from '@/ui/Field'
import { ChevronLeft } from '@/ui/Icons'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'
import { defaultDateFor } from './defaultDate'

const DIRECTIONS = [
  { value: 'out' as const, label: fr.direction.out },
  { value: 'in' as const, label: fr.direction.in },
]

type Draft = {
  amountText: string
  direction: Direction
  categoryId: string
  date: ISODate
  label: string
  memberId: string
  note: string
}

function initial(entry: Entry | null, defaultDate: ISODate, defaultDirection: Direction): Draft {
  return {
    amountText: entry ? toAmountInput(entry.amount) : '',
    direction: entry?.direction ?? defaultDirection,
    categoryId: entry?.categoryId ?? '',
    date: entry?.date ?? defaultDate,
    label: entry?.label ?? '',
    memberId: entry?.memberId ?? '',
    note: entry?.note ?? '',
  }
}

/** Le titre suit le sens choisi : on n'ajoute pas « une dépense » de 2 300 € de salaire. */
function titleFor(entry: Entry | null, direction: Direction): string {
  if (entry === null) return direction === 'in' ? fr.entry.addIn : fr.entry.addOut
  return direction === 'in' ? fr.entry.editIn : fr.entry.editOut
}

/** Et la confirmation aussi : annoncer « Dépense ajoutée » après un salaire
 *  ferait douter de ce qui vient d'être enregistré. */
const TOAST = {
  added: { in: fr.entry.addedIn, out: fr.entry.addedOut },
  updated: { in: fr.entry.updatedIn, out: fr.entry.updatedOut },
  removed: { in: fr.entry.removedIn, out: fr.entry.removedOut },
} as const

/**
 * Formulaire court du cahier §4.4 : montant, catégorie, date, libellé, membre.
 * Une saisie ponctuelle est créée directement en `confirmed`.
 *
 * C'est un écran plein, pas une feuille : le formulaire tient d'un seul tenant,
 * sans rien à faire glisser ni couche à refermer pour revenir au mois.
 */
function EntryForm({
  entry,
  defaultDate,
  defaultDirection,
  onDone,
}: {
  entry: Entry | null
  defaultDate: ISODate
  defaultDirection: Direction
  onDone: () => void
}) {
  const members = useMembers()
  const [draft, setDraft] = useState<Draft>(() => initial(entry, defaultDate, defaultDirection))
  const [showErrors, setShowErrors] = useState(false)

  const amount = parseAmount(draft.amountText)
  const errors = {
    amount: amount === null || amount <= 0 ? fr.entry.amountRequired : undefined,
    category: draft.categoryId === '' ? fr.entry.categoryRequired : undefined,
    label: draft.label.trim() === '' ? fr.entry.labelRequired : undefined,
  }
  const shown = showErrors ? errors : { amount: undefined, category: undefined, label: undefined }

  const patch = (next: Partial<Draft>): void => {
    setDraft((current) => ({ ...current, ...next }))
  }

  const submit = (): void => {
    setShowErrors(true)
    if (amount === null || amount <= 0 || draft.categoryId === '' || draft.label.trim() === '') return
    const payload = {
      label: draft.label.trim(),
      categoryId: draft.categoryId,
      ...(draft.memberId === '' ? {} : { memberId: draft.memberId }),
      direction: draft.direction,
      amount,
      date: draft.date,
      status: 'confirmed' as const,
      ...(draft.note.trim() === '' ? {} : { note: draft.note.trim() }),
    }
    if (entry === null) {
      addEntry(payload)
      toast(TOAST.added[draft.direction])
    } else {
      updateEntry(entry.id, payload)
      toast(TOAST.updated[draft.direction])
    }
    onDone()
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div className="flex items-center gap-1">
        <IconButton label={fr.common.back} onClick={onDone}>
          <ChevronLeft />
        </IconButton>
        <h1 className="t-section min-w-0 truncate">{titleFor(entry, draft.direction)}</h1>
      </div>

      <form
        id="entry-form"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Tile className="gap-4">
          <Segmented
            options={DIRECTIONS}
            value={draft.direction}
            onChange={(direction) => {
              patch({ direction, categoryId: '' })
            }}
            label={fr.entry.direction}
            className="self-start"
          />

          <Field label={fr.entry.amount} required {...(shown.amount ? { error: shown.amount } : {})}>
            {(id, describedBy) => (
              <AmountInput
                id={id}
                aria-describedby={describedBy}
                value={draft.amountText}
                invalid={Boolean(shown.amount)}
                placeholder="0,00"
                autoFocus
                onChange={(e) => {
                  patch({ amountText: e.target.value })
                }}
              />
            )}
          </Field>

          <Field label={fr.entry.category} required {...(shown.category ? { error: shown.category } : {})}>
            {(id, describedBy) => (
              <CategorySelect
                id={id}
                aria-describedby={describedBy}
                direction={draft.direction}
                value={draft.categoryId}
                onChange={(e) => {
                  patch({ categoryId: e.target.value })
                }}
              />
            )}
          </Field>

          <Field label={fr.entry.date} required>
            {(id) => (
              <TextInput
                id={id}
                type="date"
                value={draft.date}
                onChange={(e) => {
                  if (e.target.value !== '') patch({ date: e.target.value })
                }}
              />
            )}
          </Field>

          <Field label={fr.entry.label} required {...(shown.label ? { error: shown.label } : {})}>
            {(id, describedBy) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                value={draft.label}
                invalid={Boolean(shown.label)}
                placeholder={fr.entry.labelPlaceholder}
                maxLength={60}
                onChange={(e) => {
                  patch({ label: e.target.value })
                }}
              />
            )}
          </Field>

          {members.length > 0 && (
            <Field label={fr.entry.member} optional>
              {(id) => (
                <Select
                  id={id}
                  value={draft.memberId}
                  onChange={(e) => {
                    patch({ memberId: e.target.value })
                  }}
                >
                  <option value="">{fr.shell.everyone}</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </Tile>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" form="entry-form">
          {fr.common.save}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {fr.common.cancel}
        </Button>
      </div>

      {/* La suppression ne se mêle pas aux deux boutons qui closent la saisie. */}
      {entry !== null && (
        <div className="border-t border-border pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              removeEntry(entry.id)
              toast(TOAST.removed[entry.direction])
              onDone()
            }}
          >
            {fr.entry.remove}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * `/depense` pour une saisie neuve, `/depense/:id` pour en reprendre une.
 * Le paramètre `date` permet au calendrier d'ouvrir la saisie sur le jour
 * sélectionné plutôt que sur le premier du mois.
 */
export function EntryPage() {
  const { id } = useParams()
  const entry = useEntry(id)
  const ym = useCurrentYm()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = (): void => {
    // Arrivé ici par un lien direct ou un rechargement, il n'y a pas d'écran
    // précédent dans l'app : revenir en arrière sortirait du site.
    if (location.key === 'default') void navigate('/')
    else void navigate(-1)
  }

  // L'entrée a pu être supprimée depuis un autre onglet, ou l'URL être fausse.
  if (id !== undefined && entry === null) return <Navigate to="/" replace />

  const asked = params.get('date')
  const defaultDate = asked !== null && isValidISO(asked) ? asked : defaultDateFor(ym)

  return (
    <EntryForm
      key={entry?.id ?? 'new'}
      entry={entry}
      defaultDate={defaultDate}
      defaultDirection={directionFromParam(params.get(DIRECTION_PARAM))}
      onDone={goBack}
    />
  )
}
