import { beforeEach, describe, expect, it } from 'vitest'
import {
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  isThemePreference,
  readStoredPreference,
  resolveTheme,
  storePreference,
} from './theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('retombe sur « system » si rien n’est stocké', () => {
    expect(readStoredPreference()).toBe('system')
  })

  it('retombe sur « system » si la valeur stockée est corrompue', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'chartreuse')
    expect(readStoredPreference()).toBe('system')
  })

  it('relit ce qu’il a écrit', () => {
    storePreference('dark')
    expect(readStoredPreference()).toBe('dark')
  })

  it('résout une préférence explicite sans consulter le système', () => {
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('écrit le thème résolu sur <html>', () => {
    applyResolvedTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    applyResolvedTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('reconnaît les trois préférences valides et rien d’autre', () => {
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('auto')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })
})
