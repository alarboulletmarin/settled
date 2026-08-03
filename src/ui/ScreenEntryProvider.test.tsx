import { render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { money } from '@/domain/money'
import { moneyParts } from '@/i18n/format'
import { Amount } from './Amount'
import { ScreenEntryProvider } from './ScreenEntryProvider'

/* Les attentes passent par le formateur : l'espace fine insécable devant les
   milliers est sa règle, et ce fichier ne parle pas de mise en forme mais de
   qui compte et qui ne compte pas. */
const written = (cents: number): string => moneyParts(money(cents), 'EUR').integer

/* `src/test/setup.ts` déclare `prefers-reduced-motion: reduce` pour toute la
   suite. Ici on veut la branche animée, pour voir *qui* compte et qui ne compte
   pas — c'est toute la question de ce fichier. */
function setReducedMotion(reduce: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') && reduce,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

beforeEach(() => {
  /* Aucune image ne sera jouée : ce qui nous intéresse est l'état de départ —
     zéro pour un montant qui va compter, sa valeur pour un montant qui ne
     comptera pas. */
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  setReducedMotion(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
  setReducedMotion(true)
})

const shown = (testId: string): string =>
  screen.getByTestId(testId).querySelector('span[aria-hidden="true"]')?.textContent ?? ''

/** Une tuile qui n'apparaît qu'après l'arrivée de l'écran, comme sur la grille. */
function Screen({ late }: { late: boolean }) {
  const [visible, setVisible] = useState(false)
  return (
    <ScreenEntryProvider>
      <div data-testid="tot">
        <Amount value={money(120_000)} size="tile-fit" />
      </div>
      {late && !visible && (
        <button
          type="button"
          onClick={() => {
            setVisible(true)
          }}
        >
          montrer
        </button>
      )}
      {(!late || visible) && (
        <div data-testid="tard">
          <Amount value={money(90_000)} size="tile-fit" />
        </div>
      )}
    </ScreenEntryProvider>
  )
}

describe('ScreenEntryProvider', () => {
  it('laisse compter ce qui arrive avec l’écran', () => {
    render(<Screen late={false} />)
    expect(shown('tot')).not.toContain(written(120_000))
    expect(shown('tard')).not.toContain(written(90_000))
  })

  /* Le défaut que ce test existe pour empêcher. Le filtre « Commun » retire cinq
     tuiles de la grille et les remet ; « Reste à vivre » n'existe que sur le mois
     courant. Chaque retour relançait leur compteur pendant que les tuiles restées
     en place changeaient de valeur en silence : sur un même geste, le solde
     s'égrenait et les charges sautaient. */
  it('ne fait pas compter une tuile qui apparaît après', async () => {
    const { rerender } = render(<Screen late />)
    // L'écran est arrivé : ce qui vient après n'est plus une arrivée.
    rerender(<Screen late />)
    screen.getByRole('button', { name: 'montrer' }).click()

    await screen.findByTestId('tard')
    expect(shown('tard')).toContain(written(90_000))
  })

  /* Hors coquille — un test, le styleguide —, tout montage vaut une arrivée. */
  it('laisse compter sans fournisseur du tout', () => {
    render(
      <div data-testid="seul">
        <Amount value={money(120_000)} size="tile-fit" />
      </div>,
    )
    expect(shown('seul')).not.toContain(written(120_000))
  })

  /* Le DS §5 range le comptage sur la grille bento, pas sur les listes : une
     part par membre et une ligne par crédit portent la même taille de chiffre
     qu'une tuile, et quarante montants qui s'égrènent sont un scintillement. */
  it('ne fait pas compter un chiffre de liste', () => {
    render(
      <ScreenEntryProvider>
        <div data-testid="liste">
          <Amount value={money(120_000)} size="tile" />
        </div>
      </ScreenEntryProvider>,
    )
    expect(shown('liste')).toContain(written(120_000))
  })
})
