import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  eur,
  makeCategory,
  makeData,
  makeEntry,
  makeFamily,
  makeMember,
  makeSavingSupport,
  makeSavingValuation,
} from '@/domain/fixtures'
import {
  useKindTotals,
  useMonthEntries,
  useMonthScope,
  useMonthTotals,
  useSavingTotal,
  useSavingsBySupport,
  useScopedSavingSupports,
  useTrailingMonths,
} from './selectors'
import { useStore } from './store'

const initial = useStore.getState().data
const initialYm = useStore.getState().ym

describe('la portée du mois, mutualisée', () => {
  afterEach(() => {
    useStore.setState({ data: initial })
  })

  /* Une dizaine de hooks lisent cette portée, et le tableau de bord les appelle
     presque tous : chacun refaisait le balayage complet du document pour son
     compte. Le cache se voit à la référence — deux lectures d'une même passe
     rendent le même objet, ce que deux `useMemo` séparés ne feraient jamais. */
  it('rend le même objet à deux lectures de la même passe', () => {
    useStore.setState({ data: makeData() })

    const { result } = renderHook(() => [useMonthScope(), useMonthScope()] as const)
    const [first, second] = result.current

    expect(second).toBe(first)
    expect(second.entries).toBe(first.entries)
  })

  it('sert aussi les hooks qui la lisent sans la nommer', () => {
    useStore.setState({ data: makeData() })

    const { result } = renderHook(
      () => [useMonthScope(), useMonthTotals(), useTrailingMonths()] as const,
    )

    // Les deux dérivés ont bien été calculés sur quelque chose : ce qu'on
    // vérifie ici est qu'ils ne cassent pas en passant par le cache.
    expect(result.current[1]).toBeDefined()
    expect(result.current[2].length).toBeGreaterThan(0)
  })

  it('recalcule dès que le document change', () => {
    useStore.setState({ data: makeData() })
    const { result, rerender } = renderHook(() => useMonthScope())
    const before = result.current

    useStore.setState({ data: { ...makeData(), entries: [] } })
    rerender()

    expect(result.current).not.toBe(before)
    expect(result.current.entries).toEqual([])
  })

  it('recalcule dès que le filtre change', () => {
    useStore.setState({ data: makeData() })
    useStore.getState().setFilter({ kind: 'all' })
    const { result, rerender } = renderHook(() => useMonthScope())
    const before = result.current

    useStore.getState().setFilter({ kind: 'common' })
    rerender()

    expect(result.current).not.toBe(before)
  })
})

/* Seul du foyer, la vue filtrée sur le membre doit valoir « tout le monde » au
   centime : le prorata vaut trivialement 100 %, et les lignes que personne ne
   porte — le loyer commun, une paie laissée « en commun » — lui
   reviennent. C'est l'incohérence qui a motivé la règle : solde et capacité
   d'épargne divergeaient entre les deux pilules d'un même foyer d'une
   personne. */
describe('le foyer d’une seule personne, au travers du store', () => {
  afterEach(() => {
    useStore.setState({ data: initial, ym: initialYm })
    useStore.getState().setFilter({ kind: 'all' })
  })

  const soloData = makeData({
    household: { name: 'Maison', members: [makeMember({ id: 'm-1' })] },
    families: [
      makeFamily({ id: 'fam-charges', kind: 'charge' }),
      makeFamily({ id: 'fam-res', kind: 'resource' }),
    ],
    categories: [
      makeCategory({ id: 'logement', familyId: 'fam-charges' }),
      makeCategory({ id: 'courses', familyId: 'fam-charges' }),
      makeCategory({ id: 'salaire', familyId: 'fam-res', direction: 'in' }),
    ],
    entries: [
      makeEntry({ id: 'loyer', date: '2026-07-05', amount: eur(95_000), categoryId: 'logement' }),
      makeEntry({ id: 'sien', date: '2026-07-15', amount: eur(4_000), categoryId: 'courses', memberId: 'm-1' }),
      makeEntry({ id: 'paie', date: '2026-07-01', direction: 'in', amount: eur(250_000), categoryId: 'salaire' }),
    ],
  })

  it('filtré sur le membre seul, le mois est celui du foyer', () => {
    useStore.setState({ data: soloData, ym: '2026-07' })

    useStore.getState().setFilter({ kind: 'all' })
    const foyer = renderHook(() => useMonthTotals()).result.current

    useStore.getState().setFilter({ kind: 'member', memberId: 'm-1' })
    const { result } = renderHook(
      () => [useMonthScope(), useMonthTotals(), useMonthEntries()] as const,
    )
    const [scope, totals, listes] = result.current

    // Le prorata se calcule — pas de repli sur ses seules lignes.
    expect(scope.prorated).toBe(true)
    expect(scope.partial).toBe(false)
    expect(totals).toEqual(foyer)
    // Les listes n'ont rien à retrancher : le loyer et la paie y restent.
    expect(listes.map((e) => e.id).sort()).toEqual(['loyer', 'paie', 'sien'])
  })
})

/* ============================================================================
 * L'écran du mois et l'écran d'épargne comptent les mêmes `Entry`.
 *
 * C'est l'invariant que deux calculs séparés finiraient toujours par casser :
 * la tuile « Capacité » annonce ce qui est versé sur le mois, l'écran d'épargne
 * le ventile par support, et les deux doivent tomber au même centime — sous
 * filtre comme sans.
 * ==========================================================================*/
describe('le versé du mois, vu des deux écrans', () => {
  afterEach(() => {
    useStore.setState({ data: initial, ym: initialYm })
    useStore.getState().setFilter({ kind: 'all' })
  })

  const savingData = makeData({
    household: {
      name: '',
      members: [makeMember({ id: 'm-1' }), makeMember({ id: 'm-2' })],
    },
    families: [
      makeFamily({ id: 'fam-res', kind: 'resource' }),
      makeFamily({ id: 'fam-savings', kind: 'saving' }),
    ],
    categories: [
      makeCategory({ id: 'salaire', familyId: 'fam-res', direction: 'in' }),
      makeCategory({ id: 'passbook', familyId: 'fam-savings' }),
    ],
    savingSupports: [
      makeSavingSupport({ id: 's-1', memberId: 'm-1' }),
      makeSavingSupport({ id: 's-2', memberId: 'm-2' }),
    ],
    savingValuations: [
      makeSavingValuation({ id: 'v-1', supportId: 's-1', amount: eur(1_000_000) }),
    ],
    entries: [
      makeEntry({ id: 'p1', date: '2026-07-01', direction: 'in', amount: eur(250_000), categoryId: 'salaire', memberId: 'm-1' }),
      makeEntry({ id: 'p2', date: '2026-07-01', direction: 'in', amount: eur(250_000), categoryId: 'salaire', memberId: 'm-2' }),
      makeEntry({ id: 'v1', date: '2026-07-05', amount: eur(20_000), categoryId: 'passbook', memberId: 'm-1', savingSupportId: 's-1' }),
      makeEntry({ id: 'v2', date: '2026-07-06', amount: eur(30_000), categoryId: 'passbook', memberId: 'm-2', savingSupportId: 's-2' }),
    ],
  })

  const sumOf = (slices: readonly { total: number }[]): number =>
    slices.reduce((total, slice) => total + slice.total, 0)

  it('tombe au même centime, hors filtre', () => {
    useStore.setState({ data: savingData, ym: '2026-07' })
    const { result } = renderHook(() => [useKindTotals(true), useSavingsBySupport()] as const)
    const [totals, slices] = result.current

    expect(totals.saving).toBe(50_000)
    expect(sumOf(slices)).toBe(totals.saving)
  })

  it('tombe au même centime sous un filtre par personne', () => {
    useStore.setState({ data: savingData, ym: '2026-07' })
    useStore.getState().setFilter({ kind: 'member', memberId: 'm-1' })

    const { result } = renderHook(() => [useKindTotals(true), useSavingsBySupport()] as const)
    const [totals, slices] = result.current

    expect(totals.saving).toBe(20_000)
    expect(sumOf(slices)).toBe(totals.saving)
    expect(slices.map((slice) => slice.supportId)).toEqual(['s-1'])
  })

  /* L'épargne ne se répartit pas comme une charge : il n'existe pas de support
     commun, et la lecture « Commun » n'en montre donc aucun. */
  it('ne montre aucun support sur la lecture du pot commun', () => {
    useStore.setState({ data: savingData, ym: '2026-07' })
    useStore.getState().setFilter({ kind: 'common' })

    const { result } = renderHook(() => useScopedSavingSupports())
    expect(result.current).toEqual([])
  })

  /* Une inconnue n'entre pas dans le total, et elle est comptée à part : le
     patrimoine annoncé ne peut pas se présenter comme exact quand il ne l'est
     pas. */
  it('n’additionne que les supports relevés, et dit ce qui manque', () => {
    useStore.setState({ data: savingData, ym: '2026-07' })
    const { result } = renderHook(() => useSavingTotal())
    expect(result.current).toEqual({ known: 1_000_000, valued: 1, unvalued: 1 })
  })
})
