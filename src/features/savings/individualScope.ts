/* ============================================================================
 * L'épargne se lit toujours **au nom de quelqu'un**.
 *
 * C'est la seule lecture de l'app qui n'a pas de version « foyer ». Deux
 * personnes qui ont 12 000 € et 8 000 € de côté n'ont pas « 20 000 € » : elles
 * ont deux comptes, deux capacités et deux décisions, et le total ne se place
 * nulle part. « Commun » ne dirait rien de plus — l'épargne ne se partage
 * jamais, et la lecture ne rendrait que des zéros.
 *
 * L'écran s'en remet donc au filtre du bandeau, comme tous les autres : c'est
 * lui qui applique déjà le prorata des charges communes, et s'en donner un
 * second, local, referait ce calcul à côté du premier. Il se contente de
 * **poser une personne** quand aucune ne l'est.
 * ==========================================================================*/

import { useLayoutEffect } from 'react'
import { useMemberFilter, useMembers } from '@/store/selectors'
import { useStore } from '@/store/store'

/**
 * S'assure qu'une personne est sélectionnée, et rend la sienne.
 *
 * `null` quand le foyer n'a encore personne : il n'y a alors rien à filtrer —
 * tout est déjà à la seule personne qui saisit, et l'écran d'épargne dit de
 * toute façon qu'il faut quelqu'un avant de poser un support.
 *
 * `useLayoutEffect` et non `useEffect`, pour une fois : le second s'exécute
 * après la peinture, et l'écran afficherait donc pendant une image le total du
 * foyer entier — c'est-à-dire précisément la somme qui ne veut rien dire, sur
 * l'écran fait pour ne pas la montrer.
 */
export function useIndividualScope(): string | null {
  const members = useMembers()
  const active = useMemberFilter()
  const setFilter = useStore((s) => s.setFilter)

  const known = active !== undefined && members.some((member) => member.id === active)
  const fallback = members[0]?.id ?? null

  useLayoutEffect(() => {
    if (known || fallback === null) return
    setFilter({ kind: 'member', memberId: fallback })
  }, [known, fallback, setFilter])

  return known ? (active ?? null) : fallback
}
