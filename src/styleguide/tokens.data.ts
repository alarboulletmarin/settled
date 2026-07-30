/* Inventaire des tokens, pour la page /styleguide.
 *
 * C'est le seul module qui nomme les variables de la palette de base : son rôle
 * est précisément de les afficher. Aucun composant d'app ne l'importe. */

export type TokenEntry = { name: string; value: string }
export type TokenGroup = { title: string; note?: string; entries: TokenEntry[] }

export const BASE_PALETTE: TokenGroup[] = [
  {
    title: 'Sapin',
    entries: [
      { name: '--pine-900', value: '#0E1F1A' },
      { name: '--pine-700', value: '#1B3B31' },
      { name: '--pine-500', value: '#2F5D4C' },
      { name: '--pine-100', value: '#DCE9E2' },
      { name: '--pine-50', value: '#F0F5F2' },
    ],
  },
  {
    title: 'Accents',
    entries: [
      { name: '--lime-500', value: '#D8F84E' },
      { name: '--lime-600', value: '#C2E432' },
      { name: '--violet-500', value: '#8478F2' },
      { name: '--violet-600', value: '#6E60E8' },
    ],
  },
  {
    title: 'Neutres',
    entries: [
      { name: '--ink-950', value: '#0B0E0D' },
      { name: '--ink-800', value: '#161A19' },
      { name: '--ink-400', value: '#7C8783' },
      { name: '--paper', value: '#FAFAF7' },
    ],
  },
  {
    title: 'Alerte',
    entries: [{ name: '--alert-500', value: '#E5484D' }],
  },
]

export const SEMANTIC_TOKENS: TokenEntry[] = [
  { name: '--bg', value: 'fond de page' },
  { name: '--surface', value: 'fond de tuile' },
  { name: '--surface-2', value: 'fond secondaire, piste d’anneau' },
  { name: '--border', value: 'bordure' },
  { name: '--text', value: 'texte' },
  { name: '--text-muted', value: 'texte secondaire' },
  { name: '--text-muted-on-surface', value: 'texte secondaire dans une surface' },
  { name: '--accent', value: 'lime — remplissage' },
  { name: '--accent-fg', value: 'texte sur lime' },
  { name: '--accent-2', value: 'violet — remplissage' },
  { name: '--accent-2-fg', value: 'texte sur violet' },
  { name: '--danger', value: 'dépassements et erreurs — remplissage' },
  { name: '--danger-text', value: 'texte d’erreur' },
]

export const CATEGORY_PALETTE: TokenEntry[] = [
  { name: '--cat-1', value: '#D8F84E' },
  { name: '--cat-2', value: '#8478F2' },
  { name: '--cat-3', value: '#4FC3A1' },
  { name: '--cat-4', value: '#F5B575' },
  { name: '--cat-5', value: '#F09BB5' },
  { name: '--cat-6', value: '#7FB8E8' },
  { name: '--cat-rest', value: 'au-delà de six : « Autres »' },
]

export const TYPE_SCALE = [
  { role: 'Chiffre héros', className: 't-hero', detail: 'sans · 56/72px · 700 · stretch 112%' },
  {
    role: 'Chiffre héros ajusté',
    className: 't-hero-fit',
    detail: 'mêmes bornes, ramené à la largeur de la tuile',
  },
  { role: 'Chiffre de tuile', className: 't-tile-num', detail: 'sans · 32px · 650' },
  { role: 'Titre de section', className: 't-section', detail: 'sans · 20px · 600' },
  { role: 'Corps', className: 't-body', detail: 'sans · 15px · 400' },
  { role: 'Libellé secondaire', className: 't-label', detail: 'sans · 13px · 400 · muted' },
  { role: 'Eyebrow', className: 't-eyebrow', detail: 'mono · 11px · 500 · majuscules' },
  { role: 'Axe de graphique', className: 't-axis', detail: 'mono · 11px · 400 · muted' },
] as const

export const RADII: TokenEntry[] = [
  { name: '--r-tile', value: '24px' },
  { name: '--r-inner', value: '14px' },
  { name: '--r-input', value: '12px' },
  { name: '--r-chip', value: '999px' },
]

export const SPACING_SCALE = [4, 8, 12, 16, 20, 24, 32, 40, 56, 72] as const

export const MOTION: TokenEntry[] = [
  { name: '--dur', value: '160ms — défaut' },
  { name: '--dur-view', value: '240ms — entrée de vue' },
  { name: '--ease', value: 'cubic-bezier(0.2, 0, 0, 1)' },
]
