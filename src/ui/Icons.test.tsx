import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import * as Icons from './Icons'
import type { IconComponent } from './Icons'

/* Ce qui est exporté et qui est un glyphe — le module exporte aussi ses types,
   que TypeScript efface, mais rien n'interdit à un helper de s'y ajouter. */
function glyphs(): [string, IconComponent][] {
  return Object.entries(Icons).filter(
    (entry): entry is [string, IconComponent] => typeof entry[1] === 'function',
  )
}

describe('Icons', () => {
  /* Le défaut que ce test existe pour empêcher : `NavHistory` et `TrailingIcon`
     étaient tous deux `ChartLine`, `NavRecurrences` et `RecurrencesIcon` tous
     deux `ArrowsClockwise`. Deux noms pour un trait, donc deux endroits d'où
     l'onglet et la tuile d'un même concept pouvaient se mettre à diverger — et
     rien pour le dire, puisque les deux rendaient la même image. Le DS §9.2
     veut l'inverse : un glyphe par concept, déclaré une seule fois. */
  it('ne déclare jamais deux exports pour un même glyphe', () => {
    const seen = new Map<string, string>()
    const duplicates: string[] = []

    for (const [name, Icon] of glyphs()) {
      const { container, unmount } = render(<Icon />)
      const drawing = container.innerHTML
      const first = seen.get(drawing)
      if (first === undefined) seen.set(drawing, name)
      else duplicates.push(`${first} et ${name}`)
      unmount()
    }

    expect(duplicates).toEqual([])
  })

  /* Le DS §9.2 : « `aria-hidden` systématique — le libellé adjacent porte déjà
     le sens ». Un glyphe qui l'oublie fait dire deux fois la même chose. */
  it('masque tous les glyphes aux lecteurs d’écran', () => {
    for (const [name, Icon] of glyphs()) {
      const { container, unmount } = render(<Icon />)
      expect(container.querySelector('svg'), name).toHaveAttribute('aria-hidden', 'true')
      unmount()
    }
  })
})
