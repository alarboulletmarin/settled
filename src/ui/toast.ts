import { create } from 'zustand'

export type Toast = {
  id: number
  message: string
  tone: 'default' | 'danger'
  /** Nombre de fois que le même message s'est répété d'affilée. */
  count: number
}

type ToastStore = {
  toasts: Toast[]
  push: (message: string, tone?: Toast['tone']) => void
  dismiss: (id: number) => void
}

let nextId = 0
const LIFETIME_MS = 4000

/**
 * Trois au plus. Au-delà, les plus anciens s'effacent : une pile de messages
 * qui recouvre l'écran ne dit plus rien de ce qui vient de se passer, et cache
 * ce sur quoi on est en train d'agir.
 */
const MAX_VISIBLE = 3

const timers = new Map<number, ReturnType<typeof setTimeout>>()

function forget(id: number): void {
  const timer = timers.get(id)
  if (timer !== undefined) clearTimeout(timer)
  timers.delete(id)
}

export const useToasts = create<ToastStore>()((set, get) => {
  /** (Re)lance le compte à rebours d'un message. */
  const schedule = (id: number): void => {
    forget(id)
    timers.set(
      id,
      setTimeout(() => {
        get().dismiss(id)
      }, LIFETIME_MS),
    )
  }

  return {
    toasts: [],

    push(message, tone = 'default') {
      const last = get().toasts.at(-1)

      /* Le même message répété se compte au lieu de s'empiler : confirmer dix
         échéances une par une donne « Échéance confirmée · 10 », pas dix
         bandeaux. Le compte à rebours repart à chaque répétition. */
      if (last !== undefined && last.message === message && last.tone === tone) {
        set((state) => ({
          toasts: state.toasts.map((t) => (t.id === last.id ? { ...t, count: t.count + 1 } : t)),
        }))
        schedule(last.id)
        return
      }

      nextId += 1
      const id = nextId
      set((state) => {
        const next = [...state.toasts, { id, message, tone, count: 1 }]
        for (const dropped of next.slice(0, -MAX_VISIBLE)) forget(dropped.id)
        return { toasts: next.slice(-MAX_VISIBLE) }
      })
      schedule(id)
    },

    dismiss(id) {
      forget(id)
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    },
  }
})

/** Raccourci hors composant : une action peut annoncer son résultat. */
export const toast = (message: string, tone?: Toast['tone']): void => {
  useToasts.getState().push(message, tone)
}
