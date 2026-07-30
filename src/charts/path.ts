/* Construction de tracés SVG.
 *
 * Une période sans donnée ne vaut pas zéro : elle n'est pas tracée du tout.
 * C'est la règle du cahier §4.7 — « les périodes sans donnée affichent un état
 * vide explicite, pas un graphique à zéro » — appliquée au trait lui-même,
 * qui se coupe au lieu de plonger sur la ligne de base. */

export type Point = { x: number; y: number } | null

/** Trace une polyligne en coupant le trait à chaque trou. */
export function polylinePath(points: readonly Point[]): string {
  const commands: string[] = []
  let penDown = false
  for (const point of points) {
    if (point === null) {
      penDown = false
      continue
    }
    commands.push(`${penDown ? 'L' : 'M'} ${String(point.x)} ${String(point.y)}`)
    penDown = true
  }
  return commands.join(' ')
}

/** Un point isolé entre deux trous ne produirait aucun trait : on le marque. */
export function isolatedPoints(points: readonly Point[]): { x: number; y: number }[] {
  return points.filter((point, index): point is { x: number; y: number } => {
    if (point === null) return false
    return (points[index - 1] ?? null) === null && (points[index + 1] ?? null) === null
  })
}
