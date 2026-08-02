import { money } from '@/domain/money'

/**
 * Les chiffres de la présentation. En dur, et non tirés de
 * `persistence/example.ts` : ce module vaut une vingtaine de kilo-octets qu'on
 * charge à la demande précisément pour que le démarrage ne les porte pas — et
 * la présentation *est* le démarrage. Six montants n'en valent pas le prix.
 *
 * Ils décrivent un foyer cohérent, et pas six valeurs prises au hasard : 1 820 €
 * de mois prévu dont 1 240 € déjà confirmés, une capacité d'épargne qui est bien
 * ce qui reste avant versement, et deux parts qui font 100. Une grille dont les
 * chiffres ne se recomposent pas se lit comme une erreur — c'est vrai du vrai
 * tableau de bord, ça l'est encore plus de celui qui sert à le présenter.
 *
 * `landing.sample` le dit sous la grille, en toutes lettres : ces chiffres sont
 * ceux d'un exemple. Un écran de démonstration qui ne se déclare pas est un
 * écran qui ment.
 */
export const SAMPLE = {
  /** Confirmé sur prévu — la jauge de l'anneau, et le chiffre en son centre. */
  monthConfirmed: money(124_000),
  monthForecast: money(182_000),
  monthRatio: 0.68,

  /** Deux membres, deux parts au prorata des revenus. Elles font 100. */
  shares: [
    { id: 'a', label: 'Alix', percent: 62, color: 'var(--member-1)' },
    { id: 'b', label: 'Camille', percent: 38, color: 'var(--member-2)' },
  ],

  savingCapacity: money(64_000),
  debtRemaining: money(8_742_000),
} as const
