/* ============================================================================
 * La priorité des messages de sécurité des données.
 *
 * Une règle, sans rendu ni store : c'est ce qui permet de l'éprouver pour
 * elle-même, et de la lire d'un coup d'œil sans traverser un composant.
 * ==========================================================================*/

/**
 * Les niveaux, du plus grave au plus faible. `null` est le cas courant, et il
 * doit le rester : l'app ne dit rien tant qu'elle n'a rien à dire.
 */
export type DataNoticeLevel = 'failure' | 'durability' | 'export' | null

/**
 * Ce qui décide lequel des trois bandeaux parle.
 *
 * L'ordre découle de ce que chaque message coûte s'il est ignoré. Un échec
 * confirmé se paie tout de suite — ce qui vient d'être saisi n'existe nulle
 * part. Une conservation non garantie se paie peut-être, un jour, et l'export en
 * est déjà le remède. Un export ancien se paie le jour où l'appareil tombe. Les
 * trois disent au fond « garde une copie » : les empiler apprendrait surtout à
 * ne plus les lire, et le plus grave serait le premier à disparaître dans le tas.
 *
 * Le quatrième cas du cahier — le document illisible — n'apparaît pas ici : il
 * ne se règle pas par un bandeau mais par l'écran d'arrivée et ses recours, qui
 * remplace l'app entière. Sa seule forme résiduelle est une base devenue
 * illisible **après** l'ouverture, et celle-là passe par `failure`.
 */
export function dataNoticeLevel(input: {
  failing: boolean
  fragile: boolean
  staleExport: boolean
}): DataNoticeLevel {
  if (input.failing) return 'failure'
  if (input.fragile) return 'durability'
  if (input.staleExport) return 'export'
  return null
}
