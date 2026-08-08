import { useId } from 'react'
import { VERSION } from '@/app/meta'
import {
  ABOUT_PATH,
  SETTINGS_CATEGORIES_PATH,
  SETTINGS_DATA_PATH,
  SETTINGS_PEOPLE_PATH,
  SETTINGS_STORAGE_PATH,
} from '@/app/routes'
import { fr } from '@/i18n/fr'
import { currencySymbol, tpl } from '@/i18n/format'
import { useCategories, useFamilies, useHouseholdName, useMembers } from '@/store/selectors'
import { useStore } from '@/store/store'
import { Select } from '@/ui/Field'
import { CategoriesIcon, DataIcon, InfoIcon, PeopleIcon, ThemeIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Segmented } from '@/ui/Segmented'
import { SettingsGroup, SettingsRow } from './SettingsRow'

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

/**
 * Le thème, réglable là où on le lit.
 *
 * Il ne descend pas dans une vue : trois positions, un geste, et c'est le
 * réglage qu'on vient changer le plus souvent — l'enfouir d'un cran coûterait
 * plus que la rangée qu'il occupe. La bascule est celle de tout le reste de
 * l'app, à sa place et dans son langage.
 *
 * Elle passe sous le libellé plutôt qu'à sa droite : à 320px, la tuile n'offre
 * qu'environ 250px utiles, et « Clair · Sombre · Système » les prend presque
 * tous.
 */
function ThemeRow() {
  const theme = useStore((s) => s.data.settings.theme)
  const setTheme = useStore((s) => s.setTheme)

  return (
    <SettingsRow
      label={fr.theme.label}
      control={
        <Segmented
          options={THEME_OPTIONS}
          value={theme}
          onChange={setTheme}
          label={fr.theme.label}
          className="w-fit"
        />
      }
    />
  )
}

/**
 * La devise, sur une rangée — et non plus dans une tuile à elle seule.
 *
 * Le sélecteur natif reste le contrôle : sur un téléphone il ouvre la roue du
 * système, qui est ce qu'on sait manipuler à une main, et il n'ajoute ni
 * composant ni dépendance pour six choix. Le champ enveloppant a disparu, pas
 * son étiquette : c'est elle qui donne son nom au sélecteur.
 *
 * Le sélecteur est enveloppé dans une boîte qui ne se rétracte pas, ce qui lui
 * donne la largeur de sa plus longue option : `w-full`, qu'il porte comme tous
 * les contrôles, vaudrait ici toute la rangée et repousserait l'étiquette.
 */
function CurrencyRow() {
  const currency = useStore((s) => s.data.settings.currency)
  const setCurrency = useStore((s) => s.setCurrency)
  const id = useId()

  return (
    <SettingsRow
      label={fr.settings.currency}
      labelFor={id}
      description={fr.settings.currencyHint}
      trailing={
        <Select
          id={id}
          value={currency}
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
      }
    />
  )
}

/**
 * L'entrée des réglages — et rien d'autre.
 *
 * Elle portait toute la gestion de l'app dans une seule colonne : les
 * personnes, le catalogue des catégories déplié famille par famille, le thème,
 * la devise, le stockage, l'export, l'import, le schéma, le jeu d'exemple,
 * l'effacement total et « à propos ». Trois formulaires y restaient ouverts en
 * permanence — ajouter un membre, une catégorie, une famille —, et il fallait
 * traverser quarante-six catégories pour atteindre le choix du thème.
 *
 * Ce qu'on lit ici tient désormais en cinq groupes et sept rangées : qui
 * compose le foyer, quel thème, quelle devise, où sont les catégories, où sont
 * les données, ce qu'est cette app. Chaque rangée dit sa valeur — c'est ce qui
 * fait qu'on n'ouvre que ce qu'on venait changer. Le thème seul reste réglable
 * sur place : trois positions ne méritent pas un écran.
 */
export function SettingsPage() {
  const name = useHouseholdName()
  const members = useMembers()
  const families = useFamilies()
  const categories = useCategories()

  /* Le nom est facultatif — il ne se demande plus au premier lancement. Sans
     lui, la rangée n'a qu'une chose à dire et la dit sur une ligne : reprendre
     « Personnes » sous une étiquette qui porte déjà ce mot aurait fait dire deux
     fois la même chose pour tenir une seconde ligne vide. */
  const named = name.trim() !== ''
  const people =
    members.length === 0
      ? fr.settings.membersNone
      : tpl(members.length > 1 ? fr.settings.membersCount : fr.settings.membersCountOne, members.length)

  const catalogue = [
    tpl(
      categories.length > 1 ? fr.settings.familyCount : fr.settings.familyCountOne,
      categories.length,
    ),
    tpl(
      families.length > 1 ? fr.settings.familiesCount : fr.settings.familiesCountOne,
      families.length,
    ),
  ].join(' · ')

  return (
    <>
      <PageTitle title={fr.nav.settings} />
      <div className="flex max-w-3xl flex-col gap-4">
        <SettingsGroup title={fr.settings.household} icon={PeopleIcon}>
          <SettingsRow
            label={named ? name : people}
            {...(named ? { description: people } : {})}
            to={SETTINGS_PEOPLE_PATH}
          />
        </SettingsGroup>

        {/* Deux réglages d'apparence, deux rangées : ils occupaient deux tuiles
            pleines pour un choix à trois positions et un choix à six. */}
        <SettingsGroup title={fr.settings.preferences} icon={ThemeIcon}>
          <ThemeRow />
          <CurrencyRow />
        </SettingsGroup>

        <SettingsGroup title={fr.settings.organisation} icon={CategoriesIcon}>
          <SettingsRow
            label={fr.settings.categories}
            description={catalogue}
            to={SETTINGS_CATEGORIES_PATH}
          />
        </SettingsGroup>

        {/* « Sur cet appareil » avant « Exporter / importer » : la première dit
            où les données vivent, la seconde comment les en faire sortir. */}
        <SettingsGroup title={fr.settings.data} icon={DataIcon}>
          <SettingsRow
            label={fr.storage.title}
            description={fr.settings.storageSummary}
            to={SETTINGS_STORAGE_PATH}
          />
          <SettingsRow
            label={fr.settings.transfer}
            description={fr.settings.transferSummary}
            to={SETTINGS_DATA_PATH}
          />
        </SettingsGroup>

        {/* La seule porte vers « à propos » sous 1024px : la barre d'onglets ne
            peut pas en porter une sixième sans tronquer un libellé. */}
        <SettingsGroup title={fr.nav.about} icon={InfoIcon}>
          <SettingsRow
            label={fr.app.name}
            description={tpl(fr.settings.aboutSummary, VERSION)}
            to={ABOUT_PATH}
          />
        </SettingsGroup>
      </div>
    </>
  )
}
