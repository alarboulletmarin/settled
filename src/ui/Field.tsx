import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/cn'
import { fr } from '@/i18n/fr'
import { Check } from './Icons'

const CONTROL = cn(
  'w-full rounded-input bg-surface-2 px-3.5 text-[15px] text-text',
  'border border-transparent outline-none',
  'placeholder:text-muted',
  'transition-colors duration-[var(--dur)] ease-ds',
  'disabled:opacity-40',
)

export type FieldProps = {
  label: string
  children: (id: string, describedBy: string | undefined) => ReactNode
  hint?: string
  error?: string
  optional?: boolean
  /** Marque le champ comme obligatoire, en pendant exact de `optional`. */
  required?: boolean
  className?: string
}

/**
 * Enveloppe libellé + aide + erreur. Le contrôle reste piloté par l'appelant.
 *
 * La mention se lit dans le libellé, donc dans le nom accessible du contrôle :
 * un lecteur d'écran annonce « Montant · obligatoire » sans qu'on ait à poser
 * un `aria-required` en plus.
 */
export function Field({
  label,
  children,
  hint,
  error,
  optional,
  required,
  className,
}: FieldProps) {
  const id = useId()
  const helpId = `${id}-help`
  const describedBy = error ?? hint ? helpId : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="t-label text-text">
        {label}
        {required === true && <span className="text-muted"> · {fr.common.required}</span>}
        {optional === true && <span className="text-muted"> · {fr.common.optional}</span>}
      </label>
      {children(id, describedBy)}
      {(error ?? hint) !== undefined && (
        <p id={helpId} className={cn('t-label', error !== undefined && 'text-danger-text')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  invalid?: boolean
  className?: string
}

export function TextInput({ invalid = false, className, ...rest }: TextInputProps) {
  return (
    <input
      className={cn(CONTROL, 'h-11', invalid && 'border-danger', className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}

/** Saisie de montant : tabular-nums et clavier numérique, sans exception. */
export function AmountInput({ invalid = false, className, ...rest }: TextInputProps) {
  return (
    <input
      className={cn(
        CONTROL,
        'tnum h-11 text-right font-medium',
        invalid && 'border-danger',
        className,
      )}
      inputMode="decimal"
      autoComplete="off"
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}

export type CheckboxProps = {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  /** Une phrase sous le libellé, quand la case demande à être expliquée. */
  hint?: string
  className?: string
}

/**
 * Case à cocher — un attribut vrai ou faux, pas un choix entre deux modes.
 *
 * `Segmented` sert à choisir parmi des positions qui s'excluent ; une case dit
 * qu'une chose est vraie ou ne l'est pas, et un formulaire qui empilerait trois
 * bascules pour poser trois booléens ne se lirait plus.
 *
 * La case native reste dans le DOM, seulement masquée : c'est elle qui porte
 * l'état pour un lecteur d'écran et qui répond à la barre d'espace. Le carré
 * dessiné n'est qu'un décor, d'où son `aria-hidden`.
 */
export function Checkbox({ checked, onChange, label, hint, className }: CheckboxProps) {
  const id = useId()
  const helpId = `${id}-help`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-text"
      >
        <span className="relative inline-flex shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            aria-describedby={hint === undefined ? undefined : helpId}
            onChange={(event) => {
              onChange(event.target.checked)
            }}
            className="peer absolute size-6 cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className={cn(
              'flex size-6 items-center justify-center rounded-[7px] border',
              'transition-colors duration-[var(--dur)] ease-ds',
              'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
              'peer-focus-visible:outline-[var(--accent-2)]',
              checked ? 'border-transparent bg-accent text-accent-fg' : 'border-border bg-surface-2',
            )}
          >
            {checked && <Check size={16} />}
          </span>
        </span>
        {label}
      </label>
      {hint !== undefined && (
        <p id={helpId} className="t-label">
          {hint}
        </p>
      )}
    </div>
  )
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  children: ReactNode
  className?: string
  /** Même signalement qu'un champ texte : bordure d'alerte et `aria-invalid`. */
  invalid?: boolean
}

export function Select({ children, className, invalid = false, ...rest }: SelectProps) {
  return (
    <select
      className={cn(CONTROL, 'h-11 appearance-none pr-9', invalid && 'border-danger', className)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  )
}
