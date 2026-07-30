import { useEffect, useSyncExternalStore } from 'react'
import {
  type ResolvedTheme,
  type ThemePreference,
  applyResolvedTheme,
  prefersDark,
  storePreference,
  watchSystemTheme,
} from './theme'

const getServerSnapshot = (): boolean => false

/**
 * Applique une préférence de thème au document. La préférence fait autorité
 * dans `settings.theme` ; on en écrit un miroir en localStorage pour que le
 * script inline de index.html puisse peindre le bon thème avant le premier
 * rendu, IndexedDB étant asynchrone.
 */
export function useApplyTheme(preference: ThemePreference): ResolvedTheme {
  const systemDark = useSyncExternalStore(watchSystemTheme, prefersDark, getServerSnapshot)
  const resolved: ResolvedTheme =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    applyResolvedTheme(resolved)
  }, [resolved])

  useEffect(() => {
    storePreference(preference)
  }, [preference])

  return resolved
}
