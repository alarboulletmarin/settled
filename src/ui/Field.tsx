import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/cn'
import { fr } from '@/i18n/fr'

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

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  children: ReactNode
  className?: string
}

export function Select({ children, className, ...rest }: SelectProps) {
  return (
    <select className={cn(CONTROL, 'h-11 appearance-none pr-9', className)} {...rest}>
      {children}
    </select>
  )
}
