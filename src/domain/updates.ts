/* ============================================================================
 * Mutations du document — fonctions pures `Data → Data`.
 *
 * Le store ne fait que les appliquer : c'est ici, et nulle part dans un
 * composant, que vivent les règles (une récurrence supprimée mais déjà
 * confirmée est arrêtée, pas effacée ; un membre retiré libère ses entrées).
 * ==========================================================================*/

import { type ISODate, type YearMonth, today, ymOf } from './date'
import { buildPlannedEntry, planMonth } from './month'
import type { Category, Data, Debt, Entry, Family, Member, Recurrence, Settings } from './types'

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

/** Retirer un membre libère ses entrées et récurrences plutôt que de les perdre. */
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
 * Un abonnement est une règle, une échéance est un fait : c'est la règle qui
 * fabrique les faits, donc la changer doit refaire ceux qui n'ont pas encore
 * eu lieu. Les prévues à venir sont jetées puis régénérées — leur date, leur
 * montant ou leur libellé peuvent tous avoir bougé.
 *
 * Une échéance déjà confirmée mais **datée dans le futur** est requalifiée sans
 * être refaite : confirmer d'avance dit qu'elle aura lieu, pas qu'elle a eu
 * lieu, et la règle du cahier §3 — « une `Entry` confirmée s'en détache, elle a
 * eu lieu » — ne s'applique donc pas encore. Sans cela, un foyer qui valide son
 * mois à venir ne peut plus corriger l'abonnement qui l'a produit : le membre
 * change sur la règle, et chaque graphique continue de lire l'ancien.
 *
 * Le passé, lui, ne bouge pas : ni ce qui est daté d'aujourd'hui ou d'avant, ni
 * le montant, la date ou le statut d'une confirmée — ceux-là ont pu être saisis
 * à la main, et les réécrire perdrait la saisie.
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

  const kept = data.entries.filter(
    (entry) =>
      !(
        entry.recurrenceId === recurrenceId &&
        entry.status === 'planned' &&
        ymOf(entry.date) >= fromMonth
      ),
  )

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

  return next
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
 * Supprime une récurrence. Si des échéances ont déjà été confirmées, elle est
 * arrêtée au lieu d'être effacée — l'historique ne se réécrit pas (cahier §3).
 */
export function removeRecurrence(data: Data, id: string, on: ISODate = today()): Data {
  const hasConfirmed = data.entries.some((e) => e.recurrenceId === id && e.status === 'confirmed')
  if (hasConfirmed) return stopRecurrence(data, id, on)
  return {
    ...data,
    recurrences: data.recurrences.filter((r) => r.id !== id),
    entries: data.entries.filter((e) => e.recurrenceId !== id),
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
 * saisit nulle part, et le perdre couperait l'échéance de son abonnement, donc
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
 * Sert à la saisie qui pose l'abonnement et la dépense du jour d'un seul geste :
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
): Data {
  const existing = data.entries.find((e) => e.recurrenceId === recurrenceId && e.date === date)
  if (existing !== undefined) return confirmEntry(data, existing.id)

  const recurrence = data.recurrences.find((r) => r.id === recurrenceId)
  if (recurrence === undefined) return data

  const entry = buildPlannedEntry(recurrence, date, data.entries, makeId)
  return addEntry(data, { ...entry, status: 'confirmed' })
}

/** Confirmation en bloc — le geste du cahier §4.3. */
export function confirmEntries(data: Data, ids: readonly string[]): Data {
  const set = new Set(ids)
  return {
    ...data,
    entries: data.entries.map((e) => (set.has(e.id) ? { ...e, status: 'confirmed' } : e)),
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
