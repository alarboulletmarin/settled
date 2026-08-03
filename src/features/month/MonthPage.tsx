import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MonthHeader } from '@/app/MonthHeader'
import { entryNewPath, entryPath } from '@/app/routes'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { fr } from '@/i18n/fr'
import { useScopedMonthEntries } from '@/store/selectors'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { Plus } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { EntriesSection, type FlowFilter } from './EntriesSection'
import { PendingSection } from './PendingSection'

export function MonthPage() {
  /* Le mois d'un membre n'est pas vide parce qu'il n'a rien saisi à son nom :
     sa part des charges communes en fait partie. */
  const entries = useScopedMonthEntries()
  const navigate = useNavigate()

  /* Le sens montré se pilote de deux endroits — les pilules de la liste, et les
     deux tuiles de flux. Il vit donc ici, entre les deux. L'axe, lui, ne se
     pilote que de la liste et y reste : une tuile filtre ce qu'on voit, elle ne
     range pas la liste autrement que l'utilisateur l'a rangée. */
  const [flow, setFlow] = useState<FlowFilter>(null)
  const [focus, setFocus] = useState(0)

  const showFlow = (direction: 'in' | 'out'): void => {
    setFlow(direction)
    setFocus((previous) => previous + 1)
  }

  const create = (direction: 'in' | 'out'): void => {
    void navigate(entryNewPath({ direction }))
  }

  /* Une troisième porte, parce que l'épargne se saisissait par « Dépense » :
     le geste est le même — de l'argent qui sort — mais ce n'est pas ce qu'on
     croit faire en mettant de côté. */
  const createSaving = (): void => {
    void navigate(entryNewPath({ direction: 'out', saving: true }))
  }

  const isEmpty = entries.length === 0

  return (
    <>
      {/* Le bandeau dit déjà quel mois on lit : le titre existe pour les
          lecteurs d'écran et pour l'annonce du changement d'écran, il ne
          s'affiche pas. */}
      <PageTitle title={fr.month.title} hidden />
      <MonthHeader prorataNote />

      {/* Les deux sens sont deux boutons, jamais un seul. Passer par « Ajouter
          une dépense » pour saisir un salaire obligeait à découvrir, une fois
          le formulaire ouvert, une bascule dont rien n'annonçait l'existence.

          À partir de 1024px seulement : sous cette largeur, c'est le bouton
          flottant de la coquille qui porte ces trois portes, et il les porte
          partout — y compris une fois la page défilée, et sur un mois vide, où
          cette rangée-ci n'existe pas. Les garder toutes les deux ferait deux
          fois les mêmes trois boutons sur le même écran, ce qui ne fait pas
          deux occasions. */}
      {!isEmpty && (
        <div className="mb-4 hidden flex-wrap items-center gap-2 lg:flex">
          <Button
            title={fr.a11y.newEntryKey}
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
          <Button variant="secondary" onClick={createSaving}>
            <Plus size={18} />
            {fr.entry.newSaving}
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
            <EntriesSection
              flow={flow}
              onFlow={setFlow}
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
