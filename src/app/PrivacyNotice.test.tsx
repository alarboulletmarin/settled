import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { fr } from '@/i18n/fr'
import { NOTICE_STORAGE_KEY } from '@/lib/notice'
import { PRIVACY_PATH } from './routes'
import { PrivacyNotice } from './PrivacyNotice'

beforeEach(() => {
  localStorage.clear()
})

function mount() {
  render(
    <MemoryRouter>
      <PrivacyNotice />
    </MemoryRouter>,
  )
}

/* `hidden: true` : le bouchon de `src/test/setup.ts` ne pose que l'attribut
   `open`, il ne sort pas l'élément de l'arbre d'accessibilité comme le ferait un
   vrai `showModal()`. C'est le même choix que `Sheet.test.tsx`. */
function dialog(): HTMLElement {
  return screen.getByRole('dialog', { hidden: true })
}

function action(): HTMLElement {
  return screen.getByRole('button', { name: fr.notice.action })
}

/**
 * Ce que la touche Échap envoie à un `<dialog>` ouvert.
 *
 * Construit à la main : `createEvent` n'a pas de fabrique `cancel`, et jsdom
 * n'émet rien sur une vraie touche puisque son `showModal()` est un bouchon. Il
 * faut l'objet lui-même et non le booléen de `fireEvent` — c'est
 * `defaultPrevented` qui dit que la feuille a refusé de se fermer.
 */
function pressEscape(node: Element): Event {
  const event = new Event('cancel', { bubbles: false, cancelable: true })
  fireEvent(node, event)
  return event
}

describe('PrivacyNotice — quand elle se montre', () => {
  it('bloque au premier lancement', () => {
    mount()
    expect(dialog()).toBeInTheDocument()
    expect(screen.getByText(fr.notice.noServer)).toBeInTheDocument()
  })

  /* Le vrai contrat du « une seule fois » : sans lui, la notice serait une
     modale bloquante à chaque ouverture de l'app. */
  it('ne revient pas quand elle a été lue', () => {
    localStorage.setItem(NOTICE_STORAGE_KEY, '1')
    mount()
    expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
  })
})

describe('PrivacyNotice — la case et le bouton', () => {
  it('n’ouvre le bouton qu’une fois la case cochée', async () => {
    const user = userEvent.setup()
    mount()

    expect(action()).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: fr.notice.check }))
    expect(action()).toBeEnabled()
  })

  it('referme et retient, sur le seul geste qui le peut', async () => {
    const user = userEvent.setup()
    mount()

    await user.click(screen.getByRole('checkbox', { name: fr.notice.check }))
    await user.click(action())

    expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
    expect(localStorage.getItem(NOTICE_STORAGE_KEY)).toBe('1')
  })

  /* La raison du bouton éteint vit sur la case, qui est focusable — un
     `disabled` ne prend pas le focus, donc il ne peut pas l'annoncer lui-même. */
  it('dit pourquoi le bouton est éteint, et le dit encore après', async () => {
    const user = userEvent.setup()
    mount()

    expect(screen.getByText(fr.notice.checkHint)).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: fr.notice.check }))
    expect(screen.getByText(fr.notice.checkHint)).toBeInTheDocument()
  })
})

describe('PrivacyNotice — les sorties qui n’existent pas', () => {
  it('ne se referme pas sur Échap', () => {
    mount()
    expect(pressEscape(dialog()).defaultPrevented).toBe(true)
    expect(dialog()).toBeInTheDocument()
  })

  it('ne se referme pas sur un clic à côté', () => {
    mount()
    fireEvent.click(dialog())
    expect(dialog()).toBeInTheDocument()
  })

  it('ne porte pas de croix, qui promettrait une sortie de plus', () => {
    mount()
    expect(screen.queryByRole('button', { name: fr.common.close })).not.toBeInTheDocument()
  })

  it('n’écrit rien tant qu’elle est ouverte', () => {
    mount()
    fireEvent.click(dialog())
    expect(localStorage.getItem(NOTICE_STORAGE_KEY)).toBeNull()
  })
})

describe('PrivacyNotice — ce qu’elle donne à vérifier', () => {
  it('mène à la page de confidentialité', () => {
    mount()
    expect(screen.getByRole('link', { name: fr.legal.privacy })).toHaveAttribute(
      'href',
      PRIVACY_PATH,
    )
  })

  /* Sans `aria-describedby`, `showModal()` poserait le focus sur le lien du
     corps et un lecteur d'écran annoncerait le titre puis « Confidentialité,
     lien » — sans un mot des quatre lignes entre les deux. */
  it('désigne son texte, pour qu’il soit annoncé et pas traversé', () => {
    mount()
    const described = dialog().getAttribute('aria-describedby')
    expect(described).not.toBeNull()

    const body = document.getElementById(described ?? '')
    expect(body).not.toBeNull()
    expect(body).toHaveTextContent(fr.notice.noReader)
  })

  it('compte quatre « aucun », et les rend en liste', () => {
    mount()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })
})
