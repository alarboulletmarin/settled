/* ============================================================================
 * Validation d'un document venu du disque.
 *
 * Une donnée illisible est écartée plutôt que corrigée au jugé : un montant
 * fractionnaire ou une date invalide feraient dérailler tout le domaine.
 * Ce qui est simplement absent, en revanche, reprend sa valeur par défaut.
 * ==========================================================================*/

import { isValidISO, today } from '@/domain/date'
import { isMoney, type Money } from '@/domain/money'
import type {
  Category,
  Data,
  Direction,
  Entry,
  Member,
  MonthState,
  Period,
  PeriodUnit,
  Recurrence,
  Settings,
  ThemeSetting,
} from '@/domain/types'
import { CURRENT_SCHEMA_VERSION } from './schema'

type Raw = Record<string, unknown>

const isRecord = (v: unknown): v is Raw =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown, fallback: string): string =>
  typeof v === 'string' && v.length > 0 ? v : fallback

const optionalStr = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)

const int = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isInteger(v) ? v : fallback

const direction = (v: unknown): Direction => (v === 'in' ? 'in' : 'out')

const isoDate = (v: unknown, fallback: string): string =>
  typeof v === 'string' && isValidISO(v) ? v : fallback

const array = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

function moneyOrNull(v: unknown): Money | null {
  return isMoney(v) ? v : null
}

/* --- Entités --------------------------------------------------------------*/

function member(raw: unknown, index: number): Member | null {
  if (!isRecord(raw)) return null
  return {
    id: str(raw['id'], `member-${String(index)}`),
    name: str(raw['name'], '—'),
    color: str(raw['color'], 'var(--cat-1)'),
  }
}

function category(raw: unknown, index: number): Category | null {
  if (!isRecord(raw)) return null
  return {
    id: str(raw['id'], `category-${String(index)}`),
    label: str(raw['label'], '—'),
    icon: str(raw['icon'], ''),
    color: str(raw['color'], 'var(--cat-1)'),
    direction: direction(raw['direction']),
    archived: bool(raw['archived'], false),
  }
}

function period(raw: unknown): Period {
  const source = isRecord(raw) ? raw : {}
  const unit = source['unit']
  const known: PeriodUnit = unit === 'week' || unit === 'year' ? unit : 'month'
  const every = int(source['every'], 1)
  return {
    unit: known,
    every: every > 0 ? every : 1,
    anchorDay: int(source['anchorDay'], 1),
  }
}

function recurrence(raw: unknown, index: number): Recurrence | null {
  if (!isRecord(raw)) return null
  const startedOn = isoDate(raw['startedOn'], today())
  const endedOn = typeof raw['endedOn'] === 'string' && isValidISO(raw['endedOn'])
    ? raw['endedOn']
    : undefined
  const memberId = optionalStr(raw['memberId'])
  const note = optionalStr(raw['note'])
  return {
    id: str(raw['id'], `recurrence-${String(index)}`),
    label: str(raw['label'], '—'),
    categoryId: str(raw['categoryId'], ''),
    ...(memberId === undefined ? {} : { memberId }),
    direction: direction(raw['direction']),
    amount: moneyOrNull(raw['amount']),
    period: period(raw['period']),
    startedOn,
    ...(endedOn === undefined ? {} : { endedOn }),
    ...(note === undefined ? {} : { note }),
  }
}

/** Une entrée dont le montant ou la date est illisible est écartée. */
function entry(raw: unknown, index: number): Entry | null {
  if (!isRecord(raw)) return null
  if (!isMoney(raw['amount'])) return null
  if (typeof raw['date'] !== 'string' || !isValidISO(raw['date'])) return null

  const recurrenceId = optionalStr(raw['recurrenceId'])
  const memberId = optionalStr(raw['memberId'])
  const note = optionalStr(raw['note'])
  return {
    id: str(raw['id'], `entry-${String(index)}`),
    ...(recurrenceId === undefined ? {} : { recurrenceId }),
    label: str(raw['label'], '—'),
    categoryId: str(raw['categoryId'], ''),
    ...(memberId === undefined ? {} : { memberId }),
    direction: direction(raw['direction']),
    amount: raw['amount'],
    date: raw['date'],
    status: raw['status'] === 'confirmed' ? 'confirmed' : 'planned',
    ...(note === undefined ? {} : { note }),
  }
}

function monthState(raw: unknown): MonthState | null {
  if (!isRecord(raw)) return null
  if (typeof raw['ym'] !== 'string' || !/^\d{4}-\d{2}$/.test(raw['ym'])) return null
  return {
    ym: raw['ym'],
    openedAt: isoDate(raw['openedAt'], today()),
    closed: bool(raw['closed'], false),
  }
}

function settings(raw: unknown): Settings {
  const source = isRecord(raw) ? raw : {}
  const theme = source['theme']
  const known: ThemeSetting = theme === 'light' || theme === 'dark' ? theme : 'system'
  const startsOn = int(source['monthStartsOn'], 1)
  return {
    theme: known,
    currency: str(source['currency'], 'EUR'),
    monthStartsOn: startsOn >= 1 && startsOn <= 28 ? startsOn : 1,
  }
}

/* --- Document -------------------------------------------------------------*/

function compact<T>(items: unknown[], parse: (raw: unknown, index: number) => T | null): T[] {
  const parsed: T[] = []
  items.forEach((item, index) => {
    const value = parse(item, index)
    if (value !== null) parsed.push(value)
  })
  return parsed
}

/** Met un document brut en forme. Ne lève jamais : il rend toujours un Data. */
export function normalizeData(raw: unknown): Data {
  const source = isRecord(raw) ? raw : {}
  const household = isRecord(source['household']) ? source['household'] : {}

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    household: {
      name: str(household['name'], 'Maison'),
      members: compact(array(household['members']), member),
    },
    categories: compact(array(source['categories']), category),
    recurrences: compact(array(source['recurrences']), recurrence),
    entries: compact(array(source['entries']), entry),
    months: compact(array(source['months']), monthState),
    settings: settings(source['settings']),
  }
}
