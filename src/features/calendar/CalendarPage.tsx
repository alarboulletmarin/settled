import { MonthHeader } from '@/app/MonthHeader'
import { fr } from '@/i18n/fr'
import { PageTitle } from '@/ui/PageTitle'

export function CalendarPage() {
  return (
    <>
      <MonthHeader />
      <PageTitle title={fr.nav.calendar} />
    </>
  )
}
