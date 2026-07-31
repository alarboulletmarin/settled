import { fr } from '@/i18n/fr'
import * as Icons from '@/ui/Icons'
import type { IconComponent } from '@/ui/Icons'
import { Section, SubTitle } from './Section'
import { DualTheme } from './ThemePane'

/* Le catalogue entier, rangé par emploi. Ces deux listes sont ce que le DS §9
   autorise : ajouter un glyphe ailleurs, c'est décorer. */

const ACTION: [string, IconComponent][] = [
  ['ChevronLeft', Icons.ChevronLeft],
  ['ChevronRight', Icons.ChevronRight],
  ['ChevronDown', Icons.ChevronDown],
  ['Plus', Icons.Plus],
  ['Close', Icons.Close],
  ['Check', Icons.Check],
  ['Warning', Icons.Warning],
]

const MARKER: [string, IconComponent][] = [
  ['NavMonth', Icons.NavMonth],
  ['NavCalendar', Icons.NavCalendar],
  ['NavSubscriptions', Icons.NavSubscriptions],
  ['NavHistory', Icons.NavHistory],
  ['NavSettings', Icons.NavSettings],
  ['BalanceIcon', Icons.BalanceIcon],
  ['ForecastIcon', Icons.ForecastIcon],
  ['RemainingIcon', Icons.RemainingIcon],
  ['BreakdownIcon', Icons.BreakdownIcon],
  ['SavingsIcon', Icons.SavingsIcon],
  ['UpcomingIcon', Icons.UpcomingIcon],
  ['SubscriptionsIcon', Icons.SubscriptionsIcon],
  ['ToConfirmIcon', Icons.ToConfirmIcon],
  ['EntriesIcon', Icons.EntriesIcon],
  ['HouseholdIcon', Icons.HouseholdIcon],
  ['CategoriesIcon', Icons.CategoriesIcon],
  ['ThemeIcon', Icons.ThemeIcon],
  ['DataIcon', Icons.DataIcon],
  ['TrailingIcon', Icons.TrailingIcon],
  ['CompareIcon', Icons.CompareIcon],
  ['YearsIcon', Icons.YearsIcon],
]

function Grid({ items }: { items: [string, IconComponent][] }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
      {items.map(([name, Icon]) => (
        <li
          key={name}
          className="flex flex-col items-center gap-2 rounded-inner bg-surface-2 p-3 text-center"
        >
          <Icon size={22} />
          <span className="t-axis w-full truncate">{name}</span>
        </li>
      ))}
    </ul>
  )
}

export function IconSection() {
  return (
    <Section title={fr.styleguide.sections.icons} note={fr.styleguide.iconsNote}>
      <DualTheme stacked>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <SubTitle>{fr.styleguide.iconAction}</SubTitle>
            <Grid items={ACTION} />
          </div>
          <div className="flex flex-col gap-2">
            <SubTitle>{fr.styleguide.iconMarker}</SubTitle>
            <Grid items={MARKER} />
          </div>
        </div>
      </DualTheme>
    </Section>
  )
}
