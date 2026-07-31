import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Recurrence } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { addRecurrence, updateRecurrence } from '@/store/actions'
import { useMembers, useRecurrenceRow } from '@/store/selectors'
import { Button, IconButton } from '@/ui/Button'
import { Field, TextInput } from '@/ui/Field'
import { ChevronLeft } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'
import { SharedField } from '@/features/split/SharedField'
import { AmountFields, IdentityFields, PeriodFields } from './RecurrenceFormFields'
import { useRecurrenceForm } from './useRecurrenceForm'

/**
 * Création et édition. Le même formulaire, la même validation, sur un écran
 * plein : le formulaire d'abonnement est le plus long de l'app — périodicité,
 * ancre, date de première échéance — et une feuille à faire glisser n'en
 * montrait qu'un tiers à la fois.
 */
function Form({ recurrence, onDone }: { recurrence: Recurrence | null; onDone: () => void }) {
  const members = useMembers()
  // La catégorie ne se pré-remplit plus : avec une quarantaine de choix rangés
  // sous onze familles, en imposer une au hasard ferait saisir des dépenses
  // sous la première venue.
  const { draft, patch, errors, build } = useRecurrenceForm(recurrence, '')

  const submit = (): void => {
    const payload = build()
    if (payload === null) return
    if (recurrence === null) {
      addRecurrence(payload)
      toast(fr.recurrences.added)
    } else {
      updateRecurrence(recurrence.id, payload)
      toast(fr.recurrences.updated)
    }
    onDone()
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div className="flex items-center gap-1">
        <IconButton label={fr.common.back} onClick={onDone}>
          <ChevronLeft />
        </IconButton>
        <h1 className="t-section min-w-0 truncate">
          {recurrence === null ? fr.recurrences.add : fr.recurrences.edit}
        </h1>
      </div>

      <form
        id="recurrence-form"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Tile className="gap-4">
          <IdentityFields draft={draft} patch={patch} errors={errors} members={members} />
          <AmountFields draft={draft} patch={patch} errors={errors} />
          <PeriodFields draft={draft} patch={patch} />

          <SharedField
            categoryId={draft.categoryId}
            memberId={draft.memberId}
            value={draft.shared}
            onChange={(shared) => {
              patch({ shared })
            }}
          />

          <Field label={fr.recurrences.form.note} optional>
            {(id) => (
              <TextInput
                id={id}
                value={draft.note}
                placeholder={fr.recurrences.form.notePlaceholder}
                maxLength={140}
                onChange={(e) => {
                  patch({ note: e.target.value })
                }}
              />
            )}
          </Field>
        </Tile>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" form="recurrence-form">
          {fr.common.save}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {fr.common.cancel}
        </Button>
      </div>
    </div>
  )
}

/** `/abonnements/nouveau`, et `/abonnements/:id/modifier` pour en reprendre un. */
export function RecurrenceFormPage() {
  const { id } = useParams()
  const row = useRecurrenceRow(id)
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = (): void => {
    // Arrivé par un lien direct ou un rechargement, il n'y a pas d'écran
    // précédent dans l'app : revenir en arrière sortirait du site.
    if (location.key === 'default') void navigate('/abonnements')
    else void navigate(-1)
  }

  if (id !== undefined && row === null) return <Navigate to="/abonnements" replace />

  return <Form key={id ?? 'new'} recurrence={row?.recurrence ?? null} onDone={goBack} />
}
