/* Ce que l'app dit d'elle-même, en un seul endroit : le dépôt, la licence, la
   version. Un lien recopié dans deux composants finit par pointer deux endroits
   différents, et c'est celui qu'on ne relit jamais qui reste faux. */

/* Le dépôt n'est pas qu'un lien de courtoisie depuis que l'app est sous AGPL :
   l'article 13 demande qu'un programme accessible par le réseau offre sa source
   à qui s'en sert. C'est cette constante-ci que le pied de page et « à propos »
   rendent, et le banner du build la recopie dans le JS servi. */
export const REPO_URL = 'https://github.com/alarboulletmarin/tout-compte-fait'
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`
export const LICENSE = 'AGPL-3.0'
export const CHANGELOG_URL = `${REPO_URL}/blob/main/CHANGELOG.md`

/* Le cahier des charges et le design system sont la source de vérité du projet
   — le code leur obéit, et un écart est un bug. Ils n'étaient liés de nulle
   part côté produit, alors qu'ils sont ce qu'on ouvre quand on se demande si
   une app de finances est sérieuse. */
export const DOCS_URL = `${REPO_URL}/tree/main/docs`

/* Les notices des paquets qui voyagent dans le build — dont deux fontes sous
   OFL 1.1, qui exige d'être distribuée avec elles. Fichier statique et non
   route de l'app : il doit rester lisible même si le rendu casse, et c'est
   précisément l'écran de secours qui ne monte ni routeur ni store.
   Le fichier est produit par `npm run licences` (voir `scripts/licences.mjs`). */
export const THIRD_PARTY_URL = '/licences-tierces.txt'

/** `1.0.0` — telle que `package.json` la porte, préfixée à l'affichage. */
export const VERSION = __APP_VERSION__
