import { useEffect, useSyncExternalStore } from 'react'
import type { PaletteSetting } from '@/domain/types'
import { applyPalette, storePalette } from './palette'
import {
  type ResolvedTheme,
  type ThemePreference,
  applyResolvedTheme,
  prefersDark,
  storePreference,
  syncThemeColor,
  watchSystemTheme,
} from './theme'

const getServerSnapshot = (): boolean => false

/**
 * Applique l'apparence au document : un thème et une palette.
 *
 * Les deux préférences font autorité dans `settings`; on en écrit un miroir en
 * localStorage pour que le script inline d'index.html puisse peindre les bonnes
 * couleurs avant le premier rendu, IndexedDB étant asynchrone.
 *
 * **Un seul hook pour les deux**, et un seul effet qui écrit sur le document :
 * la couleur de la barre système se lit sur `--bg`, qui dépend du couple. En
 * deux effets, un changement de palette laisserait la barre une frame sur la
 * couleur de l'ancienne — le genre de décalage qu'on ne voit qu'une fois sur
 * dix et qu'on ne sait plus reproduire.
 */
export function useApplyAppearance(
  preference: ThemePreference,
  palette: PaletteSetting,
): ResolvedTheme {
  const systemDark = useSyncExternalStore(watchSystemTheme, prefersDark, getServerSnapshot)
  const resolved: ResolvedTheme =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    applyPalette(palette)
    applyResolvedTheme(resolved)
    /* `applyResolvedTheme` l'appelle déjà, mais il la lit avant que la palette
       ait pu changer quoi que ce soit au style calculé si l'ordre s'inverse un
       jour. La rappeler ici coûte une lecture et rend l'effet indépendant de
       l'ordre de ses deux lignes. */
    syncThemeColor()
  }, [resolved, palette])

  useEffect(() => {
    storePreference(preference)
  }, [preference])

  useEffect(() => {
    storePalette(palette)
  }, [palette])

  return resolved
}
