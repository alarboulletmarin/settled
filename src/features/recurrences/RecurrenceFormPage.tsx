import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { RECURRENCES_PATH } from '@/app/routes'
import type { Recurrence } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { addRecurrence, replaceRecurrence } from '@/store/actions'
import { useMembers, useRecurrenceRow } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Field, TextInput } from '@/ui/Field'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'
import { useLeaveGuard } from '@/ui/useLeaveGuard'
import { SharedField } from '@/features/split/SharedField'
import { AmountFields, IdentityFields, PeriodFields } from './RecurrenceFormFields'
import { useRecurrenceForm } from './useRecurrenceForm'

/**
 * Création et édition. Le même formulaire, la même validation, sur un écran
 * plein : le formulaire de récurrence est le plus long de l'app — périodicité,
 * ancre, date de première échéance — et une feuille à faire glisser n'en
 * montrait qu'un tiers à la fois.
 */
function Form({ recurrence, onDone }: { recurrence: Recurrence | null; onDone: () => void }) {
  const members = useMembers()
  // La catégorie ne se pré-remplit plus : avec une quarantaine de choix rangés
  // sous onze familles, en imposer une au hasard ferait saisir des dépenses
  // sous la première venue.
  const { draft, patch, errors, needsMember, build } = useRecurrenceForm(recurrence, '')
  const guard = useLeaveGuard(draft, onDone)

  const submit = (): void => {
    const payload = build()
    if (payload === null) return
    if (recurrence === null) {
      addRecurrence(payload)
      toast(fr.recurrences.added)
    } else {
      replaceRecurrence(recurrence.id, payload)
      toast(fr.recurrences.updated)
    }
    onDone()
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <PageTitle
        title={recurrence === null ? fr.recurrences.add : fr.recurrences.edit}
        onBack={guard.request}
      />

      <form
        id="recurrence-form"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Tile className="gap-4">
          <IdentityFields
            draft={draft}
            patch={patch}
            errors={errors}
            members={members}
            needsMember={needsMember}
          />
          <AmountFields draft={draft} patch={patch} errors={errors} />
          <PeriodFields draft={draft} patch={patch} />

          {/* `SharedField` décide seul de son affichage — seulement sur une
              sortie de nature charge ou dette. Même règle que la saisie
              ponctuelle, et tenue au même endroit. */}
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
        <Button variant="secondary" onClick={guard.request}>
          {fr.common.cancel}
        </Button>
      </div>

      <ConfirmDialog {...guard.dialog} />
    </div>
  )
}

/** `/recurrences/nouveau`, et `/recurrences/:id/modifier` pour en reprendre une. */
export function RecurrenceFormPage() {
  const { id } = useParams()
  const row = useRecurrenceRow(id)
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = (): void => {
    // Arrivé par un lien direct ou un rechargement, il n'y a pas d'écran
    // précédent dans l'app : revenir en arrière sortirait du site.
    if (location.key === 'default') void navigate(RECURRENCES_PATH)
    else void navigate(-1)
  }

  if (id !== undefined && row === null) return <Navigate to={RECURRENCES_PATH} replace />

  return <Form key={id ?? 'new'} recurrence={row?.recurrence ?? null} onDone={goBack} />
}
