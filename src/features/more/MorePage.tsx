import {
  ABOUT_PATH,
  CREDITS_PATH,
  MORE_SECTIONS,
  RECURRENCES_PATH,
  SAVINGS_PATH,
  SETTINGS_PATH,
  SPLIT_PATH,
} from '@/app/routes'
import { fr } from '@/i18n/fr'
import { PageTitle } from '@/ui/PageTitle'
import { Row, RowGroup } from '@/ui/RowGroup'

/**
 * Ce que la barre d'onglets ne peut pas porter.
 *
 * Elle en portait cinq, et cette contrainte-là décidait de l'architecture : les
 * récurrences y tenaient un rang qu'on n'ouvre pas tous les jours, pendant que
 * l'épargne, la répartition et les crédits — trois écrans pleins, avec leurs
 * routes, leurs calculs et leurs états vides — n'avaient **aucune adresse dans
 * la navigation**. On n'y arrivait que par une tuile du mois, laquelle s'efface
 * quand elle n'a rien à montrer : un écran atteignable seulement quand on n'en
 * a pas besoin.
 *
 * Cet écran est la place qui leur manquait. Il ne cache rien de ce qui est déjà
 * dans la barre — il continue la navigation d'un cran, là où la colonne
 * latérale déplie les mêmes groupes d'un coup (`SIDEBAR_GROUPS`).
 *
 * **Une liste de portes, et rien d'autre.** Pas un chiffre, pas une tuile
 * accentuée, aucune synthèse : chaque écran d'arrivée dit déjà le sien, et les
 * répéter ici ferait un second tableau de bord à maintenir, en retard d'une
 * règle sur le premier. Chaque rangée porte en revanche une phrase, parce que
 * sur un écran qui n'est qu'une liste de destinations, un libellé seul demande
 * d'ouvrir pour savoir si c'était la bonne.
 *
 * Les deux groupes viennent de `MORE_SECTIONS` : ce que la colonne latérale
 * range, cet écran le range pareil, et par la même table. Deux navigations qui
 * lisent deux listes finiraient par diverger sans que rien ne l'annonce.
 */

/* La phrase d'une rangée, par destination — indexée sur les constantes de
   chemin et non sur des URL recopiées : un test qui écrirait ses adresses à la
   main resterait vert le jour où l'app change les siennes, et cette table-ci
   deviendrait muette sans que rien ne le dise. Une destination absente ne
   porte pas de phrase, elle ne casse rien. */
const HINTS: Record<string, string> = {
  [RECURRENCES_PATH]: fr.nav.subscriptionsHint,
  [SAVINGS_PATH]: fr.nav.savingsHint,
  [SPLIT_PATH]: fr.nav.splitHint,
  [CREDITS_PATH]: fr.nav.creditsHint,
  [SETTINGS_PATH]: fr.nav.settingsHint,
  [ABOUT_PATH]: fr.nav.aboutHint,
}

export function MorePage() {
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageTitle title={fr.nav.more} />

      {MORE_SECTIONS.map((group, index) => (
        /* La clé est le titre quand il y en a un, et le rang sinon : le second
           groupe n'en a pas, et c'est le seul dans ce cas. */
        <RowGroup
          key={group.title ?? index}
          {...(group.title === undefined ? {} : { title: group.title })}
        >
          {group.routes.map((route) => {
            const hint = HINTS[route.path]
            return (
              <Row
                key={route.path}
                label={route.label}
                to={route.path}
                {...(hint === undefined ? {} : { description: hint })}
              />
            )
          })}
        </RowGroup>
      ))}
    </div>
  )
}
