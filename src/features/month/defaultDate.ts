import { type ISODate, type YearMonth, startOfMonth, today, ymOf } from '@/domain/date'

/**
 * La date proposée par défaut dans le formulaire d'entrée : aujourd'hui si on
 * est dans le mois affiché, sinon le premier du mois affiché. Partagée par
 * l'écran du mois et le calendrier, qui ouvrent la même feuille.
 */
export function defaultDateFor(ym: YearMonth): ISODate {
  const now = today()
  return ymOf(now) === ym ? now : startOfMonth(ym)
}
