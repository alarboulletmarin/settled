import { Link } from 'react-router-dom'
import { ABOUT_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { currencySymbol } from '@/i18n/format'
import { useStore } from '@/store/store'
import { Eyebrow } from '@/ui/Eyebrow'
import { Field, Select } from '@/ui/Field'
import { BalanceIcon, InfoIcon, ThemeIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Segmented } from '@/ui/Segmented'
import { Tile } from '@/ui/Tile'
import { CategoriesSection } from './CategoriesSection'
import { DataSection } from './DataSection'
import { HouseholdSection } from './HouseholdSection'
import { StorageSection } from './StorageSection'

const THEME_OPTIONS = [
  { value: 'light' as const, label: fr.theme.light },
  { value: 'dark' as const, label: fr.theme.dark },
  { value: 'system' as const, label: fr.theme.system },
]

/* Les devises des pays où l'on tient ses comptes en français, plus les deux
   qu'un foyer francophone croise le plus souvent. Une liste et non un champ
   libre : `Intl` accepte n'importe quelle chaîne de trois lettres et rend
   alors le code brut en guise de symbole — sur chaque montant de l'app, sans
   moyen de revenir autrement qu'en retrouvant ce même champ. */
const CURRENCIES = ['EUR', 'CHF', 'CAD', 'XPF', 'GBP', 'USD']

function ThemeSection() {
  const theme = useStore((s) => s.data.settings.theme)
  const setTheme = useStore((s) => s.setTheme)
  return (
    <Tile className="gap-3">
      <Eyebrow icon={ThemeIcon}>{fr.theme.label}</Eyebrow>
      <p className="t-label">{fr.settings.themeHint}</p>
      <Segmented
        options={THEME_OPTIONS}
        value={theme}
        onChange={setTheme}
        label={fr.theme.label}
        className="w-fit"
      />
    </Tile>
  )
}

/**
 * La devise sous laquelle les montants se lisent.
 *
 * Elle était stockée, validée, migrée, exportée, et lue par **tous** les
 * montants de l'app — mais réglable nulle part : elle valait « EUR » à
 * perpétuité, sans que rien ne le dise. Un champ qui décide de l'affichage de
 * chaque chiffre et qu'aucun écran n'atteint est un réglage en panne, pas un
 * défaut assumé.
 *
 * Ce n'est pas la multi-devise, que le cahier §2 laisse hors v1, et l'écran le
 * dit : aucun taux n'est appliqué, rien n'est converti, les centimes saisis
 * restent les mêmes centimes. Seul le symbole change. Le dire ici évite
 * exactement le contresens qu'un sélecteur de devise invite à faire.
 *
 * Une liste courte plutôt qu'un champ libre : `Intl` accepte n'importe quel
 * code ISO, y compris ceux qu'on tape de travers, et rend alors le code brut à
 * la place du symbole sur chaque montant de l'app.
 */
function CurrencySection() {
  const currency = useStore((s) => s.data.settings.currency)
  const setCurrency = useStore((s) => s.setCurrency)

  return (
    <Tile className="gap-3">
      <Eyebrow icon={BalanceIcon}>{fr.settings.currency}</Eyebrow>
      <p className="t-label">{fr.settings.currencyHint}</p>
      <Field label={fr.settings.currency}>
        {(id) => (
          <Select
            id={id}
            value={currency}
            className="w-fit"
            onChange={(event) => {
              setCurrency(event.target.value)
            }}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {`${code} · ${currencySymbol(code)}`}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </Tile>
  )
}

/**
 * Après la tuile des données, et non avant : sa triple confirmation clôt un
 * sujet, pas la page, et « à propos » est ce qu'on lit quand on n'a plus rien à
 * régler. C'est surtout **la seule porte vers `/a-propos` sous 1024px** — la
 * barre d'onglets ne peut pas en porter une sixième sans tronquer un libellé.
 */
function AboutSection() {
  return (
    <Tile className="gap-3">
      <Eyebrow icon={InfoIcon}>{fr.nav.about}</Eyebrow>
      <p className="t-label">{fr.about.whatBody}</p>
      <Link
        to={ABOUT_PATH}
        className="t-label inline-flex min-h-11 w-fit items-center rounded-input underline underline-offset-2"
      >
        {fr.settings.aboutLink}
      </Link>
    </Tile>
  )
}

export function SettingsPage() {
  return (
    <>
      <PageTitle title={fr.nav.settings} />
      <div className="flex max-w-3xl flex-col gap-4">
        <HouseholdSection />
        <CategoriesSection />
        <ThemeSection />
        {/* Juste après le thème : ce sont les deux réglages d'apparence, et
            celui-ci n'en est un que parce qu'aucune conversion n'a lieu. */}
        <CurrencySection />
        {/* Avant les données : celle-ci dit où elles vivent, la suivante
            comment les en faire sortir — et se termine sur un effacement, qui
            clôt un sujet plutôt qu'il n'en ouvre un. */}
        <StorageSection />
        <DataSection />
        <AboutSection />
      </div>
    </>
  )
}
