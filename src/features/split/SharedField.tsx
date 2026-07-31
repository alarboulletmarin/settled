import { defaultShared } from '@/domain/split'
import type { CategoryKind } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { useKindOf, useMembers } from '@/store/selectors'
import { Checkbox } from '@/ui/Field'

/**
 * La case « à partager », posée sur la saisie d'une dépense comme sur celle
 * d'un abonnement.
 *
 * Elle affiche ce que la règle donnerait tant que personne ne l'a touchée, et
 * suit donc le membre et la catégorie qu'on choisit. Cochée ou décochée à la
 * main, elle fige une exception que la règle ne peut plus reprendre.
 *
 * Elle ne s'affiche qu'à partir de deux membres : à un seul, tout est déjà à
 * la même personne et il n'y a rien à répartir.
 */
export function SharedField({
  categoryId,
  memberId,
  value,
  onChange,
}: {
  categoryId: string
  memberId: string
  /** `undefined` = la règle tranche. */
  value: boolean | undefined
  onChange: (next: boolean | undefined) => void
}) {
  const members = useMembers()
  const kindOf = useKindOf()
  if (members.length < 2) return null

  const kind: CategoryKind = kindOf(categoryId)
  const byRule = defaultShared(kind, memberId)

  return (
    <Checkbox
      checked={value ?? byRule}
      label={fr.entry.shared}
      hint={fr.entry.sharedHint}
      onChange={(next) => {
        // Revenu à la valeur de la règle, la case lui rend la main : rien à
        // stocker, et le champ suivra de nouveau le membre et la catégorie.
        onChange(next === byRule ? undefined : next)
      }}
    />
  )
}
