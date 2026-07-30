import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  type ResolvedTheme,
  type ThemePreference,
  applyResolvedTheme,
  prefersDark,
  readStoredPreference,
  storePreference,
  watchSystemTheme,
} from './theme'

export type ThemeControl = {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (next: ThemePreference) => void
}

const getServerSnapshot = (): boolean => false

/**
 * Source unique du thème côté React. `onPersist` permet à la coquille de
 * répercuter la préférence dans le document de données (settings.theme) ;
 * le miroir localStorage, lui, est écrit dans tous les cas.
 */
export function useTheme(onPersist?: (next: ThemePreference) => void): ThemeControl {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)

  const systemDark = useSyncExternalStore(watchSystemTheme, prefersDark, getServerSnapshot)
  const resolved: ResolvedTheme =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    applyResolvedTheme(resolved)
  }, [resolved])

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next)
      storePreference(next)
      onPersist?.(next)
    },
    [onPersist],
  )

  return { preference, resolved, setPreference }
}
