/* ============================================================================
 * Mutations du document — fonctions pures `Data → Data`.
 *
 * Le store ne fait que les appliquer : c'est ici, et nulle part dans un
 * composant, que vivent les règles (une récurrence supprimée laisse derrière
 * elle ses échéances confirmées ; un membre retiré libère ses entrées).
 * ==========================================================================*/

import { monthlyInstalment } from './advance'
import { type ISODate, type YearMonth, endOfMonth, parseISO, startOfMonth, today, ymOf } from './date'
import { type Money, ZERO } from './money'
import { buildPlannedEntry, planMonth } from './month'
import type {
  Advance,
  Category,
  Data,
  Debt,
  Entry,
  Family,
  Member,
  Recurrence,
  Settings,
} from './types'

/* --- Foyer et membres -----------------------------------------------------*/

export function setHouseholdName(data: Data, name: string): Data {
  return { ...data, household: { ...data.household, name } }
}

export function addMember(data: Data, member: Member): Data {
  return { ...data, household: { ...data.household, members: [...data.household.members, member] } }
}

export function renameMember(data: Data, id: string, name: string): Data {
  return {
    ...data,
    household: {
      ...data.household,
      members: data.household.members.map((m) => (m.id === id ? { ...m, name } : m)),
    },
  }
}

/**
 * Retirer un membre libère ses entrées et récurrences plutôt que de les perdre.
 *
 * Ses **avances**, elles, partent avec lui, et c'est la seule exception :
 * `Advance.memberId` n'est pas facultatif — une épargne est toujours à
 * quelqu'un, et une avance que personne ne porte ne se reconstitue sur le
 * livret de personne. Faute de pouvoir la détacher, on la retirait de fait sans
 * le faire : l'avance gardait l'identifiant d'un membre disparu, et l'écran
 * d'épargne cherchait un porteur qu'il ne trouvait plus.
 *
 * Sa récurrence reste, comme après `removeAdvance` : les mensualités déjà
 * revenues sur le livret y sont revenues, et cesser de suivre ce qu'on se doit
 * ne réécrit pas ce qui est sorti du compte. Elle est simplement rendue au
 * foyer, comme toutes les autres. La confirmation le dit avant, parce que c'est
 * la seule chose que ce geste efface.
 */
export function removeMember(data: Data, id: string): Data {
  const strip = <T extends { memberId?: string }>(item: T): T => {
    if (item.memberId !== id) return item
    const { memberId: _dropped, ...rest } = item
    return rest as T
  }
  return {
    ...data,
    household: { ...data.household, members: data.household.members.filter((m) => m.id !== id) },
    recurrences: data.recurrences.map(strip),
    entries: data.entries.map(strip),
    advances: data.advances.filter((a) => a.memberId !== id),
  }
}

/* --- Catégories -----------------------------------------------------------*/

export function addCategory(data: Data, category: Category): Data {
  return { ...data, categories: [...data.categories, category] }
}

export function updateCategory(data: Data, id: string, patch: Partial<Category>): Data {
  return {
    ...data,
    categories: data.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }
}

/** Une catégorie n'est jamais effacée : elle est archivée, les entrées restent. */
export function archiveCategory(data: Data, id: string, archived = true): Data {
  return updateCategory(data, id, { archived })
}

/* --- Familles -------------------------------------------------------------*/

export function addFamily(data: Data, family: Family): Data {
  return { ...data, families: [...data.families, family] }
}

export function renameFamily(data: Data, id: string, label: string): Data {
  return {
    ...data,
    families: data.families.map((f) => (f.id === id ? { ...f, label } : f)),
  }
}

/* --- Crédits --------------------------------------------------------------*/

export function addDebt(data: Data, debt: Debt): Data {
  return { ...data, debts: [...data.debts, debt] }
}

export function updateDebt(data: Data, id: string, patch: Partial<Debt>): Data {
  return { ...data, debts: data.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }
}

/**
 * Réécrit un crédit de bout en bout — même raison que `replaceRecurrence` :
 * sans cela, détacher la mensualité, remettre le taux à zéro ou vider la note
 * n'a aucun effet.
 */
export function replaceDebt(data: Data, id: string, next: Omit<Debt, 'id'>): Data {
  return { ...data, debts: data.debts.map((d) => (d.id === id ? { ...next, id } : d)) }
}

/**
 * Supprime le crédit, jamais sa récurrence ni ses échéances : les mensualités
 * déjà versées ont eu lieu. Cesser de suivre un capital ne réécrit pas ce qui
 * est sorti du compte.
 */
export function removeDebt(data: Data, id: string): Data {
  return { ...data, debts: data.debts.filter((d) => d.id !== id) }
}

/* --- Avances --------------------------------------------------------------*/

export function addAdvance(data: Data, advance: Advance): Data {
  return { ...data, advances: [...data.advances, advance] }
}

/** Réécrit une avance de bout en bout — même raison que `replaceDebt`. */
export function replaceAdvance(data: Data, id: string, next: Omit<Advance, 'id'>): Data {
  return { ...data, advances: data.advances.map((a) => (a.id === id ? { ...next, id } : a)) }
}

/**
 * Supprime l'avance, jamais sa récurrence ni ses échéances : ce qui est déjà
 * revenu sur le livret y est revenu. Cesser de suivre ce qu'on se doit ne
 * réécrit pas ce qui est sorti du compte.
 */
export function removeAdvance(data: Data, id: string): Data {
  return { ...data, advances: data.advances.filter((a) => a.id !== id) }
}

/** Ce qu'un écran a à dire pour poser une avance. Le reste s'en déduit. */
export type AdvanceInput = Omit<Advance, 'id' | 'recurrenceId'> & {
  /** Le support d'épargne repris, puis reconstitué. */
  savingCategoryId: string
  /** La charge avancée entre-t-elle dans le pot commun du foyer ? */
  shared?: boolean
}

/**
 * Traduit une avance en ce qu'elle est vraiment : une reprise sur le livret, et
 * la récurrence qui l'y remet mois après mois.
 *
 * Les trois écritures tiennent dans une seule mutation — donc un seul rendu,
 * une seule sauvegarde — et surtout la reprise ne peut pas rester seule si la
 * récurrence échouait : une épargne qu'on a prise sans jamais la rendre est
 * exactement le trou que cet écran existe pour éviter.
 *
 * La reprise part **confirmée** : elle a eu lieu, c'est même tout le propos —
 * l'argent est déjà sorti du livret. Elle entre en sens `in` parce que c'est ce
 * qu'elle est du point de vue du foyer, de l'argent qui revient de l'épargne
 * vers ce qu'on peut dépenser. La dépense qu'elle a financée, elle, se saisit
 * comme n'importe quelle autre — l'app ne l'invente pas à la place de qui l'a
 * faite.
 *
 * La règle vit ici, dans le domaine, et non dans l'action qui l'appelait :
 * l'écran de saisie n'est plus le seul à poser des avances, et deux copies de
 * cette composition finiraient par ne plus se répondre.
 *
 * Et c'est bien pour ça que la période se contrôle ici : le formulaire le
 * faisait déjà, mais il n'est plus le seul appelant. Une période à l'envers
 * pose une récurrence qui se termine avant sa première mensualité — l'avance
 * ne se reconstitue alors jamais, et son reste dû ne bouge plus d'un centime
 * sans que rien à l'écran n'explique pourquoi. On lève plutôt qu'on corrige :
 * il n'existe aucune façon de deviner laquelle des deux bornes est la bonne.
 */
export function createAdvance(
  data: Data,
  input: AdvanceInput,
  makeId: () => string,
  on: ISODate = today(),
): { data: Data; advance: Advance } {
  const { savingCategoryId, shared, ...rest } = input
  if (rest.to < rest.from) {
    throw new RangeError(
      `Une avance ne peut pas se terminer avant de commencer : ${rest.from} → ${rest.to}`,
    )
  }
  const recurrence: Recurrence = {
    id: makeId(),
    label: rest.label,
    categoryId: savingCategoryId,
    memberId: rest.memberId,
    direction: 'out',
    amount: monthlyInstalment(rest),
    period: { unit: 'month', every: 1, anchorDay: parseISO(rest.paidOn).d },
    startedOn: startOfMonth(rest.from),
    endedOn: endOfMonth(rest.to),
    ...(shared === undefined ? {} : { shared }),
  }
  const advance: Advance = { ...rest, id: makeId(), recurrenceId: recurrence.id }
  const drawdown: Entry = {
    id: makeId(),
    label: rest.label,
    categoryId: savingCategoryId,
    memberId: rest.memberId,
    direction: 'in',
    amount: rest.amount,
    date: rest.paidOn,
    status: 'confirmed',
  }

  return {
    data: addAdvance(
      addEntry(
        syncRecurrenceEntries(addRecurrence(data, recurrence), recurrence.id, makeId, on),
        drawdown,
      ),
      advance,
    ),
    advance,
  }
}

/* --- Récurrences ----------------------------------------------------------*/

export function addRecurrence(data: Data, recurrence: Recurrence): Data {
  return { ...data, recurrences: [...data.recurrences, recurrence] }
}

export function updateRecurrence(data: Data, id: string, patch: Partial<Recurrence>): Data {
  return {
    ...data,
    recurrences: data.recurrences.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  }
}

/**
 * Réécrit une récurrence de bout en bout, son identifiant mis à part.
 *
 * Un formulaire n'envoie pas un correctif, il envoie l'état complet de ce qu'il
 * montre : ce qui n'y figure pas, l'utilisateur l'a vidé. Une fusion —
 * `{ ...r, ...patch }` — ne sait pas distinguer « inchangé » d'« effacé », et
 * garde donc en place le membre qu'on vient de remettre à « tout le foyer » ou
 * la case « à partager » qu'on vient de rendre à la règle. L'écran annonce alors
 * une modification que le document n'a pas prise. La réécriture, elle, efface ce
 * qui a été effacé.
 */
export function replaceRecurrence(data: Data, id: string, next: Omit<Recurrence, 'id'>): Data {
  return {
    ...data,
    recurrences: data.recurrences.map((r) => (r.id === id ? { ...next, id } : r)),
  }
}

/**
 * Recolle une échéance sur la règle qui l'a posée : sous quel libellé et quelle
 * catégorie elle se lit, dans quel sens, à qui elle est et si elle se partage.
 *
 * Tout le reste lui appartient — son montant, sa date, son statut, sa note :
 * ce sont les seuls champs qu'une échéance peut porter contre sa règle, et les
 * réécrire effacerait une saisie.
 */
function requalify(entry: Entry, recurrence: Recurrence): Entry {
  const { memberId: _member, shared: _shared, ...rest } = entry
  return {
    ...rest,
    label: recurrence.label,
    categoryId: recurrence.categoryId,
    direction: recurrence.direction,
    ...(recurrence.memberId === undefined ? {} : { memberId: recurrence.memberId }),
    ...(recurrence.shared === undefined ? {} : { shared: recurrence.shared }),
  }
}

/**
 * Réaligne les échéances d'une récurrence sur sa définition courante, dans
 * tous les mois déjà ouverts à partir de `from`.
 *
 * Une récurrence est une règle, une échéance est un fait : c'est la règle qui
 * fabrique les faits, donc la changer doit refaire ceux qui n'ont pas encore
 * eu lieu. Les prévues à venir sont jetées puis régénérées — leur date, leur
 * montant ou leur libellé peuvent tous avoir bougé.
 *
 * Une échéance déjà confirmée mais **datée dans le futur** est requalifiée sans
 * être refaite : confirmer d'avance dit qu'elle aura lieu, pas qu'elle a eu
 * lieu, et la règle du cahier §3 — « une `Entry` confirmée s'en détache, elle a
 * eu lieu » — ne s'applique donc pas encore. Sans cela, un foyer qui valide son
 * mois à venir ne peut plus corriger la récurrence qui l'a produit : le membre
 * change sur la règle, et chaque graphique continue de lire l'ancien.
 *
 * Le passé, lui, ne bouge pas : ni ce qui est daté d'aujourd'hui ou d'avant, ni
 * le montant, la date ou le statut d'une confirmée — ceux-là ont pu être saisis
 * à la main, et les réécrire perdrait la saisie.
 *
 * **Le montant d'une prévue déjà datée survit à la régénération**, et c'est la
 * même règle vue d'un autre côté. Une prévue peut porter un montant saisi à la
 * main : `/depense/:id` conserve le statut de l'échéance qu'on y ouvre, donc
 * corriger le montant d'une prévue l'enregistre sans la confirmer. Le tour
 * jette-puis-refait ne pouvait pas le relire — l'entrée venait d'être retirée,
 * et `amountOn` n'avait plus rien à lire —, si bien que modifier la règle
 * remettait à l'écran le montant de la règle, silencieusement. Les prévues
 * **à venir**, elles, se refont entièrement : là, c'est bien la règle qui dit
 * ce qui va tomber.
 *
 * Rejouer l'opération ne duplique rien : `planMonth` reconnaît une échéance
 * déjà posée à sa paire récurrence + date.
 */
export function syncRecurrenceEntries(
  data: Data,
  recurrenceId: string,
  makeId: () => string,
  from: ISODate = today(),
): Data {
  const fromMonth = ymOf(from)
  const recurrence = data.recurrences.find((r) => r.id === recurrenceId)

  const dropped = data.entries.filter(
    (entry) =>
      entry.recurrenceId === recurrenceId &&
      entry.status === 'planned' &&
      ymOf(entry.date) >= fromMonth,
  )
  const kept = data.entries.filter((entry) => !dropped.includes(entry))

  /* Ce qu'on retient des prévues qu'on vient de jeter : leur montant, à leur
     date, tant qu'elles ne sont pas à venir. Un zéro ne compte pas — c'est
     l'emplacement vide que l'ouverture du mois pose sur un montant variable,
     pas un montant saisi (même lecture que `knownAmount`). */
  const savedAmounts = new Map<ISODate, Money>()
  for (const entry of dropped) {
    if (entry.date > from || entry.amount === ZERO) continue
    savedAmounts.set(entry.date, entry.amount)
  }

  let next: Data = {
    ...data,
    entries:
      recurrence === undefined
        ? kept
        : kept.map((entry) =>
            entry.recurrenceId === recurrenceId && entry.date > from
              ? requalify(entry, recurrence)
              : entry,
          ),
  }

  for (const state of data.months) {
    if (state.ym < fromMonth) continue
    // `planMonth` lit `next.entries`, qui s'enrichit à chaque tour : les mois
    // se plannifient en cascade sans se marcher dessus.
    next = { ...next, entries: [...next.entries, ...planMonth(next, state.ym, makeId).created] }
  }

  // Le montant rendu à l'échéance qui le portait, une fois refaite. Après la
  // régénération, parce qu'il n'y avait rien à qui le rendre avant elle.
  if (savedAmounts.size === 0) return next
  return {
    ...next,
    entries: next.entries.map((entry) =>
      entry.recurrenceId === recurrenceId && entry.status === 'planned'
        ? { ...entry, amount: savedAmounts.get(entry.date) ?? entry.amount }
        : entry,
    ),
  }
}

/**
 * Arrête une récurrence à une date donnée et retire les échéances seulement
 * prévues qui tombent après. Les confirmées restent : elles ont eu lieu.
 */
export function stopRecurrence(data: Data, id: string, on: ISODate): Data {
  return {
    ...data,
    recurrences: data.recurrences.map((r) => (r.id === id ? { ...r, endedOn: on } : r)),
    entries: data.entries.filter(
      (e) => !(e.recurrenceId === id && e.status === 'planned' && e.date > on),
    ),
  }
}

/** Relance une récurrence arrêtée en retirant sa date de fin. */
export function resumeRecurrence(data: Data, id: string): Data {
  return {
    ...data,
    recurrences: data.recurrences.map((r) => {
      if (r.id !== id) return r
      const { endedOn: _dropped, ...rest } = r
      return rest
    }),
  }
}

/**
 * Supprime une récurrence, et la supprime vraiment.
 *
 * Supprimer et arrêter sont deux gestes distincts (cahier §4.2), et rabattre le
 * premier sur le second dès qu'une échéance avait été confirmée rendait la
 * suppression inatteignable : la règle restait dans la liste, sous « Arrêtée »,
 * pendant que le message annonçait qu'elle était supprimée.
 *
 * L'historique ne se réécrit pas pour autant. Les échéances déjà confirmées ont
 * eu lieu : elles restent, simplement **détachées** de la règle qui les avait
 * posées. Les prévues, elles, partent avec — une échéance prévue n'est qu'une
 * projection de la règle, et sans règle elle ne projette plus rien.
 *
 * Un crédit ou une avance qui pointait sur elle voit son lien retiré, pas son
 * suivi supprimé : `useDebtStatuses` lirait sinon la mensualité d'une règle
 * disparue, donc `null`, sans que rien ne dise pourquoi.
 */
export function removeRecurrence(data: Data, id: string): Data {
  const detach = (entry: Entry): Entry => {
    if (entry.recurrenceId !== id) return entry
    const { recurrenceId: _dropped, ...rest } = entry
    return rest
  }
  const unlink = <T extends { recurrenceId?: string }>(item: T): T => {
    if (item.recurrenceId !== id) return item
    const { recurrenceId: _dropped, ...rest } = item
    return rest as T
  }
  return {
    ...data,
    recurrences: data.recurrences.filter((r) => r.id !== id),
    entries: data.entries
      .filter((e) => !(e.recurrenceId === id && e.status === 'planned'))
      .map(detach),
    debts: data.debts.map(unlink),
    advances: data.advances.map(unlink),
  }
}

/* --- Entrées --------------------------------------------------------------*/

export function addEntry(data: Data, entry: Entry): Data {
  return { ...data, entries: [...data.entries, entry] }
}

export function updateEntry(data: Data, id: string, patch: Partial<Entry>): Data {
  return { ...data, entries: data.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }
}

/**
 * Réécrit une entrée de bout en bout — même raison que `replaceRecurrence` :
 * un champ vidé dans le formulaire doit disparaître du document.
 *
 * Le lien vers la récurrence qui l'a posée survit à la réécriture : il ne se
 * saisit nulle part, et le perdre couperait l'échéance de sa récurrence, donc
 * l'historique de prix et l'amortissement d'un crédit avec elle.
 */
export function replaceEntry(
  data: Data,
  id: string,
  next: Omit<Entry, 'id' | 'recurrenceId'>,
): Data {
  return {
    ...data,
    entries: data.entries.map((e) =>
      e.id === id
        ? {
            ...next,
            id,
            ...(e.recurrenceId === undefined ? {} : { recurrenceId: e.recurrenceId }),
          }
        : e,
    ),
  }
}

export function removeEntry(data: Data, id: string): Data {
  return { ...data, entries: data.entries.filter((e) => e.id !== id) }
}

export function confirmEntry(data: Data, id: string): Data {
  return updateEntry(data, id, { status: 'confirmed' })
}

/**
 * Marque comme payée l'échéance d'une récurrence à une date donnée.
 *
 * Sert à la saisie qui pose la récurrence et la dépense du jour d'un seul geste :
 * l'utilisateur a dit que celle-là a eu lieu, on ne la lui redemande pas.
 *
 * L'échéance existe presque toujours — `syncRecurrenceEntries` vient de la
 * poser. Presque : une date antérieure au mois courant tombe dans un mois qui
 * n'a jamais été ouvert, et n'a donc rien produit. Elle est alors créée, déjà
 * confirmée, plutôt que perdue — c'est une dépense qui a eu lieu, et ouvrir le
 * mois pour la retrouver inventerait toutes les autres au passage (cahier §4.3).
 */
export function confirmOccurrence(
  data: Data,
  recurrenceId: string,
  date: ISODate,
  makeId: () => string,
  amount?: Money,
): Data {
  /* Le montant payé, quand l'appelant le connaît. Il ne se déduit pas toujours
     de la règle : une récurrence à montant variable n'en porte aucun, et
     l'échéance partait donc confirmée à zéro — annoncée « payée », pour rien.
     C'est précisément le cas de la saisie qui pose la règle et la dépense du
     jour d'un seul geste : là, le montant vient d'être saisi. */
  const paid = { status: 'confirmed' as const, ...(amount === undefined ? {} : { amount }) }

  const existing = data.entries.find((e) => e.recurrenceId === recurrenceId && e.date === date)
  if (existing !== undefined) return updateEntry(data, existing.id, paid)

  const recurrence = data.recurrences.find((r) => r.id === recurrenceId)
  if (recurrence === undefined) return data

  const entry = buildPlannedEntry(recurrence, date, data.entries, makeId)
  return addEntry(data, { ...entry, ...paid })
}

/** Confirmation en bloc — le geste du cahier §4.3. */
export function confirmEntries(data: Data, ids: readonly string[]): Data {
  const set = new Set(ids)
  return {
    ...data,
    entries: data.entries.map((e) => (set.has(e.id) ? { ...e, status: 'confirmed' } : e)),
  }
}

/**
 * Le geste inverse : des échéances confirmées redeviennent prévues.
 *
 * Confirmer n'a jamais eu à être un aller simple. Une case cochée d'un doigt de
 * trop laissait l'écran sans aucun retour, et il fallait supprimer la ligne
 * pour la retrouver — ce qui n'est pas la même chose, et perd son montant.
 *
 * Seules les échéances de récurrence font demi-tour : une saisie ponctuelle est
 * un fait, pas une prévision en attente. Le montant, lui, ne bouge pas — c'est
 * peut-être celui d'une échéance variable, saisi à la main, et le rendre à la
 * règle perdrait la saisie ; reconfirmer le retrouve tel quel.
 *
 * À savoir : redevenue prévue, une échéance repasse sous la coupe de
 * `syncRecurrenceEntries`, qui jette et refait les prévues dès qu'on touche à
 * la règle. Le montant d'une prévue **déjà datée** y survit désormais — c'est
 * la même raison qui le protège ici et là, il a pu être saisi à la main. Celui
 * d'une prévue **à venir**, non : là, c'est bien la règle qui dit ce qui va
 * tomber, et une échéance qu'on déconfirme pour le mois prochain se remet à en
 * dépendre.
 */
export function unconfirmEntries(data: Data, ids: readonly string[]): Data {
  const set = new Set(ids)
  return {
    ...data,
    entries: data.entries.map((e) =>
      set.has(e.id) && e.recurrenceId !== undefined ? { ...e, status: 'planned' } : e,
    ),
  }
}

/* --- Mois -----------------------------------------------------------------*/

export type OpenMonthResult = { data: Data; created: number; variable: number }

/**
 * Ouvre un mois : génère les échéances manquantes et enregistre l'ouverture.
 * Rejouable — rien n'est dupliqué (cahier §4.3).
 */
export function openMonth(
  data: Data,
  ym: YearMonth,
  makeId: () => string,
  on: ISODate = today(),
): OpenMonthResult {
  const plan = planMonth(data, ym, makeId)
  const months = data.months.some((m) => m.ym === ym)
    ? data.months
    : [...data.months, { ym, openedAt: on, closed: false }]

  return {
    data: { ...data, entries: [...data.entries, ...plan.created], months },
    created: plan.created.length,
    variable: plan.variable.length,
  }
}

/* --- Réglages -------------------------------------------------------------*/

export function updateSettings(data: Data, patch: Partial<Settings>): Data {
  return { ...data, settings: { ...data.settings, ...patch } }
}
