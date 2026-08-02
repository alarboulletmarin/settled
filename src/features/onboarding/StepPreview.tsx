import type { Member } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { Dot } from '@/ui/Dot'
import { Tile } from '@/ui/Tile'

/**
 * Ce que la réponse en cours change, montré plutôt que promis.
 *
 * Les deux questions ne disaient pas à quoi elles servaient : « nom du foyer »
 * et « qui vit ici » se répondent sans savoir ce qu'on y gagne, et le second
 * hint — « les membres servent d'étiquette » — décrivait un mécanisme, pas un
 * bénéfice. L'aperçu répond à la place : le nom apparaît là où on le lira
 * vraiment, et les membres devant ce qu'ils débloquent.
 *
 * Pas d'illustration ni de capture : c'est le vrai composant, aux vrais tokens
 * (DS §1). L'en-tête du foyer est celui de la colonne latérale, à l'identique.
 */
export function HouseholdPreview({ name }: { name: string }) {
  return (
    <Tile className="gap-3">
      <p className="t-label">{fr.onboarding.previewHousehold}</p>
      {/* Le rendu exact de l'en-tête de `Nav.tsx` — mêmes classes, même ordre.
          `placeholder` tient la ligne tant que rien n'est tapé : un aperçu qui
          se replie sur lui-même à chaque effacement bouge plus qu'il n'informe. */}
      <div className="flex flex-col gap-0.5 rounded-inner bg-surface-2 px-3 py-2">
        <span className="t-eyebrow text-muted">{fr.app.name}</span>
        <span className="t-section truncate">
          {name.trim() === '' ? fr.onboarding.householdPlaceholder : name}
        </span>
      </div>
    </Tile>
  )
}

export function MembersPreview({ members }: { members: readonly Member[] }) {
  return (
    <Tile className="gap-3">
      {members.length === 0 ? (
        <p className="t-label">{fr.onboarding.previewMembersEmpty}</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-2">
                <Dot color={member.color} />
                <span className="t-body">{member.name}</span>
              </li>
            ))}
          </ul>
          <p className="t-label">{fr.onboarding.previewMembers}</p>
        </>
      )}
    </Tile>
  )
}
