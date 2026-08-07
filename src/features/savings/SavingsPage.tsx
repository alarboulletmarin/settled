import { useNavigate } from 'react-router-dom'
import { MonthHeader } from '@/app/MonthHeader'
import { entryNewPath } from '@/app/routes'
import { type Money, ZERO, abs, add } from '@/domain/money'
import { savingCapacity, savingLeft, savingRate } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatMoney, formatPercent, tpl } from '@/i18n/format'
import {
  type MemberSaving,
  useCategoryMap,
  useKindTotals,
  useMemberFilter,
  useMemberMap,
  useMemberSavings,
  useMembers,
  useSavingsByCategory,
  useUnassignedSavings,
} from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { Plus, SavingsIcon } from '@/ui/Icons'
import { ListRow } from '@/ui/ListRow'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/** Une ligne de la cascade : son terme, et ce qu'il pèse. */
function Term({ label, value, direction }: { label: string; value: Money; direction?: 'in' | 'out' }) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="t-label min-w-0 flex-1 truncate">{label}</span>
      <Amount
        value={value}
        size="body"
        className="shrink-0"
        {...(direction === undefined ? {} : { direction })}
      />
    </li>
  )
}

/**
 * Ce que le mois dégage, terme par terme.
 *
 * Le résultat seul se croit sur parole. Les trois lignes qui le produisent se
 * vérifient — et disent surtout quoi changer : un crédit qui mange la moitié de
 * la capacité ne se voit qu'ici, la grille du mois le fond dans « Charges ».
 *
 * Les chiffres sont ceux du mois entier, échéances prévues comprises, comme les
 * tuiles Revenus et Charges dont ils sont la soustraction. La question se pose
 * le 3 comme le 28 — un virement d'épargne se décide en début de mois, pas une
 * fois tout tombé.
 */
function Capacity({ capacity }: { capacity: Money }) {
  const totals = useKindTotals(true)

  return (
    <Tile variant="accent" className="gap-3">
      <Eyebrow icon={SavingsIcon}>{fr.savings.capacity}</Eyebrow>
      <Amount value={capacity} size="tile" tone={capacity < 0 ? 'danger' : 'default'} />
      <span className="t-label">{fr.savings.capacityHint}</span>

      <ul className="mt-1 flex flex-col gap-1.5 border-t border-border pt-3">
        <Term label={fr.savings.flowIncome} value={totals.resource} direction="in" />
        <Term label={fr.savings.flowCharges} value={totals.charge} direction="out" />
        {/* Le crédit n'apparaît que s'il y en a : une ligne à zéro laisserait
            croire à une nature qu'on aurait oublié de renseigner. */}
        {totals.debt > 0 && (
          <Term label={fr.savings.flowDebts} value={totals.debt} direction="out" />
        )}
      </ul>

      {capacity < 0 && <p className="t-label mt-1">{fr.savings.capacityNegative}</p>}
    </Tile>
  )
}

/**
 * Où l'épargne du mois se place, du plus gros support au plus petit.
 *
 * Les montants sont signés, et c'est indispensable : une avance reprend 600 €
 * sur un livret le mois où elle est posée, et un support qui rend plus qu'il ne
 * reçoit afficherait sinon « 510 € » là où il faut lire « −510 € ». Le « + »
 * n'est pas décoratif non plus — il dit ce qui entre sur le support, en regard
 * de ce qui en sort.
 */
function Placed({ saved }: { saved: Money }) {
  const slices = useSavingsByCategory()
  const categories = useCategoryMap()
  const unassigned = useUnassignedSavings()
  const filter = useMemberFilter()

  /* Une part n'a de sens qu'entre des mouvements de même signe : sur un mois
     où l'on reprend plus qu'on ne place, « −24 % » ne veut rien dire, et le
     montant à côté dit déjà tout ce qu'il y a à savoir. */
  const shares = saved > ZERO && slices.every((slice) => slice.total > ZERO)

  return (
    <Tile className="gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <Eyebrow>{fr.savings.placed}</Eyebrow>
        <Amount value={saved} size="body" signed />
      </div>

      {slices.length === 0 ? (
        <p className="t-label">{fr.savings.placedEmpty}</p>
      ) : (
        <ul className="flex flex-col">
          {slices.map((slice) => (
            <li key={slice.categoryId}>
              <ListRow
                color={categories.get(slice.categoryId)?.color ?? 'var(--cat-rest)'}
                label={categories.get(slice.categoryId)?.label ?? fr.common.other}
                {...(shares ? { meta: formatPercent(slice.share) } : {})}
                trailing={<Amount value={slice.total} signed />}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Le mois où une avance est posée : le livret a rendu plus qu'il n'a
          reçu, et le chiffre négatif au-dessus paraîtrait faux sans ça. */}
      {saved < ZERO && <p className="t-label">{fr.savings.withdrawn}</p>}

      {/* Un versement resté « en commun » n'est à personne, et l'épargne ne
          se partage pas : il ne compte dans la capacité de personne, et rien
          nulle part ne le disait. C'est le pendant du salaire non attribué de
          l'écran Répartition. Dit une seule fois, hors filtre : sous filtre, il
          n'est de toute façon pas dans la liste qu'on regarde. */}
      {filter === undefined && unassigned.length > 0 && (
        <p className="t-label border-t border-border pt-3">{fr.savings.placedUnassigned}</p>
      )}
    </Tile>
  )
}

/**
 * Ce qui reste à placer — la question qui suit la capacité, et à laquelle aucun
 * chiffre ne répondait.
 *
 * Savoir qu'on dégage 1 000 € ne dit pas s'il en reste à répartir : 800 € en
 * partent peut-être déjà d'eux-mêmes sur un livret et un plan, et les 200 €
 * restants sont les seuls dont on décide ce mois-ci.
 */
function Left({ left, rate }: { left: Money; rate: number | null }) {
  const currency = useCurrency()
  const over = left < 0

  return (
    <Tile className="gap-2">
      <Eyebrow>{over ? fr.savings.over : fr.savings.left}</Eyebrow>
      <Amount value={abs(left)} size="tile" tone={over ? 'danger' : 'default'} />
      <span className="t-label">
        {over
          ? tpl(fr.savings.overHint, formatMoney(abs(left), currency))
          : left === ZERO
            ? fr.savings.leftNone
            : fr.savings.leftHint}
      </span>
      <span className="t-label">
        {rate === null
          ? fr.savings.rateNone
          : rate < 0
            ? fr.savings.withdrawn
            : tpl(fr.savings.rate, formatPercent(rate))}
      </span>
    </Tile>
  )
}

/** La lecture d'un membre, hors filtre : chacun décide sur son compte. */
function MemberRow({ saving }: { saving: MemberSaving }) {
  const members = useMemberMap()
  const currency = useCurrency()
  const member = members.get(saving.memberId)
  const over = saving.left < 0

  return (
    <Tile
      className="gap-3"
      label={tpl(
        fr.savings.srMemberSaving,
        member?.name ?? '',
        formatMoney(saving.capacity, currency),
        formatMoney(saving.saved, currency),
        formatMoney(saving.left, currency),
      )}
    >
      <div className="flex items-center gap-3">
        <Dot color={member?.color ?? 'var(--cat-rest)'} />
        <span className="t-body min-w-0 flex-1 truncate font-medium">{member?.name ?? ''}</span>
      </div>
      <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
        <Term label={fr.savings.capacity} value={saving.capacity} />
        {/* Signé, comme la ventilation : un mois de reprise rend un versé
            négatif, et le montrer positif serait un chiffre faux. */}
        <li className="flex items-baseline gap-3">
          <span className="t-label min-w-0 flex-1 truncate">{fr.savings.placedTotal}</span>
          <Amount value={saving.saved} size="body" signed className="shrink-0" />
        </li>
        <li className="flex items-baseline gap-3">
          <span className="t-label min-w-0 flex-1 truncate">
            {over ? fr.savings.over : fr.savings.left}
          </span>
          <Amount
            value={abs(saving.left)}
            size="body"
            tone={over ? 'danger' : 'default'}
            className="shrink-0"
          />
        </li>
      </ul>
    </Tile>
  )
}

/**
 * L'écran de l'épargne — celui qu'ouvre la tuile Capacité du mois.
 *
 * Le mois répond « combien peux-tu mettre de côté » et s'arrête là. La question
 * suivante — où le placer, et combien reste-t-il à répartir entre les supports —
 * n'avait aucun écran : les versements se noyaient dans les sorties du mois, et
 * le seul chiffre qui les mentionnait était une note sous un donut.
 *
 * La lecture est individuelle par construction. L'épargne est le seul chiffre du
 * mois qui n'a aucun sens au foyer : deux personnes qui dégagent 300 € et 900 €
 * n'ont pas « 1 200 € à placer », elles ont deux décisions à prendre sur deux
 * comptes. Sous filtre, l'écran répond pour la personne, sa part des charges
 * communes comprise ; hors filtre, il pose les colonnes côte à côte plutôt
 * qu'une somme qui ne se décide nulle part.
 */
export function SavingsPage() {
  const navigate = useNavigate()
  const totals = useKindTotals(true)
  const filter = useMemberFilter()
  const members = useMembers()
  const perMember = useMemberSavings()

  const capacity = savingCapacity(totals)
  const left = savingLeft(totals)
  const rate = savingRate(totals)
  const nothing = add(totals.resource, add(totals.charge, add(totals.debt, totals.saving))) === ZERO

  return (
    <>
      {/* Les deux gestes de l'écran, là où la question se pose : il disait ce
          qu'on pouvait placer sans offrir de le faire, et reprendre sur un
          livret n'existait nulle part. */}
      <PageTitle title={fr.savings.title}>
        <Button
          size="sm"
          onClick={() => {
            void navigate(entryNewPath({ direction: 'out', saving: true }))
          }}
        >
          <Plus size={18} />
          {fr.entry.savingIn}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigate(entryNewPath({ direction: 'in', saving: true }))
          }}
        >
          {fr.entry.savingOut}
        </Button>
      </PageTitle>
      <MonthHeader prorataNote withCommon={false} />

      {nothing ? (
        <EmptyState message={fr.savings.empty} />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <p className="t-label">{fr.savings.subtitle}</p>

          <Capacity capacity={capacity} />
          <Placed saved={totals.saving} />
          <Left left={left} rate={rate} />

          {/* Hors filtre et à plusieurs : les deux lectures côte à côte, pour
              ne pas avoir à passer d'une pastille à l'autre pour comparer. */}
          {filter === undefined && members.length > 1 && perMember.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Eyebrow>{fr.savings.byMember}</Eyebrow>
                <p className="t-label">{fr.savings.byMemberHint}</p>
              </div>
              {perMember.map((saving) => (
                <MemberRow key={saving.memberId} saving={saving} />
              ))}
            </section>
          )}

          <Tile className="gap-2">
            <Eyebrow>{fr.savings.method}</Eyebrow>
            <p className="t-body mt-1">{fr.savings.methodFormula}</p>
            <p className="t-label">{fr.savings.methodExcluded}</p>
            <p className="t-label">{fr.savings.methodShared}</p>
            <p className="t-label">{fr.savings.methodBalance}</p>
          </Tile>
        </div>
      )}
    </>
  )
}
