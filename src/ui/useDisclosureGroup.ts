import { useMemo, useState } from 'react'

export type DisclosureGroup = {
  isOpen: (key: string) => boolean
  setOpen: (key: string, open: boolean) => void
  /** Vrai dès qu'une section est ouverte — c'est ce qui décide du libellé. */
  anyOpen: boolean
  toggleAll: () => void
  /** Repart du défaut, sans mémoire de ce qui a été ouvert. */
  reset: () => void
}

/**
 * L'état d'un jeu de sections repliables, et son « tout replier ».
 *
 * `null` tant que personne n'a rien touché : le défaut s'applique, et changer
 * d'axe de regroupement y revient sans avoir à recalculer quoi que ce soit.
 * `keys` doit être stable d'un rendu à l'autre — un `useMemo` suffit.
 */
export function useDisclosureGroup(
  keys: readonly string[],
  defaultOpen: boolean,
): DisclosureGroup {
  const [opened, setOpened] = useState<ReadonlySet<string> | null>(null)
  const effective = useMemo(
    () => opened ?? new Set(defaultOpen ? keys : []),
    [opened, defaultOpen, keys],
  )
  const anyOpen = keys.some((key) => effective.has(key))

  return {
    isOpen: (key) => effective.has(key),
    setOpen: (key, open) => {
      // `<details>` émet aussi un `toggle` quand c'est nous qui l'avons piloté :
      // sans ce garde, chaque rendu produirait un Set neuf, donc un autre rendu.
      if (open === effective.has(key)) return
      const next = new Set(effective)
      if (open) next.add(key)
      else next.delete(key)
      setOpened(next)
    },
    anyOpen,
    toggleAll: () => {
      setOpened(anyOpen ? new Set() : new Set(keys))
    },
    reset: () => {
      setOpened(null)
    },
  }
}
