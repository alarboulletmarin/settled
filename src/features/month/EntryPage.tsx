import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { type ISODate, isValidISO } from '@/domain/date'
import { parseAmount, toAmountInput } from '@/domain/money'
import type { Direction, Entry } from '@/domain/types'
import { DIRECTION_PARAM, NATURE_PARAM, directionFromParam, natureFromParam } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { addEntry, addRecurrencePaidOn, removeEntry, replaceEntry } from '@/store/actions'
import { memberRequired } from '@/domain/split'
import { useCurrentYm, useEntry, useKindOf, useMembers } from '@/store/selectors'
import { Button, IconButton } from '@/ui/Button'
import { CategorySelect } from '@/ui/CategorySelect'
import { type EntryNature, kindsOfNature } from '@/ui/categoryKinds'
import { AmountInput, Field, Select, TextInput } from '@/ui/Field'
import { ChevronLeft } from '@/ui/Icons'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'
import { PeriodFields } from '@/features/recurrences/RecurrenceFormFields'
import {
  type PeriodDraft,
  defaultsFrom,
  monthlyDraftFrom,
  periodOf,
} from '@/features/recurrences/period'
import { SharedField } from '@/features/split/SharedField'
import { defaultDateFor } from './defaultDate'

/**
 * Ce qu'on enregistre, du point de vue de qui le fait.
 *
 * Le modèle n'a que deux sens, et c'est juste : un virement d'épargne sort bien
 * du compte. Mais l'écran demandait le sens, si bien que mettre 200 € de côté
 * passait par « Dépense » et allait chercher « Livrets » entre les courses et
 * le carburant. On ne dépense pas son épargne, on la déplace — et l'épargne a
 * donc sa position, d'où l'écran déduit le sens.
 */
const NATURES = [
  { value: 'expense' as const, label: fr.entry.natureExpense },
  { value: 'income' as const, label: fr.entry.natureIncome },
  { value: 'saving' as const, label: fr.entry.natureSaving },
]

/**
 * Les deux sens d'un mouvement d'épargne. Le second n'existait pas : on pouvait
 * verser sur un livret, jamais y reprendre — l'écran n'offrait alors que des
 * catégories de revenus, et un retrait de livret n'en est pas un.
 */
const MOVEMENTS = [
  { value: 'out' as const, label: fr.entry.savingIn },
  { value: 'in' as const, label: fr.entry.savingOut },
]

const RHYTHMS = [
  { value: 'once' as const, label: fr.entry.once },
  { value: 'recurring' as const, label: fr.entry.recurring },
]

/**
 * La périodicité vit dans le brouillon, mais pas sa date de départ : c'est
 * `date` qui la porte. Une dépense qu'on bascule en récurrence a déjà dit
 * quand elle a lieu, et deux champs de date pour une seule réponse feraient
 * douter de laquelle compte.
 */
type Draft = Omit<PeriodDraft, 'startedOn'> & {
  amountText: string
  /** Ce qu'on enregistre. Le sens en découle, sauf en épargne. */
  nature: EntryNature
  direction: Direction
  categoryId: string
  date: ISODate
  label: string
  memberId: string
  /** `undefined` = la règle de partage tranche. */
  shared: boolean | undefined
  recurring: boolean
  note: string
}

const periodDraftOf = (draft: Draft): PeriodDraft => ({ ...draft, startedOn: draft.date })

function initial(
  entry: Entry | null,
  defaultDate: ISODate,
  defaultDirection: Direction,
  defaultNature: EntryNature,
  isSaving: (categoryId: string) => boolean,
): Draft {
  const date = entry?.date ?? defaultDate
  const { startedOn: _unused, ...period } = monthlyDraftFrom(date)
  const direction = entry?.direction ?? defaultDirection
  return {
    ...period,
    amountText: entry ? toAmountInput(entry.amount) : '',
    /* En reprise, la nature se relit sur la catégorie plutôt que d'être
       stockée : elle est déjà dans la donnée, et un second champ finirait par
       en diverger. */
    nature:
      entry === null
        ? defaultNature
        : isSaving(entry.categoryId)
          ? 'saving'
          : direction === 'in'
            ? 'income'
            : 'expense',
    direction,
    categoryId: entry?.categoryId ?? '',
    date,
    label: entry?.label ?? '',
    memberId: entry?.memberId ?? '',
    shared: entry?.shared,
    recurring: false,
    note: entry?.note ?? '',
  }
}

/** Le titre suit ce qu'on enregistre : on n'ajoute pas « une dépense » de
 *  2 300 € de salaire, ni « une dépense » de 200 € versés sur un livret. */
function titleFor(entry: Entry | null, nature: EntryNature, recurring: boolean): string {
  if (nature === 'saving') return entry === null ? fr.entry.addSaving : fr.entry.editSaving
  if (entry === null) {
    if (recurring) return fr.recurrences.add
    return nature === 'income' ? fr.entry.addIn : fr.entry.addOut
  }
  return nature === 'income' ? fr.entry.editIn : fr.entry.editOut
}

/** Et la confirmation aussi : annoncer « Dépense ajoutée » après un salaire
 *  ferait douter de ce qui vient d'être enregistré. */
const TOAST = {
  added: { in: fr.entry.addedIn, out: fr.entry.addedOut, saving: fr.entry.addedSaving },
  updated: { in: fr.entry.updatedIn, out: fr.entry.updatedOut, saving: fr.entry.updatedSaving },
  removed: { in: fr.entry.removedIn, out: fr.entry.removedOut, saving: fr.entry.removedSaving },
} as const

/** La clé du toast : l'épargne parle d'elle-même, les deux autres du sens. */
const toastKey = (nature: EntryNature, direction: Direction): 'in' | 'out' | 'saving' =>
  nature === 'saving' ? 'saving' : direction

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
  defaultNature,
  onDone,
}: {
  entry: Entry | null
  defaultDate: ISODate
  defaultDirection: Direction
  defaultNature: EntryNature
  onDone: () => void
}) {
  const members = useMembers()
  const kindOf = useKindOf()
  const [draft, setDraft] = useState<Draft>(() =>
    initial(entry, defaultDate, defaultDirection, defaultNature, (id) => kindOf(id) === 'saving'),
  )
  const [showErrors, setShowErrors] = useState(false)

  const amount = parseAmount(draft.amountText)
  /* Une ligne qui n'entre pas dans les charges communes doit être à quelqu'un :
     sans propriétaire, elle n'apparaîtrait dans le mois de personne. Le champ
     ne s'exige évidemment que s'il y a quelqu'un à désigner. */
  const needsMember =
    members.length > 0 &&
    memberRequired(draft.direction, kindOf(draft.categoryId), draft.memberId, draft.shared)
  const errors = {
    amount: amount === null || amount <= 0 ? fr.entry.amountRequired : undefined,
    category: draft.categoryId === '' ? fr.entry.categoryRequired : undefined,
    label: draft.label.trim() === '' ? fr.entry.labelRequired : undefined,
    member: needsMember ? fr.entry.memberRequired : undefined,
  }
  const shown = showErrors
    ? errors
    : { amount: undefined, category: undefined, label: undefined, member: undefined }

  const patch = (next: Partial<Draft>): void => {
    setDraft((current) => {
      // Changer la date réaligne les ancres de périodicité tant que
      // l'utilisateur ne les a pas lui-même touchées — c'est la même règle que
      // sur l'écran des récurrences, et ici la date *est* la première échéance.
      if (next.date !== undefined && next.date !== current.date) {
        return { ...current, ...next, ...defaultsFrom(next.date) }
      }
      return { ...current, ...next }
    })
  }

  /** `PeriodFields` parle en `PeriodDraft` ; ici, `startedOn` s'appelle `date`. */
  const patchPeriod = (next: Partial<PeriodDraft>): void => {
    const { startedOn, ...rest } = next
    patch({ ...rest, ...(startedOn === undefined ? {} : { date: startedOn }) })
  }

  const submit = (): void => {
    setShowErrors(true)
    if (Object.values(errors).some((error) => error !== undefined)) return
    if (amount === null) return

    const common = {
      label: draft.label.trim(),
      categoryId: draft.categoryId,
      ...(draft.memberId === '' ? {} : { memberId: draft.memberId }),
      direction: draft.direction,
      ...(draft.shared === undefined ? {} : { shared: draft.shared }),
      ...(draft.note.trim() === '' ? {} : { note: draft.note.trim() }),
    }

    // Basculé en récurrence, l'écran ne pose plus un fait mais une règle. Elle
    // produit ses échéances dans la foulée, et celle du jour saisi part déjà
    // confirmée : l'utilisateur vient de dire qu'elle a eu lieu.
    if (entry === null && draft.recurring) {
      addRecurrencePaidOn(
        { ...common, amount, period: periodOf(periodDraftOf(draft)), startedOn: draft.date },
        draft.date,
      )
      toast(fr.recurrences.added)
      onDone()
      return
    }

    /* Reprendre une échéance prévue pour en corriger le montant ne la confirme
       pas : modifier n'est pas confirmer, et la confirmation a son geste. */
    const payload = { ...common, amount, date: draft.date, status: entry?.status ?? 'confirmed' }
    if (entry === null) {
      addEntry(payload)
      toast(TOAST.added[toastKey(draft.nature, draft.direction)])
    } else {
      replaceEntry(entry.id, payload)
      toast(TOAST.updated[toastKey(draft.nature, draft.direction)])
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
          {titleFor(entry, draft.nature, draft.recurring)}
        </h1>
      </div>

      <form
        id="entry-form"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Tile className="gap-4">
          <div className="flex flex-wrap gap-2">
            <Segmented
              options={NATURES}
              value={draft.nature}
              onChange={(nature) => {
                /* Changer de nature vide la catégorie : les listes ne se
                   recouvrent pas, et une catégorie de charge restée en place
                   sur une saisie d'épargne serait enregistrée telle quelle.
                   L'épargne arrive en versement — c'est le geste courant ; on
                   n'y reprend qu'exceptionnellement. */
                patch({
                  nature,
                  direction: nature === 'income' ? 'in' : 'out',
                  categoryId: '',
                })
              }}
              label={fr.entry.nature}
            />

            {/* Les deux sens d'un mouvement d'épargne. Ailleurs, le sens
                découle de la nature et n'a pas à être demandé. */}
            {draft.nature === 'saving' && (
              <Segmented
                options={MOVEMENTS}
                value={draft.direction}
                onChange={(direction) => {
                  patch({ direction })
                }}
                label={fr.entry.savingMovement}
              />
            )}

            {/* Seulement à la création. Convertir après coup une dépense passée
                en récurrence — ou l'inverse — réécrirait un historique, et
                c'est une autre histoire que celle de cet écran. */}
            {entry === null && (
              <Segmented
                options={RHYTHMS}
                value={draft.recurring ? 'recurring' : 'once'}
                onChange={(rhythm) => {
                  patch({ recurring: rhythm === 'recurring' })
                }}
                label={fr.entry.rhythm}
              />
            )}
          </div>

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
                kinds={kindsOfNature(draft.nature)}
                value={draft.categoryId}
                onChange={(e) => {
                  patch({ categoryId: e.target.value })
                }}
              />
            )}
          </Field>

          {/* Un seul champ de date, dont le libellé suit le rythme : en
              récurrence, la date saisie est la première échéance. */}
          <Field
            label={draft.recurring ? fr.entry.firstDate : fr.entry.date}
            required
            {...(draft.recurring ? { hint: fr.entry.recurringHint } : {})}
          >
            {(id, describedBy) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                type="date"
                value={draft.date}
                onChange={(e) => {
                  if (e.target.value !== '') patch({ date: e.target.value })
                }}
              />
            )}
          </Field>

          {draft.recurring && (
            <PeriodFields draft={periodDraftOf(draft)} patch={patchPeriod} withStart={false} />
          )}

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
            /* La phrase sert d'aide tant qu'on n'a pas essayé d'enregistrer,
               puis d'erreur : c'est la même, et elle dit pourquoi ce champ,
               facultatif ailleurs, ne l'est pas ici. */
            <Field
              label={fr.entry.member}
              {...(needsMember
                ? { required: true, hint: fr.entry.memberRequired }
                : { optional: true })}
              {...(shown.member ? { error: shown.member } : {})}
            >
              {(id, describedBy) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  value={draft.memberId}
                  invalid={Boolean(shown.member)}
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

          {/* L'épargne ne se partage jamais : elle sort du compte, mais elle
              reste à qui la met de côté. La case n'a donc rien à faire ici, et
              l'y laisser permettrait de pousser un versement dans le pot
              commun — ce que la répartition refuse par ailleurs. */}
          {draft.nature !== 'saving' && (
            <SharedField
              categoryId={draft.categoryId}
              memberId={draft.memberId}
              value={draft.shared}
              onChange={(shared) => {
                patch({ shared })
              }}
            />
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
              toast(TOAST.removed[toastKey(draft.nature, entry.direction)])
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
      defaultNature={natureFromParam(params.get(NATURE_PARAM), params.get(DIRECTION_PARAM))}
      onDone={goBack}
    />
  )
}
