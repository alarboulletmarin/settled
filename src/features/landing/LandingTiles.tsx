import { fr } from '@/i18n/fr'
import { formatMoney, formatPercent, tpl } from '@/i18n/format'
import { Amount } from '@/ui/Amount'
import { Dot } from '@/ui/Dot'
import { Eyebrow } from '@/ui/Eyebrow'
import {
  CategoriesIcon,
  CreditsIcon,
  DataIcon,
  ForecastIcon,
  SavingsIcon,
  SplitIcon,
} from '@/ui/Icons'
import { Ring } from '@/ui/Ring'
import { BentoGrid, Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
import { SAMPLE } from './sample'

/**
 * La démonstration du produit, en six tuiles.
 *
 * Le DS §1 interdit l'illustration : « le chiffre est l'image ». Une page de
 * présentation ne peut donc pas montrer des visuels de l'app — elle doit *être*
 * l'app. Ces six tuiles sont les composants du vrai tableau de bord, avec le
 * vocabulaire du vrai tableau de bord, et quelqu'un qui crée son foyer retrouve
 * la même grille dix secondes plus tard. C'est le seul argument qu'une capture
 * d'écran n'aurait pas su tenir.
 *
 * **Elles ne portent pas les explications.** Le DS §5 plafonne une tuile à un
 * eyebrow, un chiffre, une lecture secondaire et une visualisation ; y glisser un
 * paragraphe faisait déborder chacune par le bas à 320px, la 4×2 coupant son
 * anneau et la 2×2 sa dernière ligne. Le raisonnement se lit sous la grille, où
 * rien ne le coupe — et la grille redevient ce qu'elle montre, pas ce qu'elle
 * raconte.
 *
 * Aucune n'est cliquable, donc aucune ne porte d'`affordance` : la règle du DS
 * §6 qui rend les repères lisibles est qu'on n'en pose pas sur ce qui n'agit
 * pas. Six tuiles muettes suivies d'un bouton clair disent mieux « voici l'app »
 * que six fausses cibles.
 *
 * Les six pavent exactement 6 colonnes sur 4 rangées — 8+4+2+2+4+4 = 24 — et
 * 2 colonnes sur 8 en mobile : la grille se remplit sans trou des deux côtés du
 * point de bascule.
 */
export function LandingTiles() {
  const currency = useCurrency()

  return (
    <BentoGrid>
      {/* Prévu, puis confirmé — l'anneau signature en jauge, comme sur le mois. */}
      <Tile span="4x2" label={fr.landing.monthTitle}>
        <Eyebrow icon={ForecastIcon}>{fr.landing.monthTitle}</Eyebrow>
        <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
          <Ring
            size={96}
            value={SAMPLE.monthRatio}
            label={fr.landing.monthRing}
            srText={fr.landing.monthRingRead}
            className="shrink-0"
          >
            <span className="t-num-body tnum">{formatPercent(SAMPLE.monthRatio)}</span>
          </Ring>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="t-num-body tnum">
              {tpl(
                fr.landing.monthOf,
                formatMoney(SAMPLE.monthConfirmed, currency, false),
                formatMoney(SAMPLE.monthForecast, currency, false),
              )}
            </span>
            <span className="t-label">{fr.landing.monthHint}</span>
          </div>
        </div>
      </Tile>

      {/* La seule tuile accentuée de la page. Le lime est la marque (DS §1), et
          la marque se pose sur ce qui distingue l'app — pas sur un chiffre.
          Une phrase, pas un paragraphe : une 2×2 fait 188px en mobile. */}
      <Tile span="2x2" variant="accent" label={fr.landing.privacyTitle}>
        <Eyebrow icon={DataIcon}>{fr.landing.privacyTitle}</Eyebrow>
        <p className="t-section mt-4">{fr.landing.privacyShort}</p>
      </Tile>

      <Tile span="2x1" className="justify-between" label={fr.dashboard.capacity}>
        <Eyebrow icon={SavingsIcon}>{fr.dashboard.capacity}</Eyebrow>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Amount value={SAMPLE.savingCapacity} size="tile-fit" withCents={false} />
          {/* Une tuile d'une rangée fait 88px : la seconde lecture ne s'affiche
              qu'au-delà de 1024px, comme sur le vrai tableau de bord. */}
          <span className="t-label max-lg:sr-only">{fr.dashboard.capacityHint}</span>
        </div>
      </Tile>

      <Tile span="2x1" className="justify-between" label={fr.dashboard.credits}>
        <Eyebrow icon={CreditsIcon}>{fr.dashboard.credits}</Eyebrow>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Amount value={SAMPLE.debtRemaining} size="tile-fit" withCents={false} />
          <span className="t-label max-lg:sr-only">{fr.dashboard.creditsRemaining}</span>
        </div>
      </Tile>

      <Tile span="2x2" label={fr.landing.splitTitle}>
        <Eyebrow icon={SplitIcon}>{fr.dashboard.split}</Eyebrow>
        <ul className="mt-4 flex flex-col gap-3">
          {SAMPLE.shares.map((share) => (
            <li key={share.id} className="flex items-baseline gap-2">
              <Dot color={share.color} />
              <span className="t-body min-w-0 truncate">{share.label}</span>
              <span className="t-num-body tnum ml-auto">{formatPercent(share.percent / 100)}</span>
            </li>
          ))}
        </ul>
        <span className="t-label mt-auto">{fr.dashboard.splitHint}</span>
      </Tile>

      {/* Les quatre natures en une ligne, sans pastille : la couleur d'une
          catégorie porte une information, une pastille posée sur le nom d'une
          nature n'en porte aucune — c'est du décor, et le DS §1 n'en veut pas.
          Elle tient aussi sur une seule ligne à 320px, ce que quatre pastilles
          et leurs libellés ne faisaient pas. */}
      <Tile span="4x1" className="justify-between" label={fr.landing.kindsTitle}>
        <Eyebrow icon={CategoriesIcon}>{fr.landing.kindsTitle}</Eyebrow>
        <p className="t-label">{KINDS}</p>
      </Tile>
    </BentoGrid>
  )
}

/* L'ordre du cahier §1 : ce qui rentre, ce qui part, ce qu'on rembourse, ce
   qu'on met de côté. */
const KINDS = [fr.kinds.resource, fr.kinds.charge, fr.kinds.debtShort, fr.kinds.saving].join(' · ')
