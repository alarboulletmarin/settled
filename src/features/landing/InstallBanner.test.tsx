import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fr } from '@/i18n/fr'
import { InstallBanner } from './InstallBanner'

/* L'événement n'existe pas dans jsdom, et le module l'écoute sur `window` dès
   son évaluation : un `Event` nu portant le bon nom et la méthode que le
   composant appelle suffit à l'exercer de bout en bout. */
function fireInstallPrompt(prompt = vi.fn().mockResolvedValue(undefined)) {
  const event = Object.assign(new Event('beforeinstallprompt'), { prompt })
  act(() => {
    window.dispatchEvent(event)
  })
  return prompt
}

function setOnLine(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

const installButton = () => screen.queryByRole('button', { name: fr.landing.installAction })

describe('InstallBanner — l’installation', () => {
  afterEach(() => {
    /* L'événement est retenu dans un module : sans ce rinçage, un test le
       léguerait au suivant. `appinstalled` est exactement ce que le module
       écoute pour l'oublier. */
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    setOnLine(true)
  })

  it('ne propose rien tant que le navigateur n’a rien proposé', () => {
    render(<InstallBanner />)
    expect(installButton()).not.toBeInTheDocument()
    expect(screen.queryByText(fr.landing.installTitle)).not.toBeInTheDocument()
  })

  it('apparaît dès que le navigateur ouvre la porte', () => {
    render(<InstallBanner />)
    fireInstallPrompt()
    expect(screen.getByText(fr.landing.installTitle)).toBeInTheDocument()
    expect(installButton()).toBeInTheDocument()
  })

  it('ouvre l’invite du navigateur, et ne se repropose pas', async () => {
    render(<InstallBanner />)
    const prompt = fireInstallPrompt()

    await userEvent.click(screen.getByRole('button', { name: fr.landing.installAction }))
    expect(prompt).toHaveBeenCalledTimes(1)

    /* Un `beforeinstallprompt` ne se consomme qu'une fois : un bandeau qui
       resterait offrirait un bouton qui ne fait plus rien. */
    expect(installButton()).not.toBeInTheDocument()
  })

  it('disparaît une fois l’app installée', () => {
    render(<InstallBanner />)
    fireInstallPrompt()
    expect(installButton()).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(installButton()).not.toBeInTheDocument()
  })
})

describe('InstallBanner — le hors-ligne', () => {
  afterEach(() => {
    setOnLine(true)
  })

  it('ne dit rien tant que le réseau répond', () => {
    render(<InstallBanner />)
    expect(screen.queryByText(fr.landing.offline)).not.toBeInTheDocument()
  })

  it('annonce que tout continue dès que le réseau tombe', () => {
    render(<InstallBanner />)

    setOnLine(false)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByRole('status')).toHaveTextContent(fr.landing.offline)

    setOnLine(true)
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByText(fr.landing.offline)).not.toBeInTheDocument()
  })
})
