import { type ReactNode, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { entryPath } from '@/app/routes'
import { type Money, parseAmount, toAmountInput } from '@/domain/money'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDateCompact, tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import { confirmEntries, confirmEntry, unconfirmEntries, undoable } from '@/store/actions'
import { useCategoryMap, useMonthPending, useMonthUnconfirmable } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { AmountInput } from '@/ui/Field'
import { Check, ToConfirmIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { toast } from '@/ui/toast'

/**
 * La partie ouvrante d'une ligne : tout sauf le contrôle de confirmation.
 *
 * C'est un bouton à part, et non la ligne entière, parce qu'un bouton de
 * confirmation ne peut pas vivre à l'intérieur d'un autre bouton. Elle mène à
 * l'écran de saisie, qui sait déjà corriger un montant, changer une date,
 * réattribuer un membre ou supprimer l'échéance : la confirmation n'a jamais
 * été le seul geste possible sur une échéance prévue, elle était juste le seul
 * qu'on pouvait atteindre.
 */
function OpenPart({
  entry,
  color,
  meta,
  onOpen,
  className,
}: {
  entry: Entry
  color: string
  meta: string
  onOpen: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={tpl(fr.month.openEntry, entry.label)}
      className={cn(
        'flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-inner px-1 text-left',
        'transition-colors duration-[var(--dur)] ease-ds hover:bg-surface-2',
        className,
      )}
    >
      <Dot color={color} outlined />
      <span className="flex min-w-0 flex-col">
        <span className="t-body truncate">{entry.label}</span>
        <span className="t-axis truncate">{meta}</span>
      </span>
    </button>
  )
}

/**
 * La colonne de montant, de largeur fixe : c'est elle qui aligne un montant en
 * clair et un champ de saisie d'une ligne à l'autre, au lieu de les laisser
 * flotter chacun au bout du sien.
 */
function AmountCell({ children }: { children: ReactNode }) {
  return <span className="flex w-24 shrink-0 justify-end">{children}</span>
}

/* L'étiquette passe par `aria-label` et non par un `sr-only` adjacent : le
   `gap-2` du bouton espacerait ce dernier comme un vrai contenu, et lui ferait
   coûter neuf pixels de large qui manquent au libellé. */
function ConfirmButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  return (
    <Button
      size="sm"
      aria-label={fr.month.confirmOne}
      className="shrink-0"
      {...(disabled === undefined ? {} : { disabled })}
      onClick={onConfirm}
    >
      <Check size={16} />
    </Button>
  )
}

/** Une échéance à montant fixe : elle se confirme telle quelle. */
function FixedRow({ entry, color, onOpen }: { entry: Entry; color: string; onOpen: () => void }) {
  return (
    <li className="flex items-center gap-2">
      <OpenPart entry={entry} color={color} meta={formatDateCompact(entry.date)} onOpen={onOpen} />
      <AmountCell>
        <Amount value={entry.amount} direction={entry.direction} />
      </AmountCell>
      <ConfirmButton
        onConfirm={() => {
          confirmEntry(entry.id)
          toast(fr.month.confirmedOne)
        }}
      />
    </li>
  )
}

/**
 * Une échéance à montant variable. Le champ porte le montant de la dernière
 * échéance confirmée, et sa ligne le dit à sa place — l'explication vaut mieux
 * à côté du champ qu'en tête d'un encadré qu'on aura oublié en y arrivant.
 */
function VariableRow({
  entry,
  color,
  onOpen,
}: {
  entry: Entry
  color: string
  onOpen: () => void
}) {
  const [text, setText] = useState(() => (entry.amount === 0 ? '' : toAmountInput(entry.amount)))
  const parsed: Money | null = parseAmount(text)
  const ready = parsed !== null && parsed > 0

  return (
    <li className="flex items-center gap-2">
      <OpenPart
        entry={entry}
        color={color}
        meta={`${formatDateCompact(entry.date)} · ${fr.month.toFill}`}
        onOpen={onOpen}
      />
      {/* La largeur du champ est portée par la colonne, pas par le champ :
          `AmountInput` a déjà `w-full`, et lui poser une seconde largeur laisse
          l'ordre de la feuille générée trancher — c'est ce qui lui faisait
          réclamer toute la ligne, et renvoyer le reste au niveau suivant. */}
      <AmountCell>
        <AmountInput
          value={text}
          aria-label={`${fr.entry.amount} — ${entry.label}`}
          placeholder="0,00"
          className="px-2"
          onChange={(e) => {
            setText(e.target.value)
          }}
        />
      </AmountCell>
      <ConfirmButton
        disabled={!ready}
        onConfirm={() => {
          if (parsed === null) return
          confirmEntry(entry.id, parsed)
          toast(fr.month.confirmedOne)
        }}
      />
    </li>
  )
}

/**
 * Les échéances prévues du mois, en une seule liste par date.
 *
 * Une seule, et non deux : les montants à saisir étaient rangés dans un
 * encadré séparé, ce qui les faisait passer pour autre chose que ce qu'ils
 * sont — des échéances à confirmer, comme les autres, à ceci près qu'il faut
 * d'abord dire combien.
 */
export function PendingSection() {
  const { fixed, variable } = useMonthPending()
  const categories = useCategoryMap()
  const navigate = useNavigate()
  const unconfirmable = useMonthUnconfirmable()
  const [undoing, setUndoing] = useState(false)

  const all = useMemo(
    () =>
      [...fixed, ...variable].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    [fixed, variable],
  )
  const toFill = useMemo(() => new Set(variable.map((e) => e.id)), [variable])

  const undo = (
    <ConfirmDialog
      open={undoing}
      title={fr.month.unconfirmAll}
      steps={[
        {
          question: tpl(fr.month.unconfirmAllConfirm, unconfirmable.length),
          action: fr.month.unconfirm,
        },
      ]}
      onCancel={() => {
        setUndoing(false)
      }}
      onConfirm={() => {
        setUndoing(false)
        undoable(fr.month.unconfirmedAll, () => {
          unconfirmEntries(unconfirmable.map((e) => e.id))
        })
      }}
    />
  )

  /* Le mois bouclé n'efface pas la section : c'est ici qu'on a confirmé, c'est
     donc ici qu'on doit pouvoir revenir dessus. Elle se réduit à sa phrase et
     au geste inverse — sans quoi « Confirmer le mois » fait disparaître le seul
     endroit où l'on aurait cherché comment le défaire. */
  if (all.length === 0) {
    if (unconfirmable.length === 0) return null
    return (
      <Tile className="flex flex-col gap-3">
        <Eyebrow icon={ToConfirmIcon}>{fr.month.toConfirm}</Eyebrow>
        <p className="t-label">{fr.month.done}</p>
        <Button
          variant="ghost"
          className="self-start"
          onClick={() => {
            setUndoing(true)
          }}
        >
          {fr.month.unconfirmAll}
        </Button>
        {undo}
      </Tile>
    )
  }

  const colorOf = (categoryId: string): string =>
    categories.get(categoryId)?.color ?? 'var(--cat-rest)'

  const open = (entry: Entry): void => {
    void navigate(entryPath(entry.id))
  }

  const confirmAll = (): void => {
    confirmEntries(fixed.map((e) => e.id))
    toast(fr.month.confirmedAll)
  }

  return (
    <Tile className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow icon={ToConfirmIcon}>
          {tpl(`${fr.month.toConfirm} · %s`, all.length)}
        </Eyebrow>
        {fixed.length > 0 && <Button onClick={confirmAll}>{fr.month.confirmAll}</Button>}
      </div>

      {/* Dit ce que « Confirmer le mois » laisse derrière lui, plutôt que de
          laisser découvrir que des lignes restent après l'avoir actionné. */}
      {fixed.length > 0 && variable.length > 0 && (
        <p className="t-label">{fr.month.confirmAllHint}</p>
      )}

      <ul className="flex flex-col gap-1">
        {all.map((entry) =>
          toFill.has(entry.id) ? (
            <VariableRow
              key={entry.id}
              entry={entry}
              color={colorOf(entry.categoryId)}
              onOpen={() => {
                open(entry)
              }}
            />
          ) : (
            <FixedRow
              key={entry.id}
              entry={entry}
              color={colorOf(entry.categoryId)}
              onOpen={() => {
                open(entry)
              }}
            />
          ),
        )}
      </ul>

      {/* Le retour en arrière reste atteignable tant qu'il reste quelque chose
          à ramener, y compris quand le mois n'est confirmé qu'à moitié. */}
      {unconfirmable.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            setUndoing(true)
          }}
        >
          {fr.month.unconfirmAll}
        </Button>
      )}
      {undo}
    </Tile>
  )
}
