import { useNavigate } from 'react-router-dom'
import { MonthHeader } from '@/app/MonthHeader'
import { SUPPORT_NEW_PATH, entryNewPath, supportPath } from '@/app/routes'
import { type Money, ZERO, abs, add } from '@/domain/money'
import { UNLINKED_SUPPORT } from '@/domain/saving'
import { savingCapacity, savingLeft, savingRate } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatDate, formatMoney, formatPercent, tpl } from '@/i18n/format'
import {
  type MemberSaving,
  useCategoryMap,
  useKindTotals,
  useMemberFilter,
  useMemberMap,
  useMemberSavings,
  useMembers,
  useSavingTotal,
  useSavingValuations,
  useSavingsBySupport,
  useSavingSupportMap,
  useScopedSavingSupports,
  useUnassignedSavings,
  useUnlinkedSavings,
} from '@/store/selectors'
import { latestValuation } from '@/domain/saving'
import { Amount } from '@/ui/Amount'
import { Button } from '@/ui/Button'
import { Dot } from '@/ui/Dot'
import { EmptyState } from '@/ui/EmptyState'
import { Eyebrow } from '@/ui/Eyebrow'
import { Plus, SavingsIcon } from '@/ui/Icons'
import { ListRow } from '@/ui/ListRow'
import { PageTitle } from '@/ui/PageTitle'
import { BentoGrid, Tile } from '@/ui/Tile'
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
 * Ce que l'épargne vaut — le **stock**, et rien d'autre.
 *
 * Le total ne porte que sur les supports dont une valeur a été relevée, et il
 * dit combien n'en ont pas : additionner une inconnue comme un zéro donnerait
 * un patrimoine faux annoncé comme exact, ce qui est pire que pas de chiffre.
 *
 * Le net du mois est posé à côté, jamais dedans : ce sont deux questions — ce
 * que je possède, et ce que le mois y a ajouté — et les additionner reviendrait
 * à compter deux fois ce que la dernière valorisation contient déjà.
 */
function Total({ net }: { net: Money }) {
  const total = useSavingTotal()

  return (
    <Tile variant="accent" className="gap-2">
      <Eyebrow icon={SavingsIcon}>{fr.savings.total}</Eyebrow>
      {total.valued === 0 ? (
        <p className="t-body">{fr.savings.totalNone}</p>
      ) : (
        <>
          <Amount value={total.known} size="hero-fit" />
          <span className="t-label">{fr.savings.totalHint}</span>
        </>
      )}
      {/* Jamais fondu dans le total : l'écran doit pouvoir dire « 32 450 € sur
          les supports renseignés » sans laisser croire que c'est tout. */}
      {total.unvalued > 0 && (
        <span className="t-label">
          {total.unvalued === 1
            ? fr.savings.totalMissingOne
            : tpl(fr.savings.totalMissing, total.unvalued)}
        </span>
      )}
      <div className="mt-1 flex items-baseline gap-3 border-t border-border pt-3">
        <span className="t-label min-w-0 flex-1 truncate">{fr.savings.netMonth}</span>
        <Amount value={net} size="body" signed className="shrink-0" />
      </div>
    </Tile>
  )
}

/**
 * Les supports, un par tuile — où l'argent est placé, à qui il est, et ce que
 * le mois y a mis.
 *
 * Le mouvement du mois vient des mêmes `Entry` que la capacité et que la tuile
 * du tableau de bord : c'est le même objet et la même source, d'un écran à
 * l'autre. Un support sans valeur relevée le dit, il n'affiche pas zéro.
 */
function Supports() {
  const navigate = useNavigate()
  const supports = useScopedSavingSupports()
  const valuations = useSavingValuations()
  const categories = useCategoryMap()
  const members = useMemberMap()
  const currency = useCurrency()
  const slices = useSavingsBySupport()
  const netOf = new Map(slices.map((slice) => [slice.supportId, slice.total]))

  /* Un support archivé sort des formulaires, pas de la lecture : il reste
     visible tant qu'il a une valeur ou un mouvement dans le mois. */
  const shown = supports.filter(
    (support) =>
      !support.archived ||
      latestValuation(valuations, support.id) !== null ||
      netOf.has(support.id),
  )
  if (shown.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <Eyebrow>{fr.savings.supports}</Eyebrow>
      <BentoGrid>
        {shown.map((support) => {
          const latest = latestValuation(valuations, support.id)
          const net = netOf.get(support.id) ?? ZERO
          const member = members.get(support.memberId)
          const color = categories.get(support.categoryId)?.color ?? 'var(--cat-rest)'

          return (
            <Tile
              key={support.id}
              span="2x2"
              className="justify-between gap-2"
              onClick={() => {
                void navigate(supportPath(support.id))
              }}
              label={tpl(fr.savings.supportOpen, support.label)}
              affordance={{ kind: 'navigate' }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Dot color={color} />
                <span className="t-body min-w-0 flex-1 truncate font-medium">{support.label}</span>
              </div>
              {/* « Valeur non renseignée », jamais « 0 € » : zéro est une
                  information financière réelle, l'inconnu n'en est pas une. */}
              {latest === null ? (
                <span className="t-label">{fr.savings.valueUnknown}</span>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <Amount value={latest.amount} size="tile-fit" />
                  <span className="t-axis truncate">{formatDate(latest.date)}</span>
                </div>
              )}
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="t-label min-w-0 truncate">{member?.name ?? ''}</span>
                {net !== ZERO && (
                  <span className="t-label tnum">
                    {`${net > ZERO ? '+' : '−'}${formatMoney(abs(net), currency, false)}`}
                  </span>
                )}
              </div>
            </Tile>
          )
        })}
      </BentoGrid>
    </section>
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
    <Tile className="gap-3">
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
 * Ces lignes sont **exactement** les `Entry` que compte le « versé ce mois » du
 * tableau de bord : c'est la même fonction, la même portée de lecture et le même
 * mois. Deux écrans qui recompteraient chacun de leur côté finiraient par
 * annoncer deux chiffres sous le même mot.
 *
 * Les montants sont signés, et c'est indispensable : une avance reprend 600 €
 * sur un livret le mois où elle est posée, et un support qui rend plus qu'il ne
 * reçoit afficherait sinon « 510 € » là où il faut lire « −510 € ».
 */
function Placed({ saved }: { saved: Money }) {
  const navigate = useNavigate()
  const slices = useSavingsBySupport()
  const supports = useSavingSupportMap()
  const categories = useCategoryMap()
  const members = useMemberMap()
  const unassigned = useUnassignedSavings()
  const unlinked = useUnlinkedSavings()
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
          {slices.map((slice) => {
            const support = supports.get(slice.supportId)
            const color =
              support === undefined
                ? 'var(--cat-rest)'
                : (categories.get(support.categoryId)?.color ?? 'var(--cat-rest)')

            /* Le propriétaire sur la ligne, et pas seulement la part : deux
               personnes peuvent avoir chacune leur « Livret A », et c'est
               justement ce que le support existe pour distinguer — deux lignes
               au même nom sans rien pour les départager reliraient la confusion
               que la catégorie entretenait. */
            const owner = support === undefined ? undefined : members.get(support.memberId)?.name
            const meta = [owner, shares ? formatPercent(slice.share) : undefined]
              .filter((part) => part !== undefined && part !== '')
              .join(' · ')

            return (
              <li key={slice.supportId}>
                <ListRow
                  color={color}
                  label={support?.label ?? fr.savings.unlinked}
                  {...(meta === '' ? {} : { meta })}
                  trailing={<Amount value={slice.total} signed />}
                  {...(support === undefined
                    ? {}
                    : {
                        onClick: () => {
                          void navigate(supportPath(support.id))
                        },
                      })}
                />
              </li>
            )
          })}
        </ul>
      )}

      {/* Le mois où une avance est posée : le livret a rendu plus qu'il n'a
          reçu, et le chiffre négatif au-dessus paraîtrait faux sans ça. */}
      {saved < ZERO && <p className="t-label">{fr.savings.withdrawn}</p>}

      {/* Des mouvements d'épargne qui ne disent pas où l'argent est allé. Ils
          comptent bien dans le mois — ce sont des `Entry` comme les autres —,
          mais la ventilation ne peut pas les placer. */}
      {unlinked.length > 0 && slices.some((slice) => slice.supportId === UNLINKED_SUPPORT) && (
        <p className="t-label border-t border-border pt-3">{fr.savings.unlinkedHint}</p>
      )}

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
 * Il répond désormais à deux questions qui ne se confondent pas, dans cet
 * ordre : **combien j'ai, et où** (le stock, relevé support par support), puis
 * **ce que le mois y met** (le flux, lu sur les `Entry`). La v1 ne savait dire
 * que le second, et le cahier assumait de n'avoir « pas de bilan patrimonial » ;
 * la lecture reste bornée à l'épargne, mais elle existe.
 *
 * Les deux ne s'additionnent jamais. Une valorisation n'est pas une opération —
 * elle n'entre ni dans le solde du mois, ni dans la capacité, ni dans le versé —
 * et un versement n'écrase aucune valorisation : sur un placement, la valeur
 * bouge aussi avec le marché.
 *
 * La lecture est individuelle par construction. L'épargne est le seul chiffre du
 * mois qui n'a aucun sens au foyer : deux personnes qui dégagent 300 € et 900 €
 * n'ont pas « 1 200 € à placer », elles ont deux décisions à prendre sur deux
 * comptes. Il n'y a donc pas de support « commun », et le filtre par personne
 * vaut aussi bien sur le stock que sur le flux.
 */
export function SavingsPage() {
  const navigate = useNavigate()
  const totals = useKindTotals(true)
  const filter = useMemberFilter()
  const members = useMembers()
  const perMember = useMemberSavings()
  const supports = useScopedSavingSupports()

  const capacity = savingCapacity(totals)
  const left = savingLeft(totals)
  const rate = savingRate(totals)
  const noFlow = add(totals.resource, add(totals.charge, add(totals.debt, totals.saving))) === ZERO
  const nothing = noFlow && supports.length === 0

  return (
    <>
      {/* Les trois gestes de l'écran, là où la question se pose. Le support
          d'abord : sans lui, les deux autres n'ont pas de destination. */}
      <PageTitle title={fr.savings.title}>
        <Button
          size="sm"
          onClick={() => {
            void navigate(SUPPORT_NEW_PATH)
          }}
        >
          <Plus size={18} />
          {fr.savings.supportAdd}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigate(entryNewPath({ direction: 'out', saving: true }))
          }}
        >
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
        <EmptyState
          message={members.length === 0 ? fr.savings.supportsNoMember : fr.savings.supportsEmpty}
          {...(members.length === 0
            ? {}
            : {
                actionLabel: fr.savings.supportAdd,
                onAction: () => {
                  void navigate(SUPPORT_NEW_PATH)
                },
              })}
        />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <p className="t-label">{fr.savings.subtitle}</p>

          {/* Le stock d'abord : c'est la question qu'on se pose en arrivant. */}
          <Total net={totals.saving} />
          <Supports />

          {/* Puis le flux du mois, inchangé — la capacité, ce qui est placé, ce
              qu'il reste à placer. */}
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
            {/* La règle qui fait exister cet écran : un relevé n'est pas un
                mouvement. Dite ici, où les deux lectures se touchent. */}
            <p className="t-label">{fr.savings.valueMethod}</p>
          </Tile>
        </div>
      )}
    </>
  )
}
