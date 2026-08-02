import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RECURRENCES_PATH, RECURRENCE_NEW_PATH } from '@/app/routes'
import type { YearMonth } from '@/domain/date'
import { sum } from '@/domain/money'
import { totalToPay } from '@/domain/split'
import type { MemberShare } from '@/domain/split'
import type { Entry, Member } from '@/domain/types'
import { fr } from '@/i18n/fr'
import {
  formatDayMonthShort,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  formatYearMonth,
  tpl,
} from '@/i18n/format'
import {
  useCategoryMap,
  useMemberIncomes,
  useMemberMap,
  useMembers,
  useMonthSplit,
  useUnassignedIncomes,
} from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Disclosure } from '@/ui/Disclosure'
import { Dot } from '@/ui/Dot'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { SplitIcon } from '@/ui/Icons'
import { ListRow } from '@/ui/ListRow'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/** « Alix », « Alix et Camille », « Alix, Camille et Sacha ». */
function enumerate(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} et ${names.at(-1) ?? ''}`
}

/**
 * « de Camille », mais « d'Alice ». L'élision dépend du prénom : le gabarit de
 * `fr.ts` ne peut pas la décider, elle est donc portée ici. Le h est traité
 * comme muet — « d'Hugo » se dit, « de Hugo » ne se dit pas.
 */
function de(name: string): string {
  return /^[aeiouyàâäéèêëîïôöùûüh]/i.test(name) ? `d’${name}` : `de ${name}`
}

/** Ce qui manque pour répartir : la phrase, le geste, et où il mène. */
type Missing = { message: string; hint: string; actionLabel: string; path: string }

/**
 * Ce qui manque pour répartir, nommé — et le geste qui va avec.
 *
 * Sans personne à nommer, le prorata bloque quand même : chacun porte une
 * ressource, mais toutes à zéro. La phrase le disait alors sans sujet —
 * « Ajoute le revenu de  pour répartir les charges ».
 *
 * Deux impasses, et elles n'appellent pas le même geste. Le revenu qui manque
 * n'existe pas encore, ou bien il existe et n'est pas chiffré — un salaire à
 * montant variable dont aucune échéance ne dit encore le montant. Envoyer alors
 * « ajouter un revenu » fait créer un doublon là où il ne manque qu'un chiffre.
 */
function missingIncomes(unknown: readonly Member[], unpriced: number): Missing {
  const names = unknown.map((member) => member.name)
  const who = de(enumerate(names))

  // Tous les revenus manquants sont des variables non chiffrés : les
  // récurrences sont là, il n'y a qu'un montant à poser.
  if (unpriced > 0 && unpriced === names.length) {
    return {
      message: tpl(names.length === 1 ? fr.split.unpricedOne : fr.split.unpricedMany, who),
      hint: fr.split.unpricedHint,
      actionLabel: fr.split.goToSubscriptions,
      path: RECURRENCES_PATH,
    }
  }

  return {
    message:
      names.length === 0
        ? fr.split.missingNone
        : tpl(names.length === 1 ? fr.split.missingOne : fr.split.missingMany, who),
    hint: fr.split.missingHint,
    actionLabel: fr.split.goToIncome,
    path: RECURRENCE_NEW_PATH,
  }
}

function ShareRow({ share, previousYm }: { share: MemberShare; previousYm: YearMonth }) {
  const members = useMemberMap()
  const currency = useCurrency()
  const member = members.get(share.memberId)

  return (
    <Tile className="gap-3">
      <div className="flex items-center gap-3">
        <Dot color={member?.color ?? 'var(--cat-rest)'} />
        <span className="t-body min-w-0 flex-1 truncate font-medium">{member?.name ?? ''}</span>
        <span className="t-axis tnum shrink-0">{formatPercent(share.shareBp / 10_000, 1)}</span>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-3">
        <span className="t-label">{fr.split.due}</span>
        <Amount value={share.toPay} size="tile" direction="out" />
        {/* Sans report, la tuile est celle de toujours : une ligne à zéro ne
            dirait rien qu'on ne sache déjà, et elle laisserait croire à une
            régularisation là où les comptes tombaient justes. */}
        {share.adjustment !== 0 && (
          <ul className="flex w-full flex-col">
            <li className="flex items-baseline justify-between gap-3">
              <span className="t-axis">{fr.split.settlementShare}</span>
              <span className="t-axis tnum">{formatMoney(share.due, currency, false)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="t-axis min-w-0 truncate">
                {tpl(fr.split.settlement, formatYearMonth(previousYm))}
              </span>
              <span className="t-axis tnum shrink-0">
                {formatSignedMoney(share.adjustment, currency)}
              </span>
            </li>
          </ul>
        )}
        <span className="t-axis w-full">
          {`${fr.split.income} ${formatMoney(share.income, currency, false)}`}
        </span>
      </div>
    </Tile>
  )
}

/**
 * Le détail de la répartition du mois — l'écran qu'ouvre la tuile.
 *
 * Il montre le calcul plutôt que son seul résultat : c'est ce qui rend un
 * partage acceptable entre deux personnes. Le total des parts est affiché à
 * côté du total des charges, et les deux sont égaux au centime — c'est ce que
 * garantit la répartition aux plus forts restes, et le montrer vaut mieux que
 * de l'affirmer.
 */
export function SplitPage() {
  const { total, entries, shares, unknown, previousYm, advanced } = useMonthSplit()
  const incomes = useMemberIncomes()
  const unassigned = useUnassignedIncomes()
  const members = useMembers()
  const memberMap = useMemberMap()
  const categories = useCategoryMap()
  const currency = useCurrency()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(false)
  const [settled, setSettled] = useState(false)
  const settlement = shares?.some((share) => share.adjustment !== 0) ?? false

  /** La date, et le nom de qui a avancé la dépense quand il y en a un. */
  const metaOf = (entry: Entry): string => {
    const day = formatDayMonthShort(entry.date)
    const name = entry.memberId === undefined ? undefined : memberMap.get(entry.memberId)?.name
    return name === undefined ? day : `${day} · ${tpl(fr.split.advancedBy, name)}`
  }

  const goToSettings = (): void => {
    void navigate('/reglages')
  }

  if (members.length < 2) {
    return (
      <>
        <PageTitle title={fr.split.title} />
        <EmptyState
          message={fr.split.soloTitle}
          actionLabel={fr.split.goToSettings}
          onAction={goToSettings}
        >
          <p className="t-label max-w-xs">{fr.split.soloHint}</p>
        </EmptyState>
      </>
    )
  }

  if (shares === null) {
    const missing = missingIncomes(
      unknown,
      incomes.filter((income) => income.gap === 'unpriced').length,
    )
    return (
      <>
        <PageTitle title={fr.split.title} />
        <EmptyState
          message={missing.message}
          actionLabel={missing.actionLabel}
          onAction={() => {
            void navigate(missing.path)
          }}
        >
          <p className="t-label max-w-sm">{missing.hint}</p>
          {unassigned.length > 0 && (
            <p className="t-label max-w-sm">
              {tpl(
                unassigned.length > 1
                  ? fr.settings.incomeUnassignedMany
                  : fr.settings.incomeUnassignedOne,
                unassigned.map((r) => r.label).join(', '),
              )}
            </p>
          )}
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <PageTitle title={fr.split.title} />

      <div className="flex max-w-3xl flex-col gap-4">
        <p className="t-label">{fr.split.subtitle}</p>

        <Tile variant="accent">
          <Eyebrow icon={SplitIcon}>{fr.split.total}</Eyebrow>
          <Amount value={total} size="tile" className="mt-3" />
          <span className="t-label mt-1">{fr.split.totalHint}</span>
        </Tile>

        {total <= 0 ? (
          <p className="t-label">{fr.split.nothing}</p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {shares.map((share) => (
                <ShareRow key={share.memberId} share={share} previousYm={previousYm} />
              ))}
            </div>

            {/* Le report s'ouvre comme le pot lui-même : une régularisation
                qu'on ne peut pas vérifier ne se vérifie pas, et c'est celle
                qu'on discute le plus. */}
            {settlement && advanced.length > 0 && (
              <Tile className="p-2! md:p-2!">
                <Disclosure
                  open={settled}
                  onOpenChange={setSettled}
                  title={
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="t-body truncate">
                        {tpl(fr.split.settlementDetail, formatYearMonth(previousYm))}
                      </span>
                      <span className="t-axis shrink-0">
                        {tpl(
                          advanced.length > 1 ? fr.split.detailCount : fr.split.detailCountOne,
                          advanced.length,
                        )}
                      </span>
                    </span>
                  }
                  trailing={
                    <Amount
                      value={sum(advanced.map((e) => e.amount))}
                      size="body"
                      direction="out"
                    />
                  }
                >
                  <ul className="flex flex-col">
                    {advanced.map((entry) => (
                      <li key={entry.id}>
                        <ListRow
                          color={categories.get(entry.categoryId)?.color ?? 'var(--cat-rest)'}
                          label={entry.label}
                          meta={metaOf(entry)}
                          trailing={<Amount value={entry.amount} direction="out" />}
                        />
                      </li>
                    ))}
                  </ul>
                  <p className="t-label mt-2">{fr.split.settlementHint}</p>
                  <p className="t-label">{fr.split.settlementNotACost}</p>
                </Disclosure>
              </Tile>
            )}

            {/* Le chiffre s'ouvre : une dépense qui n'a rien à faire dans le
                pot commun ne se repère qu'en la voyant. */}
            <Tile className="p-2! md:p-2!">
              <Disclosure
                open={detail}
                onOpenChange={setDetail}
                title={
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="t-body truncate">{fr.split.detail}</span>
                    <span className="t-axis shrink-0">
                      {tpl(
                        entries.length > 1 ? fr.split.detailCount : fr.split.detailCountOne,
                        entries.length,
                      )}
                    </span>
                  </span>
                }
                trailing={<Amount value={total} size="body" direction="out" />}
              >
                <ul className="flex flex-col">
                  {entries.map((entry) => (
                    <li key={entry.id}>
                      <ListRow
                        color={categories.get(entry.categoryId)?.color ?? 'var(--cat-rest)'}
                        label={entry.label}
                        meta={metaOf(entry)}
                        planned={entry.status === 'planned'}
                        trailing={<Amount value={entry.amount} direction="out" />}
                      />
                    </li>
                  ))}
                </ul>
              </Disclosure>
            </Tile>

            <Tile className="gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="t-body">{fr.split.checkTotal}</span>
                {/* Ce que chacun verse, report compris : les régularisations
                    s'annulent d'un membre à l'autre, et la vérification reste
                    donc vraie au centime — c'est ce qu'elle sert à montrer. */}
                <Amount value={totalToPay(shares)} size="body" direction="out" />
              </div>
              <p className="t-label">{fr.split.checkHint}</p>
            </Tile>
          </>
        )}

        <Tile className="gap-2">
          <Eyebrow>{fr.split.method}</Eyebrow>
          <p className="t-body mt-1">{fr.split.methodFormula}</p>
          <p className="t-label">{fr.split.methodIncome}</p>
          <p className="t-label">{fr.split.methodVariable}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li className="t-label">{fr.split.methodIncluded}</li>
            <li className="t-label">{fr.split.methodFlagged}</li>
          </ul>
          <p className="t-label">{fr.split.methodExcluded}</p>
        </Tile>

        <p className="sr-only-text">{formatMoney(total, currency)}</p>
      </div>
    </>
  )
}
