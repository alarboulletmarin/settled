/* ============================================================================
 * Thème — application du `data-theme` sur <html>.
 *
 * La préférence fait autorité dans le document de données (settings.theme),
 * mais IndexedDB est asynchrone : on en garde un miroir en localStorage, lu
 * par le script inline de index.html avant le premier rendu. Sans lui, l'app
 * s'afficherait une frame dans le mauvais thème.
 * ==========================================================================*/

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'tout-compte-fait.theme'

/**
 * La couleur de la barre système, quand la feuille de style n'a rien à dire.
 *
 * C'est `--bg` du thème clair de Classique, et ce n'en est plus une copie mais
 * un repli : la valeur servie vient désormais de la feuille elle-même, parce
 * qu'une palette la change. On n'arrive ici que là où aucune feuille n'a été
 * appliquée — sous jsdom, essentiellement ; un navigateur qui a peint l'app a
 * toujours mieux à donner.
 */
const FALLBACK_THEME_COLOR = '#F0F5F2'

/** La couleur de fond réellement calculée sur <html>, palette et thème compris. */
function currentBackground(): string {
  /* La valeur calculée d'une propriété personnalisée est déjà substituée : une
     déclaration `--bg: var(--pine-50)` se lit ici « #f0f5f2 », pas « var(…) ».
     Elle est vide tant qu'aucune feuille ne s'applique — d'où le repli. */
  const value = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  return value === '' ? FALLBACK_THEME_COLOR : value
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') return prefersDark() ? 'dark' : 'light'
  return preference
}

export function readStoredPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(raw) ? raw : 'system'
  } catch {
    return 'system'
  }
}

export function storePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Mode privé, quota plein : le thème restera juste à sa valeur par défaut
    // au prochain démarrage. Rien de bloquant.
  }
}

/**
 * Écrit le thème résolu sur <html> et aligne la couleur de barre système.
 *
 * La couleur est lue sur la feuille et non choisie ici : elle dépend désormais
 * de la palette autant que du thème, et une table de deux hexadécimaux dans ce
 * fichier serait une seconde vérité, fausse dès la première palette.
 */
export function applyResolvedTheme(resolved: ResolvedTheme): ResolvedTheme {
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
  syncThemeColor()
  return resolved
}

/**
 * Recopie `--bg` dans la balise `theme-color`.
 *
 * Appelée après toute écriture de `data-theme` ou de `data-palette` : c'est le
 * couple qui décide de la couleur, pas l'un des deux. La balise visée est celle
 * qui n'a pas de `media` — les balises conditionnelles d'`index.html` ont
 * disparu, justement parce qu'elles figeaient deux teintes de Classique.
 */
export function syncThemeColor(): void {
  const background = currentBackground()
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    if (!meta.hasAttribute('media')) meta.setAttribute('content', background)
  }
}

/** S'abonne au thème système. Renvoie la fonction de désabonnement. */
export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', onChange)
  return () => {
    media.removeEventListener('change', onChange)
  }
}
