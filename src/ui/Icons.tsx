/* Adaptateur au-dessus de Phosphor. Les composants gardent des noms à nous et
 * une signature à nous : le reste de l'app ne sait pas d'où viennent les
 * glyphes, et changer de bibliothèque ne toucherait que ce fichier.
 *
 * Import par chemin direct plutôt que depuis l'index : le barrel expose neuf
 * mille icônes, que Vite doit toutes analyser au démarrage en dev même si le
 * build final n'en garde qu'une vingtaine.
 *
 * Deux familles, et pas une de plus (DS §9) :
 *   — ACTION, sur un contrôle qui fait quelque chose ;
 *   — REPÈRE, sur un onglet, une tuile ou une section, pour qu'on la retrouve
 *     à l'œil sans relire son libellé.
 * Rien en dehors : une icône qui n'aide ni à agir ni à se repérer décore, et
 * le DS ne veut pas de décor. */

import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise'
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown'
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight'
import { ChartBar } from '@phosphor-icons/react/dist/csr/ChartBar'
import { ChartLine } from '@phosphor-icons/react/dist/csr/ChartLine'
import { ChartLineUp } from '@phosphor-icons/react/dist/csr/ChartLineUp'
import { ChartPieSlice } from '@phosphor-icons/react/dist/csr/ChartPieSlice'
import { Check as PhCheck } from '@phosphor-icons/react/dist/csr/Check'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { Clock } from '@phosphor-icons/react/dist/csr/Clock'
import { Bank } from '@phosphor-icons/react/dist/csr/Bank'
import { Coins } from '@phosphor-icons/react/dist/csr/Coins'
import { Database } from '@phosphor-icons/react/dist/csr/Database'
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix'
import { HandCoins } from '@phosphor-icons/react/dist/csr/HandCoins'
import { House } from '@phosphor-icons/react/dist/csr/House'
import { Info } from '@phosphor-icons/react/dist/csr/Info'
import { ListBullets } from '@phosphor-icons/react/dist/csr/ListBullets'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { PiggyBank } from '@phosphor-icons/react/dist/csr/PiggyBank'
import { Plus as PhPlus } from '@phosphor-icons/react/dist/csr/Plus'
import { Receipt } from '@phosphor-icons/react/dist/csr/Receipt'
import { SquaresFour } from '@phosphor-icons/react/dist/csr/SquaresFour'
import { Tag } from '@phosphor-icons/react/dist/csr/Tag'
import { UsersThree } from '@phosphor-icons/react/dist/csr/UsersThree'
import { Wallet } from '@phosphor-icons/react/dist/csr/Wallet'
import { WarningCircle } from '@phosphor-icons/react/dist/csr/WarningCircle'
import { X } from '@phosphor-icons/react/dist/csr/X'

export type IconProps = { className?: string; size?: number }
/** Ce que consomment `Eyebrow` et la navigation pour recevoir un repère. */
export type IconComponent = (props: IconProps) => React.JSX.Element

/* `bold` est la graisse qui retombe sur le trait de 2px du DS ; `regular`
   maigrirait à côté du texte, et `fill` contredirait « trait fonctionnel ». */
const WEIGHT = 'bold' as const

function adapt(Glyph: PhosphorIcon): IconComponent {
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

/* --- Action ---------------------------------------------------------------*/

export const ChevronLeft = adapt(CaretLeft)
export const ChevronRight = adapt(CaretRight)
export const ChevronDown = adapt(CaretDown)
export const Plus = adapt(PhPlus)
export const Close = adapt(X)
export const Check = adapt(PhCheck)
export const Warning = adapt(WarningCircle)
/* Le repère d'une tuile qui s'explique sur place, par opposition au chevron de
   celle qui mène ailleurs : deux gestes, deux glyphes. */
export const InfoIcon = adapt(Info)
/* Le seul lien qui quitte l'app est celui du dépôt, et rien ne le distinguait
   d'une navigation interne — dans une app installée, où il n'y a pas de bouton
   retour, partir sans le savoir se paie cher. Une flèche sortante, et non la
   marque du service : un logo ne dit pas qu'on s'en va, il décore, et le DS §1
   n'en veut pas. Poser les deux ferait deux marqueurs côte à côte, donc aucun
   (DS §9.1). */
export const ExternalIcon = adapt(ArrowUpRight)

/* --- Repère — navigation --------------------------------------------------*/

export const NavMonth = adapt(SquaresFour)
export const NavCalendar = adapt(CalendarBlank)
export const NavRecurrences = adapt(ArrowsClockwise)
export const NavHistory = adapt(ChartLine)
export const NavSettings = adapt(GearSix)

/* --- Repère — tuiles et sections ------------------------------------------*/

export const BalanceIcon = adapt(Wallet)
export const IncomeIcon = adapt(Coins)
/* La quittance, et non une flèche : c'est ce qu'on doit, pas une variation. */
export const ChargesIcon = adapt(Receipt)
export const ForecastIcon = adapt(ChartLineUp)
export const RemainingIcon = adapt(HandCoins)
/* La tirelire porte l'épargne, la main tendue le reste à vivre : deux chiffres
   voisins sur la grille, et deux mains de pièces s'y confondraient. */
export const SavingsIcon = adapt(PiggyBank)
export const BreakdownIcon = adapt(ChartPieSlice)
export const UpcomingIcon = adapt(Clock)
export const RecurrencesIcon = adapt(ArrowsClockwise)
export const CreditsIcon = adapt(Bank)
export const SplitIcon = adapt(UsersThree)
export const ToConfirmIcon = adapt(CheckCircle)
export const EntriesIcon = adapt(ListBullets)
export const HouseholdIcon = adapt(House)
export const CategoriesIcon = adapt(Tag)
export const ThemeIcon = adapt(Palette)
export const DataIcon = adapt(Database)
export const TrailingIcon = adapt(ChartLine)
export const CompareIcon = adapt(ChartBar)
export const YearsIcon = adapt(ChartLineUp)
