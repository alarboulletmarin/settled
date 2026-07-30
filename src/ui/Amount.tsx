import type { Money } from '@/domain/money'
import { formatMoney, moneyParts } from '@/i18n/format'
import { fr } from '@/i18n/fr'
import { cn } from '@/lib/cn'
import { useCurrency } from './currency'

export type AmountSize = 'hero' | 'tile' | 'body' | 'label'
export type AmountTone = 'default' | 'muted' | 'danger'

export type AmountProps = {
  value: Money
  size?: AmountSize
  /**
   * Renseigné, la valeur est traitée comme un flux : on affiche sa valeur
   * absolue, précédée de « + » pour une entrée. Une sortie ne porte pas de
   * signe, elle se lit à son contexte (DS §3).
   * Laissé vide, la valeur est un solde : le « − » est affiché.
   */
  direction?: 'in' | 'out'
  tone?: AmountTone
  withCents?: boolean
  currency?: string
  className?: string
}

const SIZE_CLASS: Record<AmountSize, string> = {
  hero: 't-hero',
  tile: 't-tile-num',
  body: 't-body font-medium',
  label: 't-label',
}

/** Les centimes d'un chiffre héros passent à 0.5em (DS §3). */
const CENTS_EM: Record<AmountSize, string> = {
  hero: '0.5em',
  tile: '1em',
  body: '1em',
  label: '1em',
}

const TONE_CLASS: Record<AmountTone, string> = {
  default: 'text-text',
  muted: 'text-muted',
  danger: 'text-danger',
}

/**
 * Le composant unique pour tout montant. Il porte seul le tabular-nums, le
 * symbole, les centimes réduits et le signe : aucun autre composant ne met
 * un montant en forme.
 */
export function Amount({
  value,
  size = 'body',
  direction,
  tone = 'default',
  withCents = true,
  currency,
  className,
}: AmountProps) {
  const activeCurrency = useCurrency()
  const code = currency ?? activeCurrency
  const displayed = (direction ? Math.abs(value) : value) as Money
  const parts = moneyParts(displayed, code)
  const sign = direction === 'in' ? '+' : parts.sign

  const spoken = `${direction === 'in' ? '+' : ''}${formatMoney(displayed, code, withCents)}`
  const label =
    direction === 'out' ? `${fr.direction.out.toLowerCase()} ${spoken}` : spoken

  return (
    <span
      className={cn('tnum inline-flex items-start', SIZE_CLASS[size], TONE_CLASS[tone], className)}
      aria-label={label}
    >
      <span aria-hidden="true">
        {sign}
        {parts.integer}
        {withCents && (
          <span style={{ fontSize: CENTS_EM[size] }}>
            ,{parts.fraction}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="ml-[0.18em] opacity-50"
        style={{ fontSize: '0.55em', lineHeight: 1.2 }}
      >
        {parts.symbol}
      </span>
    </span>
  )
}
