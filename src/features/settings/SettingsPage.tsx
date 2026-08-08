import { useId } from 'react'
import { VERSION } from '@/app/meta'
import {
  ABOUT_PATH,
  SETTINGS_APPEARANCE_PATH,
  SETTINGS_CATEGORIES_PATH,
  SETTINGS_DATA_PATH,
  SETTINGS_PEOPLE_PATH,
  SETTINGS_STORAGE_PATH,
} from '@/app/routes'
import type { PaletteSetting, ThemeSetting } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { currencySymbol, tpl } from '@/i18n/format'
import { useCategories, useFamilies, useHouseholdName, useMembers } from '@/store/selectors'
import { useStore } from '@/store/store'
import { Select } from '@/ui/Field'
import { CategoriesIcon, DataIcon, InfoIcon, PeopleIcon, ThemeIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Row, RowGroup } from '@/ui/RowGroup'

const THEME_NAME: Record<ThemeSetting, string> = {
  light: fr.theme.light,
  dark: fr.theme.dark,
  system: fr.theme.system,
}

const PALETTE_NAME: Record<PaletteSetting, string> = {
  classique: fr.palettes.classique,
  monochrome: fr.palettes.monochrome,
  douce: fr.palettes.douce,
  vive: fr.palettes.vive,
  neutre: fr.palettes.neutre,
  contrastee: fr.palettes.contrastee,
}

/* Les devises des pays où l'on tient ses comptes en français, plus les deux
   qu'un foyer francophone croise le plus souvent. Une liste et non un champ
   libre : `Intl` accepte n'importe quelle chaîne de trois lettres et rend
   alors le code brut en guise de symbole — sur chaque montant de l'app, sans
   moyen de revenir autrement qu'en retrouvant ce même champ. */
const CURRENCIES = ['EUR', 'CHF', 'CAD', 'XPF', 'GBP', 'USD']

/**
 * L'apparence : une rangée qui dit sa valeur, et mène à sa vue.
 *
 * Le thème était réglable ici même, et l'argument tenait : trois positions, un
 * geste, l'enfouir d'un cran aurait coûté plus que la rangée qu'il occupait. Il
 * ne tient plus depuis qu'il y a deux réglages, dont un qui ne se choisit pas à
 * la lecture de son nom — six palettes se regardent avant de se prendre, et six
 * aperçus ne tiennent pas dans les 250px utiles d'une rangée à 320px. Le thème
 * suit la palette plutôt que de rester seul : les régler à deux endroits, dont
 * un sans aperçu, aurait été le pire des deux.
 *
 * La rangée dit la **préférence**, pas le thème résolu : « Système » est ce
 * qu'on a choisi, et l'afficher « Clair » ferait croire à un réglage figé.
 */
function AppearanceRow() {
  const theme = useStore((s) => s.data.settings.theme)
  const palette = useStore((s) => s.data.settings.palette)

  return (
    <Row
      label={fr.appearance.title}
      description={tpl(fr.settings.appearanceSummary, THEME_NAME[theme], PALETTE_NAME[palette])}
      to={SETTINGS_APPEARANCE_PATH}
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
    <Row
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
 * compose le foyer, quelle apparence, quelle devise, où sont les catégories, où
 * sont les données, ce qu'est cette app. Chaque rangée dit sa valeur — c'est ce
 * qui fait qu'on n'ouvre que ce qu'on venait changer.
 *
 * La devise est le dernier réglage à se faire sur place, et le seul : six codes
 * dans un sélecteur natif n'ont rien à montrer qu'une vue rendrait mieux. Le
 * thème y était aussi tant qu'il était seul de son espèce ; il a suivi la
 * palette dans `/reglages/apparence` le jour où il a cessé de l'être.
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
        <RowGroup title={fr.settings.household} icon={PeopleIcon}>
          <Row
            label={named ? name : people}
            {...(named ? { description: people } : {})}
            to={SETTINGS_PEOPLE_PATH}
          />
        </RowGroup>

        {/* Ce qui règle la présentation, et rien de plus : l'apparence mène à sa
            vue, la devise se change ici même. */}
        <RowGroup title={fr.settings.preferences} icon={ThemeIcon}>
          <AppearanceRow />
          <CurrencyRow />
        </RowGroup>

        <RowGroup title={fr.settings.organisation} icon={CategoriesIcon}>
          <Row
            label={fr.settings.categories}
            description={catalogue}
            to={SETTINGS_CATEGORIES_PATH}
          />
        </RowGroup>

        {/* « Sur cet appareil » avant « Exporter / importer » : la première dit
            où les données vivent, la seconde comment les en faire sortir. */}
        <RowGroup title={fr.settings.data} icon={DataIcon}>
          <Row
            label={fr.storage.title}
            description={fr.settings.storageSummary}
            to={SETTINGS_STORAGE_PATH}
          />
          <Row
            label={fr.settings.transfer}
            description={fr.settings.transferSummary}
            to={SETTINGS_DATA_PATH}
          />
        </RowGroup>

        {/* La seule porte vers « à propos » sous 1024px : la barre d'onglets ne
            peut pas en porter une sixième sans tronquer un libellé. */}
        <RowGroup title={fr.nav.about} icon={InfoIcon}>
          <Row
            label={fr.app.name}
            description={tpl(fr.settings.aboutSummary, VERSION)}
            to={ABOUT_PATH}
          />
        </RowGroup>
      </div>
    </>
  )
}
