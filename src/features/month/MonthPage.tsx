import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MonthHeader } from '@/app/MonthHeader'
import { entryNewPath, entryPath } from '@/app/routes'
import type { GroupBy } from '@/domain/grouping'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { fr } from '@/i18n/fr'
import { useScopedMonthEntries } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { Plus } from '@/ui/Icons'
import { EntriesSection, type FlowFocus } from './EntriesSection'
import { PendingSection } from './PendingSection'

export function MonthPage() {
  /* Le mois d'un membre n'est pas vide parce qu'il n'a rien saisi à son nom :
     sa part des charges communes en fait partie. */
  const entries = useScopedMonthEntries()
  const navigate = useNavigate()

  /* L'axe de la liste se pilote de deux endroits — ses propres onglets, et les
     deux tuiles de flux. Il vit donc ici, entre les deux. */
  const [by, setBy] = useState<GroupBy>('day')
  const [focus, setFocus] = useState<FlowFocus | null>(null)

  const groupBy = (next: GroupBy): void => {
    setBy(next)
    // Changer d'axe à la main annule la demande : sans quoi revenir sur les
    // charges et revenus ferait défiler la page vers un groupe qu'on n'a pas
    // redemandé.
    setFocus(null)
  }

  const showFlow = (direction: 'in' | 'out'): void => {
    setBy('direction')
    setFocus((previous) => ({ direction, seq: (previous?.seq ?? 0) + 1 }))
  }

  const create = (direction: 'in' | 'out'): void => {
    void navigate(entryNewPath({ direction }))
  }

  const isEmpty = entries.length === 0

  return (
    <>
      <h1 className="sr-only">{fr.month.title}</h1>
      <MonthHeader prorataNote />

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
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          <Dashboard onShowFlow={showFlow} />
          <div className="flex max-w-3xl flex-col gap-4">
            <PendingSection />
            {/* Remontée à chaque changement d'axe : les groupes repartent du
                défaut du nouvel axe, sans état à réinitialiser à la main. */}
            <EntriesSection
              key={by}
              by={by}
              onGroupBy={groupBy}
              focus={focus}
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
