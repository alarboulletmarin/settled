/* ============================================================================
 * Lecture des tokens depuis les feuilles de style, pour les éprouver.
 *
 * Ce module n'est importé que par `palettes.test.ts`. Il existe séparément parce
 * qu'un test qui recopierait les valeurs qu'il vérifie ne vérifierait que la
 * copie : ici, la source est `styles/tokens.css` et `styles/palettes.css`
 * eux-mêmes, embarqués par `?raw` comme `schemaDoc.ts` embarque `domain/types`.
 *
 * Le modèle de cascade est volontairement minuscule — il ne connaît que le
 * vocabulaire de sélecteurs que ces deux fichiers emploient, et lève sur tout le
 * reste plutôt que de deviner.
 * ==========================================================================*/

export type Declarations = Record<string, string>
export type Rule = { selector: string; declarations: Declarations }

/** L'index du `}` qui ferme le `{` situé à `open`. */
function closingBrace(css: string, open: number): number {
  let depth = 0
  let i = open
  do {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') depth -= 1
    i += 1
  } while (depth > 0 && i < css.length)
  return i
}

/**
 * Ouvre les `@layer` sans jeter leur contenu.
 *
 * `components.css` range tout dans `@layer components`, `.tile--accent`
 * comprise : la sauter reviendrait à ne rien lire de ce fichier. Une couche
 * n'est pas une condition — ce qu'elle contient s'applique —, contrairement à
 * `@media` et `@container`, qui restent sautés plus bas.
 */
function unwrapLayers(css: string): string {
  const at = /@layer\s+[\w-]+\s*\{/.exec(css)
  if (at === null) return css
  const open = at.index + at[0].length - 1
  const close = closingBrace(css, open)
  const inner = css.slice(open + 1, close - 1)
  return unwrapLayers(css.slice(0, at.index) + inner + css.slice(close))
}

/** Retire les commentaires, les at-règles à bloc et les at-règles à ligne. */
function strip(css: string): string {
  const withoutComments = unwrapLayers(css.replace(/\/\*[\s\S]*?\*\//g, ''))
  let out = ''
  let i = 0
  while (i < withoutComments.length) {
    if (withoutComments[i] === '@') {
      const rest = withoutComments.slice(i)
      const semi = rest.indexOf(';')
      const brace = rest.indexOf('{')
      // `@import`, `@custom-variant` : une ligne, rien à garder.
      if (brace === -1 || (semi !== -1 && semi < brace)) {
        i += semi + 1
        continue
      }
      // `@theme`, `@media` : un bloc, qu'on saute en entier. Aucun des deux ne
      // déclare de couleur qu'un composant lise directement.
      let depth = 0
      let j = i + brace
      do {
        if (withoutComments[j] === '{') depth += 1
        else if (withoutComments[j] === '}') depth -= 1
        j += 1
      } while (depth > 0 && j < withoutComments.length)
      i = j
      continue
    }
    out += withoutComments[i]
    i += 1
  }
  return out
}

/** Les règles plates d'une feuille, dans l'ordre du document. */
export function parseRules(css: string): Rule[] {
  const rules: Rule[] = []
  for (const match of strip(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? '').trim()
    const declarations: Declarations = {}
    for (const line of (match[2] ?? '').split(';')) {
      const colon = line.indexOf(':')
      if (colon === -1) continue
      const name = line.slice(0, colon).trim()
      if (!name.startsWith('--')) continue
      declarations[name] = line.slice(colon + 1).trim()
    }
    if (selector !== '') rules.push({ selector, declarations })
  }
  return rules
}

/**
 * Une règle s'applique-t-elle à `<html data-palette=… data-theme=…>` ?
 *
 * Seule la forme composée est modélisée. La forme descendante de
 * `palettes.css` — `[data-palette='x'] [data-theme='y']:not([data-palette])` —
 * ne vise jamais `<html>`, qui porte les deux attributs sur lui-même ; et comme
 * les deux sélecteurs partagent le même bloc de déclarations, l'ignorer ne perd
 * aucune valeur.
 */
function matches(selector: string, palette: string, theme: string): number | null {
  let best: number | null = null
  for (const part of selector.split(',')) {
    const one = part.trim()
    if (one.includes(' ')) continue // forme descendante
    if (one === ':root') {
      best = Math.max(best ?? 0, 1)
      continue
    }
    const attrs = [...one.matchAll(/\[data-(palette|theme)='([a-z-]+)'\]/g)]
    /* Le sélecteur doit être exactement la concaténation de ce qu'on a reconnu.
       Sans ce contrôle, `[data-theme='light']:not([data-palette])` passerait pour
       un simple `[data-theme='light']` — soit précisément la confusion que le
       `:not()` existe pour lever. */
    if (attrs.length === 0 || attrs.map(([whole]) => whole).join('') !== one) continue
    const ok = attrs.every(([, key, value]) =>
      key === 'palette' ? value === palette : value === theme,
    )
    if (ok) best = Math.max(best ?? 0, attrs.length)
  }
  return best
}

/**
 * Les tokens tels qu'ils valent pour un couple (palette, thème), après cascade.
 *
 * À spécificité égale, c'est l'ordre du document qui tranche — et il tranche
 * pour de bon ici : `--focus` est posé dans le `:root` invariant de `tokens.css`
 * puis repointé plus bas par le bloc sombre, à spécificité identique.
 */
export function resolveTokens(sheets: string[], palette: string, theme: string): Declarations {
  const winners: Declarations = {}
  const specificity: Record<string, number> = {}
  for (const sheet of sheets) {
    for (const rule of parseRules(sheet)) {
      const spec = matches(rule.selector, palette, theme)
      if (spec === null) continue
      for (const [name, value] of Object.entries(rule.declarations)) {
        if (spec >= (specificity[name] ?? 0)) {
          winners[name] = value
          specificity[name] = spec
        }
      }
    }
  }
  return winners
}

/**
 * Une règle atteint-elle un **sous-arbre** qui force `(palette, thème)` ?
 *
 * C'est la question que `resolveTokens` ne pose pas : elle modélise <html>, où
 * `:root` s'applique. Une vignette d'aperçu, elle, n'est pas la racine — un
 * token que seul `:root` déclare ne s'y redéclare pas, et le sous-arbre hérite
 * alors la valeur de la palette ambiante au lieu de la sienne.
 */
function matchesSubtree(selector: string, palette: string, theme: string): boolean {
  return selector.split(',').some((part) => {
    const one = part.trim()
    // `:root` ne vise que <html> ; la forme descendante porte un
    // `:not([data-palette])`, et un sous-arbre qui force une palette en porte un.
    if (one === ':root' || one.includes(' ')) return false
    // Les alias de `tokens.css`, posés sur l'attribut nu pour redériver partout.
    if (one === '[data-theme]' || one === '[data-palette]') return true
    const attrs = [...one.matchAll(/\[data-(palette|theme)='([a-z-]+)'\]/g)]
    if (attrs.length === 0 || attrs.map(([whole]) => whole).join('') !== one) return false
    return attrs.every(([, key, value]) =>
      key === 'palette' ? value === palette : value === theme,
    )
  })
}

/** Les tokens qu'un sous-arbre forçant `(palette, thème)` redéclare lui-même. */
export function subtreeDeclarations(sheets: string[], palette: string, theme: string): Set<string> {
  const names = new Set<string>()
  for (const sheet of sheets) {
    for (const rule of parseRules(sheet)) {
      if (!matchesSubtree(rule.selector, palette, theme)) continue
      for (const name of Object.keys(rule.declarations)) names.add(name)
    }
  }
  return names
}

/** Les déclarations d'une classe de composant — `.tile--accent`, par exemple. */
export function classDeclarations(css: string, className: string): Declarations {
  const rule = parseRules(css).find((r) =>
    r.selector.split(',').some((part) => part.trim() === className),
  )
  if (rule === undefined) throw new Error(`Règle introuvable : ${className}`)
  return rule.declarations
}

/** Les noms de tokens qu'une palette pose elle-même, tous blocs confondus. */
export function paletteDeclarations(css: string, palette: string): Set<string> {
  const names = new Set<string>()
  for (const rule of parseRules(css)) {
    if (!rule.selector.includes(`[data-palette='${palette}']`)) continue
    for (const name of Object.keys(rule.declarations)) names.add(name)
  }
  return names
}

/** Les palettes déclarées par une feuille, dans l'ordre où elles y viennent. */
export function declaredPalettes(css: string): string[] {
  const found: string[] = []
  for (const rule of parseRules(css)) {
    for (const [, name] of rule.selector.matchAll(/\[data-palette='([a-z-]+)'\]/g)) {
      if (name !== undefined && !found.includes(name)) found.push(name)
    }
  }
  return found
}
