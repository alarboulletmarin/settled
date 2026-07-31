/* Le gabarit des deux tuiles à anneau. Partagé, parce que deux donuts côte à
 * côte dans la même grille qui ne feraient pas la même taille se verraient.
 *
 * Une tuile 2×2 fait 188px sur mobile (deux rangées de 88 + 12 de gouttière),
 * dont 148 de contenu une fois les 20px de padding retirés. L'eyebrow en prend
 * 23, la ligne de lecture 18, et les deux gouttières 24 : il reste 83px pour
 * l'anneau. Le dépasser ne le fait pas rétrécir — il déborde par le haut et
 * vient couvrir l'eyebrow. */

export const DONUT_SIZE = 80
export const DONUT_THICKNESS = 10

/**
 * Nombre de parts nommées, au-delà desquelles le reste passe sous « Autres ».
 *
 * Quatre, et la légende les montre toutes : un anneau qui découpe sept parts
 * pendant que la légende en nomme quatre laisse trois couleurs sans nom. Et
 * sous ce seuil, une part de 1 % ne dessine plus un arc mais une pastille —
 * les extrémités arrondies mesurent déjà l'épaisseur du trait.
 */
export const DONUT_SLICES = 4
