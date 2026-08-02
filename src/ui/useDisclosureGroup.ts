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
  const byDefault = useMemo(() => new Set(defaultOpen ? keys : []), [defaultOpen, keys])
  const effective = opened ?? byDefault
  const anyOpen = keys.some((key) => effective.has(key))

  return {
    isOpen: (key) => effective.has(key),
    setOpen: (key, open) => {
      /* La forme fonctionnelle, et non le Set capturé au rendu : replier une
         liste ferme toutes ses sections d'un coup, donc autant de `toggle`
         dans le même tour. Partis du même état, ils se recouvraient l'un
         l'autre et seul le dernier survivait — une section sur trois restait
         ouverte, sans qu'aucun clic ne l'explique. */
      setOpened((previous) => {
        const current = previous ?? byDefault
        // `<details>` émet aussi un `toggle` quand c'est nous qui l'avons
        // piloté : sans ce garde, chaque rendu produirait un Set neuf, donc un
        // autre rendu.
        if (open === current.has(key)) return previous
        const next = new Set(current)
        if (open) next.add(key)
        else next.delete(key)
        return next
      })
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
