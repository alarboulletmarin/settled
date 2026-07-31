import { useNavigate } from 'react-router-dom'
import { MonthHeader } from '@/app/MonthHeader'
import { entryNewPath, entryPath } from '@/app/routes'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { fr } from '@/i18n/fr'
import { useMonthEntries } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { Plus } from '@/ui/Icons'
import { EntriesSection } from './EntriesSection'
import { OpenMonthNotice, RegenerateEntriesButton } from './OpenMonth'
import { PendingSection } from './PendingSection'

export function MonthPage() {
  const entries = useMonthEntries()
  const navigate = useNavigate()

  const create = (direction: 'in' | 'out'): void => {
    void navigate(entryNewPath({ direction }))
  }

  const isEmpty = entries.length === 0

  return (
    <>
      <h1 className="sr-only">{fr.month.title}</h1>
      <MonthHeader />

      <OpenMonthNotice />

      {/* Les deux sens sont deux boutons, jamais un seul. Passer par « Ajouter
          une dépense » pour saisir un salaire obligeait à découvrir, une fois
          le formulaire ouvert, une bascule dont rien n'annonçait l'existence. */}
      {!isEmpty && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              create('out')
            }}
          >
            <Plus size={18} />
            {fr.entry.newOut}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              create('in')
            }}
          >
            <Plus size={18} />
            {fr.entry.newIn}
          </Button>
          <RegenerateEntriesButton />
        </div>
      )}

      {isEmpty ? (
        <EmptyState message={fr.month.empty}>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => {
                create('out')
              }}
            >
              {fr.entry.addOut}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                create('in')
              }}
            >
              {fr.entry.addIn}
            </Button>
          </div>
          <RegenerateEntriesButton />
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          <Dashboard />
          <div className="flex max-w-3xl flex-col gap-4">
            <PendingSection />
            <EntriesSection
              onOpen={(entry) => {
                void navigate(entryPath(entry.id))
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
