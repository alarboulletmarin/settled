export type AxisTick = { pct: number; text: string }

/**
 * L'axe des ordonnées, en HTML à gauche du tracé.
 *
 * En HTML et non en `<text>` dans le SVG, pour la raison qui fait déjà vivre la
 * bande des mois hors du SVG : les deux graphiques sont en
 * `preserveAspectRatio="none"`, et une lettre posée dans cet espace serait
 * étirée en largeur avec lui.
 *
 * Le placement en pourcentage est exact malgré tout, et c'est ce qui rend la
 * séparation légale : cette même échelle non uniforme projette l'axe des y
 * linéairement sur toute la hauteur de la boîte, donc une graduation posée à
 * `top: 5 %` tombe pile sur la ligne de repère tracée à `y = 6` d'un SVG de 120
 * de haut. Changer l'un sans l'autre les décale, et rien ne le dirait.
 */
export function ChartAxis({ ticks, height }: { ticks: readonly AxisTick[]; height: string }) {
  const longest = ticks.reduce((wide, tick) => (tick.text.length > wide.length ? tick.text : wide), '')

  return (
    <div className={`relative shrink-0 ${height}`} aria-hidden="true">
      {/* Un exemplaire dans le flux, invisible : c'est lui qui donne sa largeur
          à la colonne. Elle fait donc exactement celle de sa plus longue
          graduation — ni un pixel de tracé cédé pour rien, ni un libellé
          tronqué quand les montants grandissent. */}
      <span className="t-axis invisible block whitespace-nowrap">{longest}</span>
      {ticks.map((tick) => (
        <span
          key={tick.pct}
          className="t-axis absolute right-0 -translate-y-1/2 whitespace-nowrap"
          style={{ top: `${String(tick.pct)}%` }}
        >
          {tick.text}
        </span>
      ))}
    </div>
  )
}
