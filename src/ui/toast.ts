import { create } from 'zustand'

export type Toast = { id: number; message: string; tone: 'default' | 'danger' }

type ToastStore = {
  toasts: Toast[]
  push: (message: string, tone?: Toast['tone']) => void
  dismiss: (id: number) => void
}

let nextId = 0
const LIFETIME_MS = 4000

export const useToasts = create<ToastStore>()((set, get) => ({
  toasts: [],
  push(message, tone = 'default') {
    nextId += 1
    const id = nextId
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }))
    setTimeout(() => {
      get().dismiss(id)
    }, LIFETIME_MS)
  },
  dismiss(id) {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

/** Raccourci hors composant : une action peut annoncer son résultat. */
export const toast = (message: string, tone?: Toast['tone']): void => {
  useToasts.getState().push(message, tone)
}
