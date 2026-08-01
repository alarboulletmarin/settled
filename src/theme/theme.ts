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

const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#F0F5F2',
  dark: '#2F5D4C',
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

/** Écrit le thème résolu sur <html> et aligne la couleur de barre système. */
export function applyResolvedTheme(resolved: ResolvedTheme): ResolvedTheme {
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    if (!meta.hasAttribute('media')) meta.setAttribute('content', THEME_COLOR[resolved])
  }
  return resolved
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  return applyResolvedTheme(resolveTheme(preference))
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
