/* Ce que l'app dit d'elle-même, en un seul endroit : le dépôt, la licence, la
   version. Un lien recopié dans deux composants finit par pointer deux endroits
   différents, et c'est celui qu'on ne relit jamais qui reste faux. */

export const REPO_URL = 'https://github.com/alarboulletmarin/tout-compte-fait'
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`
export const LICENSE = 'MIT'

/** `1.0.0` — telle que `package.json` la porte, préfixée à l'affichage. */
export const VERSION = __APP_VERSION__
