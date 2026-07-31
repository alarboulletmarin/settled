import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { entryPath } from '@/app/routes'
import { type Money, parseAmount, toAmountInput } from '@/domain/money'
import type { Entry } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDateCompact, tpl } from '@/i18n/format'
import { cn } from '@/lib/cn'
import { confirmEntries, confirmEntry } from '@/store/actions'
import { useCategoryMap, useMonthPending } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
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

function ConfirmButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  return (
    <Button size="sm" {...(disabled === undefined ? {} : { disabled })} onClick={onConfirm}>
      <Check size={16} />
      <span className="sr-only">{fr.month.confirmOne}</span>
    </Button>
  )
}

/** Une échéance à montant fixe : elle se confirme telle quelle. */
function FixedRow({ entry, color, onOpen }: { entry: Entry; color: string; onOpen: () => void }) {
  return (
    <li className="flex items-center gap-2">
      <OpenPart entry={entry} color={color} meta={formatDateCompact(entry.date)} onOpen={onOpen} />
      <Amount value={entry.amount} direction={entry.direction} className="shrink-0" />
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
    <li className="flex flex-wrap items-center gap-2">
      {/* Un plancher de largeur ici seulement : le champ de saisie ne
          rétrécit pas, et sans lui il écraserait le libellé jusqu'à sa
          première lettre. En dessous, la ligne passe sur deux niveaux. */}
      <OpenPart
        entry={entry}
        color={color}
        meta={`${formatDateCompact(entry.date)} · ${fr.month.toFill}`}
        onOpen={onOpen}
        className="min-w-36"
      />
      <span className="ml-auto flex shrink-0 items-center gap-2">
        <AmountInput
          value={text}
          aria-label={`${fr.entry.amount} — ${entry.label}`}
          placeholder="0,00"
          className="w-24"
          onChange={(e) => {
            setText(e.target.value)
          }}
        />
        <ConfirmButton
          disabled={!ready}
          onConfirm={() => {
            if (parsed === null) return
            confirmEntry(entry.id, parsed)
            toast(fr.month.confirmedOne)
          }}
        />
      </span>
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

  const all = useMemo(
    () =>
      [...fixed, ...variable].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    [fixed, variable],
  )
  const toFill = useMemo(() => new Set(variable.map((e) => e.id)), [variable])

  if (all.length === 0) return null

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
    </Tile>
  )
}
