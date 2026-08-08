import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  SAVINGS_PATH,
  entryPath,
  supportEditPath,
  valuationEditPath,
  valuationNewPath,
} from '@/app/routes'
import { ZERO } from '@/domain/money'
import type { SavingSupport } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { formatDate, tpl } from '@/i18n/format'
import {
  archiveSavingSupport,
  removeSavingSupport,
  unarchiveSavingSupport,
  undoable,
} from '@/store/actions'
import {
  isSupportEmpty,
  useCategoryMap,
  useMemberMap,
  useSavingSupport,
  useSupportEntries,
  useSupportMonthFlows,
  useSupportUsage,
  useSupportValuations,
  useSupportValue,
} from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { ConfirmDialog } from '@/ui/ConfirmDialog'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import { ListRow } from '@/ui/ListRow'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { ValuationChart } from './ValuationChart'

/** Au-delà, la liste devient l'écran plutôt qu'une lecture de la fiche. */
const SHOWN_MOVEMENTS = 12

/**
 * La fiche d'un support — ce qu'il vaut, ce qu'il a reçu, et son histoire.
 *
 * Trois lectures dans cet ordre, parce que c'est celui des questions : combien
 * ça vaut, ce que le mois y a mis, et comment on en est arrivé là. La valeur
 * **renseignée** est toujours nommée comme telle, avec sa date : c'est un fait
 * daté, pas un solde de compte que l'app connaîtrait.
 */
export function SupportPage() {
  const { id } = useParams()
  const support = useSavingSupport(id)
  if (support === null) return <Navigate to={SAVINGS_PATH} replace />
  return <SupportView key={support.id} support={support} />
}

function SupportView({ support }: { support: SavingSupport }) {
  const navigate = useNavigate()
  const members = useMemberMap()
  const categories = useCategoryMap()
  const value = useSupportValue(support.id)
  const valuations = useSupportValuations(support.id)
  const flows = useSupportMonthFlows(support.id)
  const entries = useSupportEntries(support.id)
  const usage = useSupportUsage(support.id)
  const [archiving, setArchiving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const member = members.get(support.memberId)
  const category = categories.get(support.categoryId)
  const color = category?.color ?? 'var(--cat-rest)'
  const back = (): void => {
    void navigate(SAVINGS_PATH)
  }

  /* Le geste de suppression n'existe que sur ce qui n'a pas d'histoire. Ailleurs
     c'est l'archivage, et l'écran dit pourquoi plutôt que de laisser chercher un
     bouton qui n'est pas là. */
  const deletable = isSupportEmpty(usage)
  const running = usage.runningRecurrences

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageTitle title={support.label} onBack={back}>
        <Dot color={color} size={10} className="shrink-0" />
      </PageTitle>

      {/* Ce que ça vaut. Renseignée, elle porte sa date ; estimée, elle porte
          sa réserve — jamais « valeur actuelle » tout court, qui promettrait
          une précision que ce calcul n'a pas. */}
      <Tile variant="accent" className="gap-2">
        <Eyebrow>{value?.known === null ? fr.savings.valueUnknown : fr.savings.valueKnown}</Eyebrow>
        {value?.known === null || value === null ? (
          <p className="t-body">{fr.savings.historyEmpty}</p>
        ) : (
          <>
            <Amount value={value.known} size="tile" />
            <span className="t-label">
              {tpl(fr.savings.valueOn, formatDate(value.knownOn ?? ''))}
            </span>
            {value.movedSince !== ZERO && value.estimated !== null && (
              <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="t-label min-w-0 flex-1 truncate">{fr.savings.estimated}</span>
                  <Amount value={value.estimated} size="body" className="shrink-0" />
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="t-label min-w-0 flex-1 truncate">{fr.savings.movedSince}</span>
                  <Amount value={value.movedSince} size="body" signed className="shrink-0" />
                </div>
                <p className="t-label mt-1">{fr.savings.estimatedWarning}</p>
              </div>
            )}
          </>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="t-label inline-flex items-center gap-2">
            <Dot color={member?.color ?? 'var(--cat-rest)'} />
            {member?.name ?? ''}
          </span>
          {category !== undefined && <span className="t-label">{category.label}</span>}
          {support.archived && <span className="t-label">{fr.savings.archived}</span>}
        </div>
      </Tile>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            void navigate(valuationNewPath(support.id))
          }}
        >
          {fr.savings.valueUpdate}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigate(supportEditPath(support.id))
          }}
        >
          {fr.savings.supportEdit}
        </Button>
      </div>

      {support.note !== undefined && <p className="t-label">{support.note}</p>}

      {/* Le flux du mois, à côté du stock et jamais mêlé à lui : ce sont les
          mêmes `Entry` que celles du tableau de bord, au centime. */}
      <Tile className="gap-3">
        <Eyebrow>{fr.savings.monthFlows}</Eyebrow>
        {/* Sans signe sur les deux termes : leur libellé dit déjà le sens, et
            « Reprises +0,00 € » se lirait comme une entrée d'argent un mois où
            il ne s'est rien passé. Le net, lui, le porte — c'est le seul des
            trois qui peut être négatif. */}
        <ul className="flex flex-col gap-1.5">
          <li className="flex items-baseline gap-3">
            <span className="t-label min-w-0 flex-1 truncate">{fr.savings.contributions}</span>
            <Amount value={flows.contributions} size="body" className="shrink-0" />
          </li>
          <li className="flex items-baseline gap-3">
            <span className="t-label min-w-0 flex-1 truncate">{fr.savings.withdrawals}</span>
            <Amount value={flows.withdrawals} size="body" className="shrink-0" />
          </li>
          <li className="flex items-baseline gap-3 border-t border-border pt-2">
            <span className="t-label min-w-0 flex-1 truncate">{fr.savings.net}</span>
            <Amount value={flows.net} size="body" signed className="shrink-0" />
          </li>
        </ul>
      </Tile>

      {/* L'histoire du stock. La courbe ne relie que des points relevés : entre
          deux, le trait est un dessin, pas une donnée. */}
      <Tile className="gap-3">
        <Eyebrow>{fr.savings.history}</Eyebrow>
        {valuations.length === 0 ? (
          <p className="t-label">{fr.savings.historyEmpty}</p>
        ) : (
          <>
            {valuations.length === 1 ? (
              <p className="t-label">{fr.savings.historyOne}</p>
            ) : (
              <ValuationChart valuations={valuations} color={color} />
            )}
            <ul className="flex flex-col">
              {valuations.map((valuation) => (
                <li key={valuation.id}>
                  <ListRow
                    color={color}
                    label={formatDate(valuation.date)}
                    trailing={<Amount value={valuation.amount} />}
                    onClick={() => {
                      void navigate(valuationEditPath(support.id, valuation.id))
                    }}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </Tile>

      {/* Les mouvements — les `Entry` liées, telles qu'elles vivent dans le
          mois. On les ouvre d'ici : c'est le même écran de saisie qu'ailleurs. */}
      <Tile className="gap-3">
        <Eyebrow>{fr.savings.movements}</Eyebrow>
        {entries.length === 0 ? (
          <p className="t-label">{fr.savings.movementsEmpty}</p>
        ) : (
          <>
            <ul className="flex flex-col">
              {entries.slice(0, SHOWN_MOVEMENTS).map((entry) => (
                <li key={entry.id}>
                  <ListRow
                    color={color}
                    label={entry.label}
                    meta={formatDate(entry.date)}
                    planned={entry.status === 'planned'}
                    trailing={<Amount value={entry.amount} direction={entry.direction} />}
                    onClick={() => {
                      void navigate(entryPath(entry.id))
                    }}
                  />
                </li>
              ))}
            </ul>
            {entries.length > SHOWN_MOVEMENTS && (
              <p className="t-label">
                {tpl(fr.savings.movementsMore, entries.length - SHOWN_MOVEMENTS)}
              </p>
            )}
          </>
        )}
      </Tile>

      {/* À part, en bas, jamais dans la rangée des gestes courants : archiver
          retire le support des formulaires, supprimer l'efface. Le second n'est
          proposé que là où il ne perd rien. */}
      <Tile className="gap-3">
        <p className="t-label">{fr.savings.archivedHint}</p>
        {/* Pourquoi le bouton « Supprimer » n'est pas là : la règle se lit, elle
            ne se devine pas à l'absence d'un bouton. */}
        {!support.archived && !deletable && (
          <p className="t-label">{fr.savings.removeBlocked}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {support.archived ? (
            <Button
              variant="ghost"
              className="w-fit"
              onClick={() => {
                undoable(fr.savings.supportUnarchived, () => {
                  unarchiveSavingSupport(support.id)
                })
              }}
            >
              {fr.savings.unarchive}
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-fit"
              onClick={() => {
                setArchiving(true)
              }}
            >
              {fr.savings.archive}
            </Button>
          )}
          {deletable && (
            <Button
              variant="ghost"
              className="w-fit"
              onClick={() => {
                setRemoving(true)
              }}
            >
              {fr.savings.remove}
            </Button>
          )}
        </div>
      </Tile>

      {/* Un support archivé qui continue de recevoir 300 € par mois serait un
          compte invisible qui grossit tout seul : la question le dit, et le
          bouton fait les deux gestes d'un coup. */}
      <ConfirmDialog
        open={archiving}
        title={fr.savings.archive}
        steps={[
          {
            question:
              running === 0
                ? fr.savings.archiveConfirm
                : `${running === 1 ? fr.savings.archiveRunningOne : tpl(fr.savings.archiveRunning, running)} ${fr.savings.archiveConfirm}`,
            action:
              running === 0
                ? fr.savings.archive
                : running === 1
                  ? fr.savings.archiveAndStop
                  : fr.savings.archiveAndStopMany,
          },
        ]}
        onCancel={() => {
          setArchiving(false)
        }}
        onConfirm={() => {
          setArchiving(false)
          undoable(fr.savings.supportArchived, () => {
            archiveSavingSupport(support.id, { stopRecurrences: running > 0 })
          })
          back()
        }}
      />

      <ConfirmDialog
        open={removing}
        title={fr.savings.remove}
        steps={[{ question: fr.savings.removeConfirm, action: fr.common.delete }]}
        onCancel={() => {
          setRemoving(false)
        }}
        onConfirm={() => {
          setRemoving(false)
          undoable(fr.savings.supportRemoved, () => {
            removeSavingSupport(support.id)
          })
          back()
        }}
      />
    </div>
  )
}
