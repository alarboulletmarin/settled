/* ============================================================================
 * Palette — application du `data-palette` sur <html>.
 *
 * Même mécanique que le thème, et pour la même raison : la préférence fait
 * autorité dans le document (`settings.palette`), mais IndexedDB est asynchrone,
 * donc on en garde un miroir en localStorage que le script inline d'index.html
 * lit avant le premier rendu. Une palette change `--bg` : sans ce miroir, l'app
 * s'afficherait une frame dans les couleurs d'une autre.
 *
 * Le type, la liste et le garde vivent dans `domain/types.ts`, avec le reste du
 * modèle : c'est `persistence/validate.ts` qui les consomme aussi, et il n'a
 * rien à faire d'un module qui touche au DOM.
 * ==========================================================================*/

import { DEFAULT_PALETTE, type PaletteSetting, type ThemeSetting, isPaletteSetting } from '@/domain/types'
import { storePreference } from './theme'

export const PALETTE_STORAGE_KEY = 'tout-compte-fait.palette'

export function readStoredPalette(): PaletteSetting {
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY)
    return isPaletteSetting(raw) ? raw : DEFAULT_PALETTE
  } catch {
    return DEFAULT_PALETTE
  }
}

export function storePalette(palette: PaletteSetting): void {
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, palette)
  } catch {
    // Mode privé, quota plein : la palette repartira sur sa valeur par défaut au
    // prochain démarrage, comme le thème. Rien de bloquant.
  }
}

/** Écrit la palette sur <html>. Le thème, lui, s'écrit à côté. */
export function applyPalette(palette: PaletteSetting): PaletteSetting {
  document.documentElement.dataset.palette = palette
  return palette
}

/**
 * Mire les deux réglages d'apparence, ensemble.
 *
 * Les cinq endroits qui remplacent le document en bloc doivent remirer, sinon le
 * prochain démarrage à froid peint l'ancienne apparence avant que React ne
 * corrige. Un seul appel plutôt que deux : cinq occasions d'oublier le second
 * en font une seule d'oublier les deux, et celle-là se voit.
 */
export function mirrorAppearance(settings: {
  theme: ThemeSetting
  palette: PaletteSetting
}): void {
  storePreference(settings.theme)
  storePalette(settings.palette)
}
