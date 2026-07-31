/* ============================================================================
 * Money — entier signé, en centimes.
 *
 * Le type est *branded* : `a + b` sur deux Money produit un `number`, pas un
 * `Money`. Le résultat ne peut donc pas être réaffecté à un champ Money sans
 * repasser par `money()`, qui rejette tout non-entier. C'est ce qui interdit
 * structurellement l'arithmétique naïve — et donc le flottant.
 * ==========================================================================*/

declare const MONEY: unique symbol

export type Money = number & { readonly [MONEY]: 'Money' }

/** Construit un Money. Rejette tout ce qui n'est pas un entier fini. */
export function money(cents: number): Money {
  if (!Number.isInteger(cents)) {
    throw new TypeError(`Money attend un entier de centimes, reçu ${String(cents)}`)
  }
  return cents as Money
}

/** Vrai si la valeur est un entier fini, donc utilisable comme Money. */
export function isMoney(value: unknown): value is Money {
  return typeof value === 'number' && Number.isInteger(value)
}

export const ZERO: Money = 0 as Money

/* --- Arithmétique ---------------------------------------------------------*/

export function add(a: Money, b: Money): Money {
  return (a + b) as Money
}

export function sub(a: Money, b: Money): Money {
  return (a - b) as Money
}

export function neg(a: Money): Money {
  return (0 - a) as Money
}

export function abs(a: Money): Money {
  return Math.abs(a) as Money
}

export function sum(values: readonly Money[]): Money {
  let total = 0
  for (const v of values) total += v
  return total as Money
}

/** Multiplie par un entier. Refuse un facteur fractionnaire. */
export function mulInt(a: Money, factor: number): Money {
  if (!Number.isInteger(factor)) {
    throw new TypeError(`mulInt attend un entier, reçu ${String(factor)}`)
  }
  return (a * factor) as Money
}

/**
 * Divise par un entier non nul, arrondi au centime le plus proche,
 * la moitié s'éloignant de zéro (−2,5 → −3, 2,5 → 3).
 * C'est l'opération d'amortissement : une annuelle ramenée au mois.
 */
export function divInt(a: Money, divisor: number): Money {
  if (!Number.isInteger(divisor) || divisor === 0) {
    throw new TypeError(`divInt attend un entier non nul, reçu ${String(divisor)}`)
  }
  const quotient = a / divisor
  return (Math.sign(quotient) * Math.round(Math.abs(quotient))) as Money
}

/**
 * Applique un ratio entier/entier, avec le même arrondi que `divInt`.
 * Sert aux conversions de périodicité (hebdomadaire → mensuel : ×52/12).
 */
export function scale(a: Money, numerator: number, denominator: number): Money {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
    throw new TypeError('scale attend deux entiers et un dénominateur non nul')
  }
  const exact = (a * numerator) / denominator
  return (Math.sign(exact) * Math.round(Math.abs(exact))) as Money
}

/* --- Comparaison ----------------------------------------------------------*/

export function isZero(a: Money): boolean {
  return a === 0
}

export function isNegative(a: Money): boolean {
  return a < 0
}

export function compare(a: Money, b: Money): number {
  return a - b
}

export function max(a: Money, b: Money): Money {
  return a >= b ? a : b
}

export function min(a: Money, b: Money): Money {
  return a <= b ? a : b
}

/**
 * Part de `a` dans `total`, entre 0 et 1. Renvoie un `number`, pas un Money :
 * un ratio n'est pas un montant, et c'est le seul flottant toléré.
 */
export function ratio(a: Money, total: Money): number {
  if (total === 0) return 0
  return a / total
}

/* --- Saisie utilisateur ---------------------------------------------------*/

/**
 * Parse une saisie libre en Money. Accepte « 12,50 », « 12.5 », « 1 234,56 »,
 * « 1234 ». Tronque au-delà de deux décimales. Renvoie null si illisible.
 */
export function parseAmount(input: string): Money | null {
  const cleaned = input.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.')
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null

  const negative = cleaned.startsWith('-')
  const body = negative ? cleaned.slice(1) : cleaned
  const dot = body.indexOf('.')
  const whole = dot === -1 ? body : body.slice(0, dot)
  const frac = dot === -1 ? '' : body.slice(dot + 1)
  if (frac.length > 2) return null

  const cents = Number(whole || '0') * 100 + Number((frac + '00').slice(0, 2))
  if (!Number.isFinite(cents)) return null
  return ((negative ? -cents : cents) as Money)
}

/** Rend un Money dans la forme attendue par un champ de saisie : « 12,50 ». */
export function toAmountInput(a: Money): string {
  const negative = a < 0
  const c = Math.abs(a)
  return `${negative ? '-' : ''}${Math.trunc(c / 100)},${String(c % 100).padStart(2, '0')}`
}
