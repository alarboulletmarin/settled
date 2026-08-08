/* ============================================================================
 * Les invariants du modèle d'épargne, et les scénarios qui les traversent.
 *
 * Ce fichier ne teste pas une fonction, il teste une **propriété** : qu'un
 * support d'épargne est une entité unique, et que tout ce qui parle de cette
 * épargne — versements, récurrences, reprises, avances, valorisations, écran du
 * mois et écran d'épargne — pointe vers elle et vers elle seule.
 *
 * C'est le genre de règle qu'aucun test unitaire ne protège : chaque fonction
 * peut être juste et l'ensemble faux, parce que deux d'entre elles comptent la
 * même chose de deux façons.
 * ==========================================================================*/

import { describe, expect, it } from 'vitest'
import { type ISODate, currentYm, startOfMonth, ymOf } from './date'
import {
  eur,
  makeCategory,
  makeData,
  makeFamily,
  makeMember,
  sequentialIds,
} from './fixtures'
import {
  knownSavingTotal,
  latestValuation,
  savingsBySupport,
  supportMonthFlows,
  supportValue,
} from './saving'
import { savingCapacity, savingLeft, totalsByKind } from './stats'
import { type CategoryKind, type Data, kindOfCategory } from './types'
import {
  addEntry,
  addRecurrence,
  addSavingValuation,
  createAdvance,
  createSavingSupport,
  openMonth,
  removeMember,
  removeSavingSupport,
  syncRecurrenceEntries,
} from './updates'
import { normalizeDocument } from '@/persistence/validate'

const ON: ISODate = '2026-08-15'
const MONTH = ymOf(ON)

/** Un foyer nu : deux personnes, un catalogue minimal dont une famille épargne. */
function household(): Data {
  return makeData({
    household: {
      name: '',
      members: [makeMember({ id: 'm-andrea' }), makeMember({ id: 'm-marie' })],
    },
    families: [
      makeFamily({ id: 'fam-resources', kind: 'resource' }),
      makeFamily({ id: 'fam-savings', kind: 'saving' }),
      makeFamily({ id: 'fam-leisure', kind: 'charge' }),
    ],
    categories: [
      makeCategory({ id: 'salary', familyId: 'fam-resources', direction: 'in' }),
      makeCategory({ id: 'passbook', familyId: 'fam-savings' }),
      makeCategory({ id: 'plans', familyId: 'fam-savings' }),
      makeCategory({ id: 'car-insurance', familyId: 'fam-leisure' }),
    ],
    months: [{ ym: MONTH, openedAt: startOfMonth(MONTH), closed: false }],
  })
}

const kindOfIn = (data: Data): ((id: string) => CategoryKind) =>
  (id) => kindOfCategory(data.families, data.categories, id)

/** Pose un support et rend le document avec lui. */
function withSupport(
  data: Data,
  label: string,
  memberId: string,
  categoryId: string,
  value?: number,
): { data: Data; id: string } {
  const created = createSavingSupport(
    data,
    {
      label,
      memberId,
      categoryId,
      ...(value === undefined ? {} : { value: { amount: eur(value), date: '2026-08-01' } }),
    },
    sequentialIds(`${label}-`),
  )
  return { data: created.data, id: created.support.id }
}

/* --- Les invariants -------------------------------------------------------*/

describe('invariants du modèle d’épargne', () => {
  /** Invariant 1 : tout lien de support mène à un support existant. */
  const linksResolve = (data: Data): boolean => {
    const ids = new Set(data.savingSupports.map((support) => support.id))
    const linked = [
      ...data.entries.map((e) => e.savingSupportId),
      ...data.recurrences.map((r) => r.savingSupportId),
      ...data.advances.map((a) => a.savingSupportId),
    ]
    return linked.every((id) => id === undefined || ids.has(id))
  }

  /** Invariant 2 : tout support appartient à un membre du foyer. */
  const ownersExist = (data: Data): boolean => {
    const members = new Set(data.household.members.map((member) => member.id))
    return data.savingSupports.every((support) => members.has(support.memberId))
  }

  /** Invariant 3 : toute valorisation décrit un support existant. */
  const valuationsResolve = (data: Data): boolean => {
    const ids = new Set(data.savingSupports.map((support) => support.id))
    return data.savingValuations.every((valuation) => ids.has(valuation.supportId))
  }

  const holds = (data: Data): boolean =>
    linksResolve(data) && ownersExist(data) && valuationsResolve(data)

  it('tient sur un document complet, supports, règles et avance compris', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = livret.data
    const pea = withSupport(data, 'PEA', 'm-marie', 'plans', 2_000_000)
    data = pea.data

    data = addRecurrence(data, {
      id: 'r-livret',
      label: 'Virement livret',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'out',
      amount: eur(20_000),
      period: { unit: 'month', every: 1, anchorDay: 5 },
      startedOn: '2026-01-05',
    })
    data = syncRecurrenceEntries(data, 'r-livret', sequentialIds('e-'), ON)
    data = createAdvance(
      data,
      {
        label: 'Assurance auto',
        categoryId: 'car-insurance',
        memberId: 'm-marie',
        savingSupportId: pea.id,
        amount: eur(60_000),
        paidOn: '2026-08-10',
        from: '2026-08',
        to: '2027-07',
      },
      sequentialIds('av-'),
      ON,
    ).data

    expect(holds(data)).toBe(true)
  })

  /* Un lien mort ne survit à aucun geste : ni la suppression d'un support, ni
     le retrait d'un membre, ni la lecture d'un fichier venu d'ailleurs. */
  it('tient après la suppression d’un support', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = addEntry(livret.data, {
      id: 'e1',
      label: 'Virement',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'out',
      amount: eur(20_000),
      date: '2026-08-05',
      status: 'confirmed',
    })

    const after = removeSavingSupport(data, livret.id)
    expect(holds(after)).toBe(true)
    // L'historique financier ne bouge pas : seul le lien est coupé.
    expect(after.entries[0]?.amount).toBe(20_000)
  })

  it('tient après le retrait du membre qui portait les supports', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = addEntry(livret.data, {
      id: 'e1',
      label: 'Virement',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'out',
      amount: eur(20_000),
      date: '2026-08-05',
      status: 'confirmed',
    })

    const after = removeMember(data, 'm-andrea')
    expect(holds(after)).toBe(true)
    expect(after.savingValuations).toEqual([])
    expect(after.entries[0]?.amount).toBe(20_000)
  })

  /** Invariant 7 : un export / import ne change aucune relation. */
  it('traverse un export / import sans qu’une relation bouge', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = livret.data
    data = addEntry(data, {
      id: 'e1',
      label: 'Virement',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'out',
      amount: eur(20_000),
      date: '2026-08-05',
      status: 'confirmed',
    })

    const { data: restored, notices } = normalizeDocument(
      JSON.parse(JSON.stringify(data)) as unknown,
    )
    expect(notices).toEqual([])
    expect(restored).toStrictEqual(data)
    expect(holds(restored)).toBe(true)
  })

  /** Invariant 6 : une valorisation n'entre dans aucun total du mois. */
  it('ne laisse aucune valorisation peser sur le mois', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook')
    data = livret.data

    const before = totalsByKind(data.entries, MONTH, kindOfIn(data), undefined, true)
    const after = addSavingValuation(data, {
      id: 'v1',
      supportId: livret.id,
      amount: eur(1_845_000),
      date: '2026-08-08',
    })
    const totals = totalsByKind(after.entries, MONTH, kindOfIn(after), undefined, true)

    expect(totals).toStrictEqual(before)
    expect(totals.saving).toBe(0)
    expect(savingCapacity(totals)).toBe(0)
    // Elle change en revanche ce que le support vaut, et elle seule.
    expect(latestValuation(after.savingValuations, livret.id, ON)?.amount).toBe(1_845_000)
  })
})

/* --- Les scénarios --------------------------------------------------------*/

describe('scénarios d’épargne, de bout en bout', () => {
  /* Scénario A — l'onboarding : un support, une valeur, un versement mensuel.
     Ce qui compte est ce qui *ne* doit pas exister : un second support, une
     seconde valorisation, un montant recopié. */
  it('A · un support, une valorisation, une récurrence, aucun doublon', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = addRecurrence(livret.data, {
      id: 'r1',
      label: 'Virement livret',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'out',
      amount: eur(20_000),
      period: { unit: 'month', every: 1, anchorDay: 5 },
      startedOn: startOfMonth(MONTH),
    })

    expect(data.savingSupports).toHaveLength(1)
    expect(data.savingValuations).toHaveLength(1)
    expect(data.recurrences).toHaveLength(1)
    // Le montant du capital n'existe qu'une fois, dans la valorisation.
    expect(JSON.stringify(data.savingSupports)).not.toContain('1000000')
  })

  /* Scénario B — un versement ponctuel. Le mois le compte, la fiche du support
     le compte, et le relevé initial ne bouge pas d'un centime. */
  it('B · un versement compte dans le mois et sur le support, sans toucher au relevé', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = addEntry(livret.data, {
      id: 'e1',
      label: 'Virement',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'out',
      amount: eur(50_000),
      date: '2026-08-05',
      status: 'confirmed',
    })

    expect(totalsByKind(data.entries, MONTH, kindOfIn(data), undefined, true).saving).toBe(50_000)
    expect(supportMonthFlows(data.entries, livret.id, MONTH).net).toBe(50_000)

    const value = supportValue(livret.id, data.savingValuations, data.entries, ON)
    expect(value.known).toBe(1_000_000)
    expect(value.estimated).toBe(1_050_000)
    // L'estimation ne s'enregistre jamais : le document ne porte qu'un relevé.
    expect(data.savingValuations).toHaveLength(1)
    expect(data.savingValuations[0]?.amount).toBe(1_000_000)
  })

  /* Scénario C — une reprise. Elle diminue le net d'épargne du mois, et n'est
     jamais un revenu : les ressources ne bougent pas. */
  it('C · une reprise diminue l’épargne nette, et n’est pas un revenu', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = addEntry(livret.data, {
      id: 'e1',
      label: 'Reprise livret',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'in',
      amount: eur(60_000),
      date: '2026-08-12',
      status: 'confirmed',
    })

    const totals = totalsByKind(data.entries, MONTH, kindOfIn(data), undefined, true)
    expect(totals.saving).toBe(-60_000)
    expect(totals.resource).toBe(0)
    // Ce qu'il reste à placer augmente d'autant : c'est ce qu'il faudrait pour
    // être quitte.
    expect(savingLeft(totals)).toBe(60_000)
    expect(supportMonthFlows(data.entries, livret.id, MONTH).withdrawals).toBe(60_000)
  })

  /* Scénario D — une nouvelle valorisation après des mouvements. Elle s'empile,
     elle n'écrase rien, et aucune `Entry` ne bouge. */
  it('D · un nouveau relevé s’empile sans réécrire l’historique', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = addEntry(livret.data, {
      id: 'e1',
      label: 'Virement',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'out',
      amount: eur(50_000),
      date: '2026-08-05',
      status: 'confirmed',
    })
    const entriesBefore = data.entries

    data = addSavingValuation(data, {
      id: 'v2',
      supportId: livret.id,
      amount: eur(1_065_000),
      date: '2026-08-14',
    })

    expect(data.entries).toStrictEqual(entriesBefore)
    expect(data.savingValuations).toHaveLength(2)
    const value = supportValue(livret.id, data.savingValuations, data.entries, ON)
    expect(value.known).toBe(1_065_000)
    // Le versement est antérieur au relevé : il est déjà dedans.
    expect(value.movedSince).toBe(0)
  })

  /* Scénario E — plusieurs supports. Le versé du mois et la ventilation par
     support se lisent sur les **mêmes** `Entry` : leur somme doit valoir le
     chiffre que le tableau de bord affiche, au centime. */
  it('E · le versé du mois vaut exactement la somme de la ventilation', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = livret.data
    const pea = withSupport(data, 'PEA', 'm-andrea', 'plans', 2_000_000)
    data = pea.data

    data = addEntry(data, {
      id: 'e1',
      label: 'Virement livret',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'out',
      amount: eur(20_000),
      date: '2026-08-05',
      status: 'confirmed',
    })
    data = addEntry(data, {
      id: 'e2',
      label: 'Virement PEA',
      categoryId: 'plans',
      memberId: 'm-andrea',
      savingSupportId: pea.id,
      direction: 'out',
      amount: eur(30_000),
      date: '2026-08-06',
      status: 'confirmed',
    })

    const kindOf = kindOfIn(data)
    const dashboard = totalsByKind(data.entries, MONTH, kindOf, undefined, true).saving
    const slices = savingsBySupport(data.entries, MONTH, kindOf)

    expect(dashboard).toBe(50_000)
    expect(slices.reduce((total, slice) => total + slice.total, 0)).toBe(dashboard)
    expect(slices.map((slice) => slice.supportId)).toEqual([pea.id, livret.id])
  })

  /* Scénario F — deux personnes. Le total du foyer est la somme des deux, et il
     n'existe aucune vue « commun » : un livret n'appartient à personne d'autre
     qu'à son porteur. */
  it('F · chaque personne a ses supports, et leur somme fait le foyer', () => {
    let data = household()
    const pea = withSupport(data, 'PEA', 'm-andrea', 'plans', 2_000_000)
    data = pea.data
    const livret = withSupport(data, 'Livret A', 'm-marie', 'passbook', 800_000)
    data = livret.data

    const all = knownSavingTotal(data.savingSupports, data.savingValuations, ON)
    const andrea = knownSavingTotal(
      data.savingSupports.filter((s) => s.memberId === 'm-andrea'),
      data.savingValuations,
      ON,
    )
    const marie = knownSavingTotal(
      data.savingSupports.filter((s) => s.memberId === 'm-marie'),
      data.savingValuations,
      ON,
    )

    expect(all.known).toBe(2_800_000)
    expect(andrea.known).toBe(2_000_000)
    expect(marie.known).toBe(800_000)
    expect(andrea.known + marie.known).toBe(all.known)
    // Aucun support n'est sans porteur : il n'existe pas d'épargne commune.
    expect(data.savingSupports.every((s) => s.memberId !== '')).toBe(true)
  })

  /* Une inconnue ne s'additionne pas : « 20 000 €, un support sans valeur »
     plutôt qu'un patrimoine faux annoncé comme exact. */
  it('ne compte jamais un support sans relevé comme valant zéro', () => {
    let data = household()
    const pea = withSupport(data, 'PEA', 'm-andrea', 'plans', 2_000_000)
    data = pea.data
    data = withSupport(data, 'Assurance-vie', 'm-andrea', 'plans').data

    const total = knownSavingTotal(data.savingSupports, data.savingValuations, ON)
    expect(total).toEqual({ known: 2_000_000, valued: 1, unvalued: 1 })
  })

  /* Une avance fait passer la reprise et toutes ses mensualités par le même
     compte : c'est ce qui interdit de vider un livret et d'en remplir un autre. */
  it('fait passer une avance, sa reprise et sa reconstitution par le même support', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    const created = createAdvance(
      livret.data,
      {
        label: 'Assurance auto',
        categoryId: 'car-insurance',
        memberId: 'm-andrea',
        savingSupportId: livret.id,
        amount: eur(60_000),
        paidOn: '2026-08-10',
        from: '2026-08',
        to: '2027-07',
      },
      sequentialIds('av-'),
      ON,
    )
    data = openMonth(created.data, MONTH, sequentialIds('m-'), ON).data

    const linked = data.entries.filter((entry) => entry.savingSupportId === livret.id)
    expect(linked.length).toBeGreaterThan(1)
    expect(created.advance.savingSupportId).toBe(livret.id)
    // Le mois de la reprise : le livret rend plus qu'il ne reçoit.
    expect(supportMonthFlows(data.entries, livret.id, MONTH, true).net).toBeLessThan(0)
  })

  /* Le mois courant sert de garde : les scénarios ci-dessus sont datés, et une
     lecture au mois d'aujourd'hui ne doit pas les faire apparaître. */
  it('ne fait pas apparaître un mouvement daté ailleurs dans le mois courant', () => {
    let data = household()
    const livret = withSupport(data, 'Livret A', 'm-andrea', 'passbook', 1_000_000)
    data = addEntry(livret.data, {
      id: 'e1',
      label: 'Virement',
      categoryId: 'passbook',
      memberId: 'm-andrea',
      savingSupportId: livret.id,
      direction: 'out',
      amount: eur(20_000),
      date: '2026-08-05',
      status: 'confirmed',
    })
    if (currentYm() !== MONTH) {
      expect(supportMonthFlows(data.entries, livret.id, currentYm()).net).toBe(0)
    }
  })
})
