/* ============================================================================
 * Notice du premier lancement : l'accusé de lecture, en localStorage.
 *
 * Le drapeau vit hors du document, comme le thème et la palette : il décrit ce
 * navigateur-ci et la personne devant lui, pas le foyer. Ce qui a deux
 * conséquences, et les deux comptent.
 *
 * **Il se lit avant IndexedDB.** La notice doit s'afficher au premier rendu,
 * quel que soit l'écran d'arrivée et sans attendre l'hydratation : la lire ici
 * est synchrone, donc quelqu'un qui l'a déjà fermée ne la voit pas revenir une
 * frame. Rien à ajouter au script en ligne d'`index.html` pour autant : son
 * empreinte est scellée dans la CSP, et un composant React lit `localStorage`
 * aussi tôt que lui.
 *
 * **Il survit à « Tout effacer ».** `forgetExportMarks` efface ses deux dates
 * parce qu'elles décrivent des données qui ne sont plus là ; le thème et la
 * palette, eux, traversent `resetAll` parce qu'ils décrivent l'appareil. Ce
 * drapeau est du second groupe : effacer ses données ne fait pas oublier ce
 * qu'on a lu, et rouvrir une modale bloquante devant quelqu'un qui vient de
 * tout effacer serait une punition, pas une information.
 * ==========================================================================*/

export const NOTICE_STORAGE_KEY = 'tout-compte-fait.notice'

/* Une constante, pas une date. Le refus du rappel d'export en stocke une parce
   qu'il vaut trente jours et non l'éternité ; ici il n'y a pas de cycle : on a
   lu, ou on n'a pas lu. Un nombre plutôt qu'un booléen écrit en toutes lettres :
   si la notice dit un jour autre chose d'assez différent pour valoir d'être
   relue, c'est ce numéro qui le dira, sans avoir à changer de clé. */
const READ = '1'

export function hasReadNotice(): boolean {
  try {
    return localStorage.getItem(NOTICE_STORAGE_KEY) === READ
  } catch {
    /* Navigation privée sur un vieux Safari : on ne sait pas, donc on montre.
       C'est le moins mauvais des deux sens : une notice vue deux fois est une
       gêne, une notice jamais vue est la fonctionnalité qui manque. */
    return false
  }
}

export function markNoticeRead(): void {
  try {
    localStorage.setItem(NOTICE_STORAGE_KEY, READ)
  } catch {
    // Quota plein, mode privé : elle réapparaîtra au prochain démarrage. Rien à
    // en dire à qui vient de la fermer : le bouton a bien fait ce qu'il promet.
  }
}
