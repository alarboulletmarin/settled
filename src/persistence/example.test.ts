import { describe, expect, it } from 'vitest'
import { advanceStatus } from '@/domain/advance'
import { type ISODate, addMonthsToYm, endOfMonth, ymOf } from '@/domain/date'
import { debtStatus } from '@/domain/debt'
import { hasDataInYear, trailingMonths } from '@/domain/history'
import { detectPriceChange, amountOn, isCostly } from '@/domain/priceHistory'
import {
  knownSavingTotal,
  latestValuation,
  savingsBySupport,
  supportMonthFlows,
} from '@/domain/saving'
import { settleMonth, settlementBalance } from '@/domain/settle'
import { memberIncomes, memberShares, sharedEntries } from '@/domain/split'
import {
  OTHER_CATEGORY,
  breakdownByFamily,
  recurrenceTotals,
  savingCapacity,
  totalsByKind,
} from '@/domain/stats'
import {
  type CategoryKind,
  type Recurrence,
  findCategory,
  isSpending,
  kindOfCategory,
} from '@/domain/types'
import { exampleBounds, exampleData } from './example'
import { CURRENT_SCHEMA_VERSION } from './schema'
import { parseImport, serializeData } from './transfer'

/* Une date fixe : le jeu est ancré sur elle, et un test qui bougerait avec le
   calendrier ne dirait plus rien le mois suivant. Le 15 place le mois courant à
   mi-parcours — la moitié confirmée, la moitié encore prévue. */
const ON: ISODate = '2027-03-15'

const data = exampleData(ON)
const anchor = ymOf(ON)
const previous = addMonthsToYm(anchor, -1)

const kindOf = (id: string): CategoryKind => kindOfCategory(data.families, data.categories, id)
const amountOf = (recurrence: Recurrence) =>
  amountOn(recurrence, data.entries, endOfMonth(anchor))
const incomes = () => memberIncomes(data.household.members, data.recurrences, kindOf, amountOf, anchor)

describe('le jeu d’exemple', () => {
  it('s’importe tel quel, sans migration', () => {
    const result = parseImport(serializeData(data))
    expect(result.from).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.migrated).toBe(false)
  })

  /* Critère de sortie du cahier §6 : un export réimporté restitue un état
     strictement identique. L'exemple passe par la même porte que l'export. */
  it('traverse l’aller-retour sans rien perdre ni rien inventer', () => {
    expect(parseImport(serializeData(data)).data).toEqual(data)
  })

  it('rend le même document à la même date', () => {
    expect(serializeData(exampleData(ON))).toBe(serializeData(data))
  })

  it('s’ancre sur la date qu’on lui donne, pas sur le calendrier', () => {
    const later = exampleData('2028-07-09')
    const bounds = exampleBounds('2028-07-09')
    const months = later.months.map((m) => m.ym).sort()
    expect(months.at(0)).toBe(bounds.first)
    expect(months.at(-1)).toBe(bounds.last)
  })

  /* Rien n'impose l'intégrité référentielle dans l'app : un lien mort y dégrade
     en silence — une catégorie inconnue retombe sur la nature « charge », un
     membre inconnu disparaît des deux côtés d'une régularisation. Un exemple
     qui en porterait un enseignerait un document faux. */
  it('ne cite que des familles, catégories, membres et récurrences qui existent', () => {
    const families = new Set(data.families.map((f) => f.id))
    const categories = new Set(data.categories.map((c) => c.id))
    const members = new Set(data.household.members.map((m) => m.id))
    const recurrences = new Set(data.recurrences.map((r) => r.id))

    for (const category of data.categories) expect(families).toContain(category.familyId)
    for (const recurrence of data.recurrences) {
      expect(categories).toContain(recurrence.categoryId)
      if (recurrence.memberId !== undefined) expect(members).toContain(recurrence.memberId)
    }
    for (const entry of data.entries) {
      expect(categories).toContain(entry.categoryId)
      if (entry.memberId !== undefined) expect(members).toContain(entry.memberId)
      if (entry.recurrenceId !== undefined) expect(recurrences).toContain(entry.recurrenceId)
    }
    for (const debt of data.debts) {
      expect(categories).toContain(debt.categoryId)
      if (debt.recurrenceId !== undefined) expect(recurrences).toContain(debt.recurrenceId)
    }
    for (const advance of data.advances) {
      expect(categories).toContain(advance.categoryId)
      expect(members).toContain(advance.memberId)
      if (advance.recurrenceId !== undefined) expect(recurrences).toContain(advance.recurrenceId)
    }
  })

  it('n’a pas deux fois le même identifiant', () => {
    const ids = [
      ...data.household.members.map((m) => m.id),
      ...data.families.map((f) => f.id),
      ...data.categories.map((c) => c.id),
      ...data.recurrences.map((r) => r.id),
      ...data.entries.map((e) => e.id),
      ...data.debts.map((d) => d.id),
      ...data.advances.map((a) => a.id),
    ]
    expect(new Set(ids).size).toBe(ids.length)
  })
})

/* Chaque cas ci-dessous est un seuil : en dessous, un écran s'efface ou affiche
   un état vide. C'est la liste de ce que l'exemple doit contenir pour que l'app
   se montre entière, et le seul endroit où elle est vérifiée. */
describe('ce que l’exemple doit contenir pour que rien ne reste vide', () => {
  it('pose deux personnes, chacune avec un revenu lisible', () => {
    expect(data.household.members).toHaveLength(2)
    for (const income of incomes()) {
      expect(income.gap).toBeNull()
      expect(income.income).not.toBeNull()
    }
  })

  /* Les mois passés doivent être *ouverts*, pas seulement porter des entrées :
     l'app n'ouvre jamais un mois passé d'elle-même, et sans son `MonthState` un
     mois d'historique n'existe pas pour elle. Le mois à venir, lui, s'ouvre en y
     naviguant : le poser ici ne montrerait rien de plus. */
  it('ouvre seize mois, jusqu’au mois courant compris', () => {
    const { first, last } = exampleBounds(ON)
    const months = data.months.map((m) => m.ym).sort()
    expect(months.at(0)).toBe(first)
    expect(months.at(-1)).toBe(last)
    expect(last).toBe(anchor)
    const covered = new Set(data.entries.map((e) => ymOf(e.date)))
    expect(covered.size).toBeGreaterThanOrEqual(12)
  })

  it('couvre deux années civiles, pour le comparatif d’années', () => {
    const year = Number(anchor.slice(0, 4))
    expect(hasDataInYear(data.entries, year)).toBe(true)
    expect(hasDataInYear(data.entries, year - 1)).toBe(true)
  })

  it('remplit les douze points de la courbe, sans trou', () => {
    for (const point of trailingMonths(data.entries, anchor, 12)) {
      expect(point.hasData).toBe(true)
    }
  })

  it('laisse le mois courant à moitié fait — du confirmé, du prévu, un retard', () => {
    const month = data.entries.filter((e) => ymOf(e.date) === anchor)
    expect(month.some((e) => e.status === 'confirmed')).toBe(true)
    expect(month.some((e) => e.status === 'planned' && e.date > ON)).toBe(true)
    // Une échéance passée que personne n'a confirmée est la plus proche de
    // toutes : c'est le seul endroit de l'app où un retard se voit.
    expect(month.some((e) => e.status === 'planned' && e.date < ON)).toBe(true)
  })

  it('pose les cinq périodicités', () => {
    const periods = data.recurrences.map((r) => `${r.period.unit}-${String(r.period.every)}`)
    expect(periods).toContain('week-1')
    expect(periods).toContain('month-1')
    expect(periods).toContain('month-2')
    expect(periods).toContain('month-3')
    expect(periods).toContain('year-1')
  })

  it('pose une échéance au 31, qui se borne sans se reporter', () => {
    const monthly = data.recurrences.find((r) => r.period.anchorDay === 31)
    expect(monthly).toBeDefined()
    const days = data.entries
      .filter((e) => e.recurrenceId === monthly?.id)
      .map((e) => e.date.slice(5))
    expect(days).toContain('02-28')
    expect(days).toContain('03-31')
  })

  it('a une récurrence variable chiffrée, et une qui ne l’est pas encore', () => {
    const variables = data.recurrences.filter((r) => r.amount === null)
    expect(variables.some((r) => r.estimate !== undefined)).toBe(true)
    // Sans montant habituel ni échéance chiffrée : c'est ce qui fait dire
    // « montant variable » au total plutôt qu'un zéro.
    expect(recurrenceTotals(data.recurrences, amountOf, ON).unknownCount).toBeGreaterThan(0)
  })

  it('a une récurrence arrêtée, qui reste dans le document', () => {
    expect(data.recurrences.some((r) => r.endedOn !== undefined && r.endedOn < ON)).toBe(true)
  })

  it('a des charges qu’une personne règle et que le foyer partage', () => {
    const shared = data.recurrences.filter((r) => r.shared === true && r.memberId !== undefined)
    expect(shared.length).toBeGreaterThanOrEqual(2)
  })

  it('signale une charge qui monte, et se tait sur un salaire qui monte', () => {
    const costly = data.recurrences.filter((recurrence) => {
      const change = detectPriceChange(data.entries, recurrence.id)
      return change !== null && isCostly(change, recurrence.direction, kindOf(recurrence.categoryId))
    })
    const raise = data.recurrences.find((r) => r.id === 'ex-r-salaire-alix')
    const change = detectPriceChange(data.entries, raise?.id ?? '')
    expect(costly.length).toBeGreaterThan(0)
    expect(change).not.toBeNull()
    expect(isCostly(change!, 'in', 'resource')).toBe(false)
  })

  it('suit trois crédits, dont un sans taux', () => {
    expect(data.debts).toHaveLength(3)
    expect(data.debts.filter((d) => d.rateBp !== undefined)).toHaveLength(2)
    expect(data.debts.filter((d) => d.rateBp === undefined)).toHaveLength(1)
    // Tous démarrent dans l'historique : le capital ne se dérive que des
    // mensualités confirmées, et un crédit ouvert avant le document
    // annoncerait un capital qu'aucune échéance n'a amorti.
    const { first } = exampleBounds(ON)
    for (const debt of data.debts) expect(ymOf(debt.startedOn) >= first).toBe(true)
  })

  it('suit deux avances, dont une qui entre dans le pot commun', () => {
    expect(data.advances).toHaveLength(2)
    const linked = data.advances.map((a) =>
      data.recurrences.find((r) => r.id === a.recurrenceId),
    )
    expect(linked.filter((r) => r?.shared === true)).toHaveLength(1)
    // Chaque avance a posé sa reprise sur le livret, le jour du paiement.
    for (const advance of data.advances) {
      const drawdown = data.entries.find(
        (e) => e.date === advance.paidOn && e.direction === 'in' && e.amount === advance.amount,
      )
      expect(drawdown).toBeDefined()
    }
  })

  it('charge un jour assez pour que le calendrier déborde', () => {
    const perDay = new Map<string, number>()
    for (const entry of data.entries) {
      if (ymOf(entry.date) !== anchor) continue
      perDay.set(entry.date, (perDay.get(entry.date) ?? 0) + 1)
    }
    // Le calendrier ne pose que quatre pastilles, puis un « +N ».
    expect([...perDay.values()].some((count) => count > 4)).toBe(true)
  })

  it('déborde le camembert, qui ne garde que quatre familles', () => {
    const slices = breakdownByFamily(
      data.entries,
      anchor,
      (id) => findCategory(data.categories, id)?.familyId ?? '',
      (id) => isSpending(kindOf(id)),
      undefined,
      4,
    )
    expect(slices.map((s) => s.categoryId)).toContain(OTHER_CATEGORY)
  })

  it('étend le catalogue, et en archive une part', () => {
    expect(data.families.some((f) => !f.id.startsWith('fam-'))).toBe(true)
    expect(data.categories.some((c) => c.archived)).toBe(true)
  })

  it('place et reprend de l’épargne, pour qu’elle se compte en net', () => {
    const savings = data.entries.filter((e) => kindOf(e.categoryId) === 'saving')
    expect(savings.some((e) => e.direction === 'out')).toBe(true)
    expect(savings.some((e) => e.direction === 'in')).toBe(true)
  })

  it('saisit des ponctuels, que nulle règle ne pose', () => {
    const oneOffs = data.entries.filter((e) => e.recurrenceId === undefined)
    expect(oneOffs.length).toBeGreaterThan(20)
    // Une prime a lieu, mais elle ne dit rien de ce qu'on gagne : elle ne
    // déplace donc pas le prorata, et c'est ce qu'elle est là pour montrer.
    expect(oneOffs.some((e) => e.direction === 'in' && kindOf(e.categoryId) === 'resource')).toBe(
      true,
    )
  })

  it('porte une note sur chaque sorte d’objet qui en accepte une', () => {
    expect(data.recurrences.some((r) => r.note !== undefined)).toBe(true)
    expect(data.entries.some((e) => e.note !== undefined)).toBe(true)
    expect(data.debts.some((d) => d.note !== undefined)).toBe(true)
    expect(data.advances.some((a) => a.note !== undefined)).toBe(true)
  })
})

/* L'exemple s'ouvre le jour où on le charge, et ce jour peut être le 1er.
   Le mois courant n'a alors que deux ou trois échéances derrière lui : c'est
   précisément là que le jeu risque de se présenter vide, et donc là qu'il faut
   le vérifier. */
describe('quel que soit le jour où on le charge', () => {
  const days = ['01', '02', '03', '09', '15', '28']

  it.each(days)('a de quoi lire un solde le %s du mois', (day) => {
    const when = `2027-03-${day}`
    const document = exampleData(when)
    const month = document.entries.filter(
      (entry) => ymOf(entry.date) === ymOf(when) && entry.status === 'confirmed',
    )
    expect(month.length).toBeGreaterThan(0)
    // Une paie tombe en tête de mois : sans elle, le solde du mois — la tuile
    // la plus visible de l'app — annoncerait zéro les premiers jours.
    const received = month
      .filter((entry) => entry.direction === 'in')
      .reduce<number>((sum, entry) => sum + entry.amount, 0)
    expect(received).toBeGreaterThan(0)
  })

  it.each(days)('reste importable le %s du mois', (day) => {
    const when = `2027-03-${day}`
    const document = exampleData(when)
    expect(parseImport(serializeData(document)).data).toEqual(document)
  })
})

/* La vraie preuve que les écrans seront pleins : les calculs qu'ils appellent
   rendent des chiffres, et non des `null` ou des zéros. */
describe('ce que le domaine sait en tirer', () => {
  it('calcule la répartition, à des parts inégales', () => {
    const amounts = sharedEntries(data.entries, anchor, kindOf).map((e) => e.amount)
    const shares = memberShares(incomes(), amounts)
    expect(shares).not.toBeNull()
    expect(shares).toHaveLength(2)
    expect(shares![0]!.shareBp).not.toBe(shares![1]!.shareBp)
    // La somme des parts vaut exactement le total, au centime.
    const total = amounts.reduce<number>((sum, amount) => sum + amount, 0)
    expect(shares!.reduce<number>((sum, share) => sum + share.due, 0)).toBe(total)
  })

  it('reporte sur le mois courant ce que le précédent a laissé de travers', () => {
    const settlements = settleMonth(data.entries, previous, kindOf, incomes())
    expect(settlements).not.toBeNull()
    expect(settlements!.some((s) => s.adjustment !== 0)).toBe(true)
    // Ce qu'une personne verse en trop, l'autre le verse en moins.
    expect(settlementBalance(settlements!)).toBe(0)
  })

  it('amortit chaque crédit, sans le solder', () => {
    for (const debt of data.debts) {
      const status = debtStatus(debt, data.entries, null, ON)
      expect(status.payments).toBeGreaterThan(0)
      expect(status.remaining).toBeLessThan(debt.principal)
      expect(status.remaining).toBeGreaterThan(0)
      expect(status.settled).toBe(false)
    }
  })

  /* Un crédit à taux ne s'amortit pas de ce qu'on a versé : sur l'immobilier de
     l'exemple, la première année rembourse une fraction de ce qu'elle coûte. Le
     raccourci « capital moins mensualités » annoncerait le prêt soldé des années
     trop tôt, et c'est tout l'intérêt de le montrer. */
  it('montre qu’un crédit à taux amortit moins que ce qu’il coûte', () => {
    const withRate = data.debts.find((d) => d.rateBp !== undefined && d.rateBp > 300)
    const status = debtStatus(withRate!, data.entries, null, ON)
    expect(withRate!.principal - status.remaining).toBeLessThan(status.paid)
  })

  it('rembourse chaque avance en partie, jamais en entier', () => {
    for (const advance of data.advances) {
      const status = advanceStatus(advance, data.entries, ON)
      expect(status.restored).toBeGreaterThan(0)
      expect(status.remaining).toBeGreaterThan(0)
      expect(status.settled).toBe(false)
    }
  })

  it('laisse au foyer de quoi épargner, et de quoi le ventiler', () => {
    const totals = totalsByKind(data.entries, anchor, kindOf, undefined, true)
    expect(totals.resource).toBeGreaterThan(0)
    expect(totals.charge).toBeGreaterThan(0)
    expect(totals.debt).toBeGreaterThan(0)
    expect(savingCapacity(totals)).toBeGreaterThan(0)
    expect(savingsBySupport(data.entries, anchor, kindOf).length).toBeGreaterThan(1)
  })

  /* Ce que la v1 ne pouvait pas montrer : le stock, à côté du flux. Le jeu
     d'exemple doit le démontrer, pas seulement le rendre possible. */
  it('possède une épargne relevée, avec son historique', () => {
    expect(data.savingSupports.length).toBeGreaterThan(2)
    const total = knownSavingTotal(data.savingSupports, data.savingValuations, ON)
    expect(total.known).toBeGreaterThan(0)
    expect(total.unvalued).toBe(0)
    for (const support of data.savingSupports) {
      expect(latestValuation(data.savingValuations, support.id, ON)).not.toBeNull()
    }
  })

  /* Deux personnes, chacune son livret : c'est exactement ce qu'une catégorie
     seule ne pouvait pas représenter. */
  it('donne à deux personnes deux supports de même catégorie', () => {
    const passbooks = data.savingSupports.filter((s) => s.categoryId === 'passbook')
    expect(passbooks).toHaveLength(2)
    expect(new Set(passbooks.map((s) => s.memberId)).size).toBe(2)
  })

  it('relie chaque mouvement d’épargne à un support existant', () => {
    const ids = new Set(data.savingSupports.map((support) => support.id))
    const savings = data.entries.filter((entry) => kindOf(entry.categoryId) === 'saving')
    expect(savings.length).toBeGreaterThan(0)
    for (const entry of savings) {
      expect(entry.savingSupportId).toBeDefined()
      expect(ids.has(entry.savingSupportId ?? '')).toBe(true)
    }
  })

  it('fait passer chaque avance par le support qu’elle reprend', () => {
    for (const advance of data.advances) {
      expect(advance.savingSupportId).toBeDefined()
      const recurrence = data.recurrences.find((r) => r.id === advance.recurrenceId)
      expect(recurrence?.savingSupportId).toBe(advance.savingSupportId)
    }
  })

  /* Un support qui bouge sans qu'on y verse rien : le seul dont la valeur ne
     s'explique que par le marché. C'est ce qui interdit de dériver le capital
     des versements. */
  it('porte un support qui vaut quelque chose sans recevoir de versement', () => {
    const untouched = data.savingSupports.filter(
      (support) => supportMonthFlows(data.entries, support.id, anchor).net === 0,
    )
    expect(untouched.length).toBeGreaterThan(0)
    const history = data.savingValuations.filter((v) => v.supportId === untouched[0]?.id)
    expect(history.length).toBeGreaterThan(1)
    expect(new Set(history.map((v) => v.amount)).size).toBeGreaterThan(1)
  })
})
