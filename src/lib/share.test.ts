import { afterEach, describe, expect, it, vi } from 'vitest'
import { canShareFile, shareFile } from './share'

/* jsdom n'implémente ni `share` ni `canShare` — pas même absentes : il n'y a
   rien sur `navigator` à espionner. On les y pose, puis on les retire, plutôt
   que de les laisser fuir d'un fichier de test à l'autre. */
function stub(name: 'share' | 'canShare', value: unknown): void {
  Object.defineProperty(navigator, name, { value, configurable: true, writable: true })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share')
  Reflect.deleteProperty(navigator, 'canShare')
  vi.restoreAllMocks()
})

const exportFile = (): File =>
  new File(['{}\n'], 'tout-compte-fait-2026-07-30.json', { type: 'application/json' })

/** La fermeture de la feuille, telle que le navigateur la rejette. */
const closed = (): DOMException => new DOMException('Abort due to cancellation', 'AbortError')

describe('disponibilité de la feuille', () => {
  it('répond faux là où le navigateur ne la connaît pas', () => {
    expect(canShareFile('export.json', 'application/json')).toBe(false)
  })

  it('sonde avec un fichier vide, de mêmes nom et type', () => {
    const canShare = vi.fn().mockReturnValue(true)
    stub('canShare', canShare)

    expect(canShareFile('tout-compte-fait-2026-07-30.json', 'application/json')).toBe(true)

    const probe = (canShare.mock.calls[0]?.[0] as ShareData).files?.[0]
    expect(probe?.name).toBe('tout-compte-fait-2026-07-30.json')
    expect(probe?.type).toBe('application/json')
    // Vide : `canShare` ne regarde que le nom et le type, et sérialiser tout le
    // document pour décider d'afficher un bouton coûterait pour rien.
    expect(probe?.size).toBe(0)
  })

  /* Le vrai motif du garde : l'API existe, et le navigateur refuse quand même
     ce type-là. C'est ce que `'share' in navigator` n'aurait pas vu. */
  it('répond faux quand le navigateur refuse ce type de fichier', () => {
    stub('canShare', vi.fn().mockReturnValue(false))
    expect(canShareFile('export.json', 'application/json')).toBe(false)
  })

  it('répond faux plutôt que de laisser passer une exception', () => {
    stub('canShare', () => {
      throw new TypeError('charge invalide')
    })
    expect(canShareFile('export.json', 'application/json')).toBe(false)
  })
})

describe('envoi d’un fichier', () => {
  it('atteint la feuille sans rien attendre avant', () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stub('share', share)

    void shareFile(exportFile())

    /* Sans `await` ni tour de boucle : l'activation transitoire du clic ne
       survit pas à une attente, et Safari iOS — lui seul — lève alors
       `NotAllowedError`. Cette assertion est tout ce qui tient la règle. */
    expect(share).toHaveBeenCalledTimes(1)
  })

  it('n’envoie que le fichier, comme la sonde l’a validé', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stub('share', share)
    const file = exportFile()

    await shareFile(file)

    expect(share).toHaveBeenCalledWith({ files: [file] })
  })

  it('dit que le fichier est parti', async () => {
    stub('share', vi.fn().mockResolvedValue(undefined))
    await expect(shareFile(exportFile())).resolves.toBe('shared')
  })

  /* Fermer la feuille est un choix, pas une panne : l'appelant ne doit ni
     s'excuser ni compter l'export comme fait. */
  it('distingue la feuille fermée d’un échec', async () => {
    stub('share', vi.fn().mockRejectedValue(closed()))
    await expect(shareFile(exportFile())).resolves.toBe('dismissed')
  })

  it('rend un échec sur tout autre rejet', async () => {
    stub('share', vi.fn().mockRejectedValue(new DOMException('refusé', 'NotAllowedError')))
    await expect(shareFile(exportFile())).resolves.toBe('failed')
  })

  it('rend un échec là où la feuille n’existe pas', async () => {
    await expect(shareFile(exportFile())).resolves.toBe('failed')
  })
})
