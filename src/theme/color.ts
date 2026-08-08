/* ============================================================================
 * Le peu de colorimétrie qu'il faut pour éprouver une palette.
 *
 * Contraste WCAG 2.1 pour le plancher AA du DS §8, distance OKLab pour dire que
 * deux pastilles ne se confondent pas. Importé par `palettes.test.ts` seulement :
 * aucun écran ne calcule de couleur à l'exécution, c'est tout le propos de la
 * couche de tokens.
 * ==========================================================================*/

export type Rgba = { r: number; g: number; b: number; a: number }

function fromHex(hex: string): Rgba {
  const raw = hex.slice(1)
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
  }
}

/** Les arguments de tête d'une fonction CSS, virgules de premier niveau. */
function splitArgs(inner: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of inner) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim() !== '') parts.push(current.trim())
  return parts
}

/** L'index de la dernière espace de premier niveau — là où `<couleur> <part>` se coupe. */
function lastTopLevelSpace(text: string): number {
  let depth = 0
  let found = -1
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '(') depth += 1
    else if (char === ')') depth -= 1
    else if (char === ' ' && depth === 0) found = i
  }
  return found
}

/** Un pourcentage, littéral ou passé par un token et un `calc()`. */
function percentage(text: string, tokens: Record<string, string>): number {
  const value = text.trim()

  const literal = /^([\d.]+)%$/.exec(value)
  if (literal?.[1] !== undefined) return Number(literal[1])

  const variable = /^var\((--[a-z0-9-]+)\)$/.exec(value)
  if (variable?.[1] !== undefined) {
    const next = tokens[variable[1]]
    if (next === undefined) throw new Error(`Token non déclaré : ${variable[1]}`)
    return percentage(next, tokens)
  }

  const sum = /^calc\(([\s\S]+?)\s([+-])\s([\s\S]+)\)$/.exec(value)
  if (sum?.[1] !== undefined && sum[3] !== undefined) {
    const left = percentage(sum[1], tokens)
    const right = percentage(sum[3], tokens)
    return sum[2] === '+' ? left + right : left - right
  }

  throw new Error(`Pourcentage non modélisé : ${value}`)
}

/**
 * Une valeur de token, réduite en couleur.
 *
 * Ne connaît que ce que `tokens.css`, `palettes.css` et `components.css`
 * écrivent : un hexadécimal, `rgb(r g b / a)`, `color-mix(in srgb, C n%,
 * transparent)`, `transparent`, et une chaîne de `var()`. Tout le reste lève —
 * une valeur qu'on ne sait pas lire doit se voir, pas se deviner.
 */
export function evaluate(value: string, tokens: Record<string, string>, seen: string[] = []): Rgba {
  const text = value.trim()

  if (text === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  if (text.startsWith('#')) return fromHex(text)

  const variable = /^var\((--[a-z0-9-]+)\)$/.exec(text)
  if (variable?.[1] !== undefined) {
    const name = variable[1]
    if (seen.includes(name)) throw new Error(`Cycle de var() sur ${name}`)
    const next = tokens[name]
    if (next === undefined) throw new Error(`Token non déclaré : ${name}`)
    return evaluate(next, tokens, [...seen, name])
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(text)
  if (rgb?.[1] !== undefined) {
    const [channels, alpha] = rgb[1].split('/')
    const [r, g, b] = (channels ?? '').trim().split(/[\s,]+/).map(Number)
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a: alpha === undefined ? 1 : Number(alpha) }
  }

  const mix = /^color-mix\(([\s\S]+)\)$/.exec(text)
  if (mix?.[1] !== undefined) {
    const [space, first, second] = splitArgs(mix[1])
    if (space !== 'in srgb' || second !== 'transparent') {
      throw new Error(`color-mix non modélisé : ${text}`)
    }
    const cut = lastTopLevelSpace(first ?? '')
    if (cut === -1) throw new Error(`color-mix sans pourcentage : ${text}`)
    /* Mélanger avec `transparent` prémultiplie l'alpha : les canaux de la
       couleur sont conservés, seul son alpha vaut le pourcentage. C'est ce qui
       rend `color-mix(in srgb, #0b0e0d 62%, transparent)` strictement égal à
       `rgb(11 14 13 / 0.62)`. */
    const base = evaluate((first ?? '').slice(0, cut), tokens, seen)
    return { ...base, a: percentage((first ?? '').slice(cut + 1), tokens) / 100 }
  }

  throw new Error(`Valeur de couleur non modélisée : ${text}`)
}

/** Compose une couleur translucide sur un fond opaque. */
export function over(fg: Rgba, bg: Rgba): Rgba {
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  }
}

function channel(value: number): number {
  const s = value / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance({ r, g, b }: Rgba): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Le rapport de contraste WCAG 2.1 entre deux couleurs.
 *
 * Le fond doit être opaque : une couleur translucide se compose d'abord (voir
 * `over`). Le calcul rejoue à l'identique les six ratios écrits en commentaire
 * dans `tokens.css` — c'est ce qui permet de lui faire confiance sur les autres.
 */
export function contrast(fg: Rgba, bg: Rgba): number {
  const solid = fg.a < 1 ? over(fg, bg) : fg
  const [high, low] = [luminance(solid), luminance(bg)].sort((a, b) => b - a)
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05)
}

function oklab({ r, g, b }: Rgba): [number, number, number] {
  const [R, G, B] = [channel(r), channel(g), channel(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/**
 * La distance perceptuelle entre deux teintes, en OKLab.
 *
 * Le contraste ne sait pas dire qu'un violet et un bleu de même clarté ne se
 * confondent pas — il les donne à 1:1. Pour des pastilles, c'est la distance
 * qu'il faut : elle compte la teinte autant que la clarté.
 */
export function distance(a: Rgba, b: Rgba): number {
  const [l1, a1, b1] = oklab(a)
  const [l2, a2, b2] = oklab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}
