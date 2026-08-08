import type { PaletteSetting } from '@/domain/types'
import type { ResolvedTheme } from '@/theme/theme'

/**
 * Ce à quoi ressemble une palette, en petit.
 *
 * **Il n'y a pas une couleur dans ce fichier.** Le cadre porte `data-palette` et
 * `data-theme`, et tout ce qu'il contient lit les tokens par les utilitaires
 * habituels : c'est la couche de `styles/palettes.css` qui peint, exactement
 * comme elle peint l'app. Une vignette ne peut donc pas mentir sur ce qu'elle
 * montre, ni dériver quand une palette change.
 *
 * Les deux attributs sont sur le **même** élément, et ils doivent l'être : c'est
 * la condition que `palettes.css` pose en tête pour qu'un sous-arbre ne se fasse
 * pas rattraper par la palette ambiante.
 *
 * Ce qu'elle montre est choisi pour couvrir les rôles qui portent du sens, pas
 * pour faire joli : le fond et la surface, le chiffre, les deux sens de flux —
 * entrées et sorties —, quatre teintes de catégorie, et l'état actif. Une
 * vignette qui ne montrerait que trois pastilles laisserait passer une palette
 * dont les sorties se confondent avec les entrées.
 */
export function PalettePreview({
  palette,
  theme,
}: {
  palette: PaletteSetting
  theme: ResolvedTheme
}) {
  return (
    <span
      data-palette={palette}
      data-theme={theme}
      aria-hidden="true"
      className="block rounded-inner bg-bg p-2"
    >
      <span className="flex flex-col gap-1.5 rounded-[10px] bg-surface p-2 shadow-tile">
        <span className="flex items-center justify-between gap-2">
          {/* Le chiffre : c'est lui qui porte les écrans, donc lui qu'on vient
              vérifier sur un fond de surface. */}
          <span className="t-num-label tnum text-text">1 240</span>
          <span className="flex gap-1">
            {['--cat-1', '--cat-2', '--cat-3', '--cat-4'].map((token) => (
              <span
                key={token}
                className="size-2 rounded-chip"
                style={{ backgroundColor: `var(${token})` }}
              />
            ))}
          </span>
        </span>
        {/* Entrées et sorties, côte à côte : la seule lecture qui dise si une
            palette tient la règle du DS §2.3. */}
        <span className="flex gap-1">
          <span className="h-2 flex-1 rounded-chip bg-flow-in" />
          <span className="h-2 flex-1 rounded-chip bg-flow-out" />
        </span>
        <span className="flex items-center gap-1">
          {/* Une pilule active et une inactive, comme la rangée de filtres. */}
          <span className="h-3 flex-1 rounded-chip bg-accent" />
          <span className="h-3 flex-1 rounded-chip bg-surface-2" />
          <span className="h-3 w-3 rounded-chip bg-danger" />
        </span>
      </span>
    </span>
  )
}
