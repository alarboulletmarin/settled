import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { MonthPoint } from '@/domain/history'
import { money } from '@/domain/money'
import { formatMoney, tpl } from '@/i18n/format'
import { fr } from '@/i18n/fr'
import { MonthlyBars } from './MonthlyBars'

/* Les attentes passent par les formateurs plutôt que par des chaînes écrites à
   la main : l'espace fine insécable devant le symbole est la règle de
   `format.ts`, qui a ses propres tests. Ce qu'on vérifie ici, c'est quel
   montant l'axe montre, pas comment il l'écrit. */
const euros = (cents: number): string => formatMoney(money(cents), 'EUR', false)

function point(ym: string, values: { in: number; out: number } | null): MonthPoint {
  if (values === null) {
    return { ym, in: money(0), out: money(0), balance: money(0), hasData: false }
  }
  return {
    ym,
    in: money(values.in),
    out: money(values.out),
    balance: money(values.in - values.out),
    hasData: true,
  }
}

const SERIE: MonthPoint[] = [
  point('2026-01', { in: 200_000, out: 150_000 }),
  point('2026-02', { in: 180_000, out: 190_000 }),
  point('2026-03', null),
]

const draw = (points: MonthPoint[] = SERIE) =>
  render(<MonthlyBars points={points} label="Douze derniers mois" srText="Solde mensuel : …" />)

const ticks = (): string[] =>
  [...document.querySelectorAll('.t-axis.absolute')].map((t) => t.textContent ?? '')

describe('MonthlyBars', () => {
  /* L'axe manquait tout à fait : connaître un mois se faisait en devinant la
     hauteur d'une barre. */
  it('pose trois graduations, le pic en haut et son opposé en bas', () => {
    draw()
    expect(ticks()).toEqual([euros(200_000), euros(0), euros(-200_000)])
  })

  /* Sans pic, les trois graduations diraient trois fois zéro à trois hauteurs
     différentes. */
  it('n’en pose qu’une quand tout est à zéro', () => {
    draw([point('2026-01', { in: 0, out: 0 })])
    expect(ticks()).toEqual([euros(0)])
  })

  /* Le dernier mois qu'on ait quelque chose à dire, et non le dernier de la
     série : la lecture ouvrirait sinon sur trois tirets. */
  it('lit par défaut le dernier mois qui porte des données', () => {
    draw()
    expect(screen.getByText('février 2026')).toBeInTheDocument()
  })

  it('lit le mois désigné', () => {
    draw()
    fireEvent.pointerOver(screen.getAllByRole('option')[0] as HTMLElement)
    expect(screen.getByText('janvier 2026')).toBeInTheDocument()
  })

  /* Cahier §4.7 : une période sans donnée n'est pas une période à zéro. Elle se
     dit, dans le nom accessible comme dans la lecture visible. */
  it('dit « aucune donnée » plutôt qu’un zéro sur un mois vide', () => {
    draw()
    const vide = screen.getAllByRole('option')[2] as HTMLElement
    expect(vide).toHaveAttribute('aria-label', 'mars 2026 : aucune donnée')

    fireEvent.pointerOver(vide)
    expect(screen.getAllByText('—')).toHaveLength(3)
  })

  it('donne ses trois chiffres à chaque mois qui en a', () => {
    draw()
    expect(screen.getAllByRole('option')[0]).toHaveAttribute(
      'aria-label',
      tpl(
        fr.history.srMonthRead,
        'janvier 2026',
        euros(200_000),
        euros(150_000),
        euros(50_000),
      ),
    )
  })

  /* La bande suit le mois lu : sans elle, la lecture parle d'un mois que rien
     ne désigne dans le tracé. */
  it('surligne la tranche du mois lu', () => {
    const { container } = draw()
    const band = container.querySelector('rect[fill="var(--surface-2)"]')
    expect(band).toHaveAttribute('x', '24')

    fireEvent.pointerOver(screen.getAllByRole('option')[2] as HTMLElement)
    expect(container.querySelector('rect[fill="var(--surface-2)"]')).toHaveAttribute('x', '48')
  })

  /* La vue d'ensemble reste : douze noms accessibles ne la remplacent pas. */
  it('garde la lecture accessible du graphique', () => {
    draw()
    expect(screen.getByText('Solde mensuel : …')).toHaveClass('sr-only-text')
    expect(screen.getByRole('img')).toHaveAccessibleName('Douze derniers mois')
  })
})
