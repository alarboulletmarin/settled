/* Adaptateur au-dessus de Phosphor. Les composants gardent les noms et la
 * signature d'avant : le reste de l'app ne sait pas d'où viennent les glyphes,
 * et changer de bibliothèque ne touchera que ce fichier.
 *
 * Import par chemin direct plutôt que depuis l'index : le barrel expose neuf
 * mille icônes, que Vite doit toutes analyser au démarrage en dev même si le
 * build final n'en garde que sept.
 *
 * Le DS interdit l'icône décorative : aucun de ces glyphes n'apparaît sans
 * rôle d'action. C'est cette règle qui limite le catalogue, pas la
 * bibliothèque — elle, elle est là pour le jour où il s'allonge. */

import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { Check as PhCheck } from '@phosphor-icons/react/dist/csr/Check'
import { Plus as PhPlus } from '@phosphor-icons/react/dist/csr/Plus'
import { WarningCircle } from '@phosphor-icons/react/dist/csr/WarningCircle'
import { X } from '@phosphor-icons/react/dist/csr/X'

type IconProps = { className?: string; size?: number }

/* `bold` est la graisse qui retombe sur le trait de 2px du DS ; `regular`
   maigrirait à côté du texte, et `fill` contredirait « trait fonctionnel ». */
const WEIGHT = 'bold' as const

function adapt(Glyph: PhosphorIcon) {
  return function Adapted({ className, size = 20 }: IconProps) {
    return (
      <Glyph
        size={size}
        weight={WEIGHT}
        className={className}
        aria-hidden="true"
        focusable={false}
      />
    )
  }
}

export const ChevronLeft = adapt(CaretLeft)
export const ChevronRight = adapt(CaretRight)
export const ChevronDown = adapt(CaretDown)
export const Plus = adapt(PhPlus)
export const Close = adapt(X)
export const Check = adapt(PhCheck)
export const Warning = adapt(WarningCircle)
