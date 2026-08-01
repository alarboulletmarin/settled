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
  /**
   * La case dit ce qui est vrai sans qu'on puisse le changer. À n'employer
   * qu'avec un `hint` qui dit pourquoi : une case grisée sans raison se lit
   * comme une panne.
   */
  disabled?: boolean
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
export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
  className,
}: CheckboxProps) {
  const id = useId()
  const helpId = `${id}-help`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn(
          'flex min-h-11 items-center gap-3 text-[15px] text-text',
          // Verrouillée, la case garde sa couleur de texte pleine, contrairement
          // aux boutons désactivés qui passent à 40 % : elle n'est pas hors
          // service, elle informe — atténuer ce qu'on met là pour être lu, et
          // sous le plancher AA du DS §8, reviendrait à le cacher. C'est le
          // curseur, l'attribut natif et la phrase d'aide qui disent qu'on n'y
          // touche pas.
          disabled ? 'cursor-default' : 'cursor-pointer',
        )}
      >
        <span className="relative inline-flex shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            aria-describedby={hint === undefined ? undefined : helpId}
            onChange={(event) => {
              onChange(event.target.checked)
            }}
            className={cn(
              'peer absolute size-6 opacity-0',
              disabled ? 'cursor-default' : 'cursor-pointer',
            )}
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
