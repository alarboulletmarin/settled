/* ============================================================================
 * Ce que les onglets se disent.
 *
 * Le document est réécrit en bloc à chaque mutation : sans un mot entre eux,
 * deux onglets ouverts sur la même app s'écrasent l'un l'autre, en silence et
 * au dernier qui écrit.
 * ==========================================================================*/

export const TABS_CHANNEL = 'tout-compte-fait'

/**
 * Le message ne transporte jamais le document. Ce serait un clone complet à
 * chaque frappe, par onglet, et l'onglet qui reçoit doit de toute façon relire
 * la base pour être sûr d'être d'accord avec elle : la révision suffit à dire
 * « ce que tu as en mémoire n'est plus ce qui est écrit ».
 */
export type TabMessage =
  | { type: 'saved'; rev: number }
  /** Tout a été effacé ailleurs — réinitialisation, ou document illisible jeté. */
  | { type: 'cleared' }

export type TabChannel = {
  post: (message: TabMessage) => void
  close: () => void
}

function defaultChannel(): BroadcastChannel | null {
  // Détecté, jamais supposé : sans `BroadcastChannel`, l'app se comporte comme
  // avant ce module — mal à deux onglets, mais pas cassée à un seul.
  return typeof BroadcastChannel === 'function' ? new BroadcastChannel(TABS_CHANNEL) : null
}

/**
 * Ouvre le canal. `factory` est la couture des tests : elle permet d'en poser
 * deux sur un même bus, ce que deux onglets font sans le savoir.
 */
export function openTabChannel(
  onMessage: (message: TabMessage) => void,
  factory: () => BroadcastChannel | null = defaultChannel,
): TabChannel {
  const channel = factory()
  if (channel === null) return { post: () => {}, close: () => {} }

  channel.onmessage = (event: MessageEvent<TabMessage>) => {
    onMessage(event.data)
  }

  return {
    post(message) {
      // Un canal fermé lève : une écriture qui part pendant que la page se
      // décharge n'a pas à faire échouer l'écriture elle-même.
      try {
        channel.postMessage(message)
      } catch {
        /* rien à en dire */
      }
    },
    close() {
      channel.onmessage = null
      channel.close()
    },
  }
}
