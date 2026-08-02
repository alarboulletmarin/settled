/* ============================================================================
 * Mise en forme française. Les composants n'assemblent jamais un montant ou
 * une date à la main : ils passent par ici (ou par <Amount />).
 * ==========================================================================*/

import type { Money } from '@/domain/money'
import { type ISODate, type YearMonth, dayOfWeek, parseISO, parseYm } from '@/domain/date'
import { fr } from './fr'

const NBSP_NARROW = ' '

const groupFormatter = new Intl.NumberFormat('fr-FR', {
  useGrouping: true,
  maximumFractionDigits: 0,
})

const symbolCache = new Map<string, string>()

/** Symbole d'une devise ISO 4217. Retombe sur le code si la devise est inconnue. */
export function currencySymbol(currency: string): string {
  const cached = symbolCache.get(currency)
  if (cached !== undefined) return cached
  const symbol = readSymbol(currency)
  symbolCache.set(currency, symbol)
  return symbol
}

function readSymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0)
    return parts.find((p) => p.type === 'currency')?.value ?? currency
  } catch {
    return currency
  }
}

export type MoneyParts = {
  /** « - » uniquement, jamais « + » : le signe positif est décidé par l'appelant. */
  sign: string
  integer: string
  fraction: string
  symbol: string
}

/**
 * Découpe un montant pour l'affichage. La partie décimale est rendue à part
 * parce que le DS la réduit à 0.5em sur un chiffre héros.
 *
 * `rounded` sert aux lectures sans centimes : l'unité y est arrondie, jamais
 * tronquée. Tronquer ferait lire « reste 56 € à payer » sur 56,69 € — une
 * erreur systématiquement en faveur de qui la lit, ce qui est la mauvaise
 * direction pour un reste à payer.
 */
export function moneyParts(value: Money, currency: string, rounded = false): MoneyParts {
  const negative = value < 0
  const cents = Math.abs(value)
  const units = rounded ? Math.round(cents / 100) : Math.trunc(cents / 100)
  return {
    sign: negative ? '−' : '',
    integer: groupFormatter.format(units),
    fraction: String(cents % 100).padStart(2, '0'),
    symbol: currencySymbol(currency),
  }
}

/** Montant en une seule chaîne — pour un `aria-label` ou un titre SVG. */
export function formatMoney(value: Money, currency: string, withCents = true): string {
  const p = moneyParts(value, currency, !withCents)
  const body = withCents ? `${p.integer},${p.fraction}` : p.integer
  return `${p.sign}${body}${NBSP_NARROW}${p.symbol}`
}

/** Montant signé explicitement : « +1 200,00 € ». Pour les écarts. */
export function formatSignedMoney(value: Money, currency: string): string {
  const prefix = value > 0 ? '+' : ''
  return prefix + formatMoney(value, currency)
}

/** Pourcentage arrondi à l'entier : « 42 % ». */
export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits).replace('.', ',')}${NBSP_NARROW}%`
}

/** Écart relatif signé : « +12 % », « −4 % », « — » si la base est nulle. */
export function formatDelta(value: number | null, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${(Math.abs(value) * 100).toFixed(digits).replace('.', ',')}${NBSP_NARROW}%`
}

/** Remplit les « %s » d'un gabarit de `fr.ts`, dans l'ordre. */
export function tpl(template: string, ...values: (string | number)[]): string {
  let index = 0
  return template.replace(/%s/g, () => {
    const value = values[index]
    index += 1
    return value === undefined ? '' : String(value)
  })
}

/* --- Dates ----------------------------------------------------------------*/

export function monthName(month: number): string {
  return fr.calendarNames.months[month - 1] ?? ''
}

export function monthNameShort(month: number): string {
  return fr.calendarNames.monthsShort[month - 1] ?? ''
}

/** « juillet 2026 » */
export function formatYearMonth(value: YearMonth): string {
  const { y, m } = parseYm(value)
  return `${monthName(m)} ${String(y)}`
}

/**
 * « juillet » — le mois seul.
 *
 * Pour les endroits où l'année ne tient pas et où elle n'apprend rien : un
 * report vient toujours du mois précédent, donc « de décembre » lu en janvier
 * ne peut désigner qu'un seul décembre.
 */
export function formatMonthName(value: YearMonth): string {
  return monthName(parseYm(value).m)
}

/** « 12 juillet 2026 » */
export function formatDate(iso: ISODate): string {
  const { y, m, d } = parseISO(iso)
  return `${d === 1 ? '1er' : String(d)} ${monthName(m)} ${String(y)}`
}

/** « 12 juil. » */
export function formatDayMonthShort(iso: ISODate): string {
  const { m, d } = parseISO(iso)
  return `${String(d)} ${monthNameShort(m)}`
}

/** « mar. 12 juil. » */
export function formatDayFull(iso: ISODate): string {
  const { m, d } = parseISO(iso)
  const weekday = fr.calendarNames.weekdaysShort[dayOfWeek(iso) - 1] ?? ''
  return `${weekday} ${String(d)} ${monthNameShort(m)}`
}

/** Date compacte pour un sous-libellé mono : « 12/07 ». */
export function formatDateCompact(iso: ISODate): string {
  const { m, d } = parseISO(iso)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

/** « dans 3 jours », « aujourd'hui », « il y a 2 jours ». */
export function formatRelativeDays(days: number): string {
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'demain'
  if (days === -1) return 'hier'
  if (days > 0) return `dans ${String(days)} jours`
  return `il y a ${String(-days)} jours`
}

/**
 * « de Camille », mais « d'Alice ». « de septembre », mais « d'octobre ».
 *
 * L'élision dépend du mot qui suit, et un gabarit de `fr.ts` ne peut pas la
 * décider : elle vit donc ici, avec les autres règles de la langue. Le h est
 * traité comme muet — « d'Hugo » se dit, « de Hugo » ne se dit pas.
 */
export function de(word: string): string {
  return /^[aeiouyàâäéèêëîïôöùûüh]/i.test(word) ? `d’${word}` : `de ${word}`
}
