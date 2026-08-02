import { describe, expect, it, vi } from 'vitest'
import { type TabMessage, openTabChannel } from './tabs'

/**
 * Un bus de test qui se comporte comme `BroadcastChannel` sur le point qui
 * compte : un message part vers les autres, jamais vers soi.
 */
function makeBus(): () => BroadcastChannel {
  const peers: { onmessage: ((event: MessageEvent<TabMessage>) => void) | null }[] = []

  return () => {
    const self = {
      onmessage: null as ((event: MessageEvent<TabMessage>) => void) | null,
      postMessage(message: TabMessage) {
        for (const peer of peers) {
          if (peer !== self) peer.onmessage?.({ data: message } as MessageEvent<TabMessage>)
        }
      },
      close() {
        peers.splice(peers.indexOf(self), 1)
      },
    }
    peers.push(self)
    return self as unknown as BroadcastChannel
  }
}

describe('canal entre onglets', () => {
  it('porte un message chez le voisin, jamais chez soi', () => {
    const bus = makeBus()
    const heardByA = vi.fn()
    const heardByB = vi.fn()
    const a = openTabChannel(heardByA, bus)
    const b = openTabChannel(heardByB, bus)

    a.post({ type: 'saved', rev: 3 })

    expect(heardByB).toHaveBeenCalledWith({ type: 'saved', rev: 3 })
    expect(heardByA).not.toHaveBeenCalled()
    a.close()
    b.close()
  })

  it('n’écoute plus une fois fermé', () => {
    const bus = makeBus()
    const heard = vi.fn()
    const a = openTabChannel(() => {}, bus)
    const b = openTabChannel(heard, bus)

    b.close()
    a.post({ type: 'cleared' })

    expect(heard).not.toHaveBeenCalled()
    a.close()
  })

  it('ne casse rien là où BroadcastChannel n’existe pas', () => {
    const channel = openTabChannel(vi.fn(), () => null)
    expect(() => {
      channel.post({ type: 'saved', rev: 1 })
      channel.close()
    }).not.toThrow()
  })
})
