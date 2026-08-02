import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, LINK } from '@/app/AppFooter'
import { LICENSE_URL, REPO_URL, VERSION } from '@/app/meta'
import { LANDING_PATH, STYLEGUIDE_ROUTE } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { DataIcon, HouseholdIcon, InfoIcon, RecurrencesIcon } from '@/ui/Icons'
import { PageTitle } from '@/ui/PageTitle'
import { Tile } from '@/ui/Tile'

/**
 * Ce que l'app dit d'elle-même : ce qu'elle fait, comment elle marche, où vont
 * les données, et d'où vient le code.
 *
 * Elle ne lit jamais le statut du foyer : c'est le routeur qui décide de la
 * coquille — `AppShell` quand la navigation existe, `PlainShell` avant. Une
 * page qui doit connaître l'état de l'app pour savoir quoi afficher redevient
 * un composant de routage.
 *
 * Même gabarit que les réglages — une colonne de tuiles à `max-w-3xl` — parce
 * que c'est le gabarit de tout ce qui se lit plutôt que de se manipuler.
 */
export function AboutPage() {
  return (
    <>
      <PageTitle title={fr.nav.about} />
      <div className="flex max-w-3xl flex-col gap-4">
        <Tile className="gap-3">
          <SectionHead icon={<HouseholdIcon size={18} />} title={fr.about.what} />
          <p className="t-body">{fr.about.whatBody}</p>
          <p className="t-body">{fr.about.whatNotBank}</p>
          <p className="t-body">{fr.about.whatOffline}</p>
        </Tile>

        <Tile className="gap-3">
          <SectionHead icon={<RecurrencesIcon size={18} />} title={fr.about.how} />
          <ul className="flex flex-col gap-3">
            <li className="t-body">{fr.about.howRecurring}</li>
            <li className="t-body">{fr.about.howForecast}</li>
            <li className="t-body">{fr.about.howSplit}</li>
            <li className="t-body">{fr.about.howKinds}</li>
          </ul>
        </Tile>

        <Tile className="gap-3">
          <SectionHead icon={<DataIcon size={18} />} title={fr.about.data} />
          <p className="t-body">{fr.about.dataBody}</p>
          <p className="t-body">{fr.about.dataLimit}</p>
        </Tile>

        {/* Cette tuile *est* le pied de page de cet écran : elle porte déjà le
            dépôt, la licence et la version. Y ajouter l'`AppFooter` de la
            présentation les aurait dits deux fois à trois centimètres d'écart —
            sur mobile, les deux liens GitHub se retrouvaient l'un sous l'autre. */}
        <Tile className="gap-3">
          <SectionHead icon={<InfoIcon size={18} />} title={fr.about.project} />
          <p className="t-body">{fr.about.projectBody}</p>
          <div className="flex flex-wrap items-center gap-x-5">
            <ExternalLink href={REPO_URL}>{fr.about.repo}</ExternalLink>
            <ExternalLink href={LICENSE_URL}>{fr.about.license}</ExternalLink>
            {/* Le styleguide est ici et nulle part ailleurs côté utilisateur :
                c'est un livrable de conception, et son lecteur est celui qui
                vient de lire que le code est ouvert — pas celui qui arrive sur
                la présentation pour savoir ce que fait l'app. */}
            <Link to={STYLEGUIDE_ROUTE.path} className={LINK}>
              {STYLEGUIDE_ROUTE.label}
            </Link>
            <Link to={LANDING_PATH} className={LINK}>
              {fr.about.seeLanding}
            </Link>
          </div>
          <p className="t-axis text-muted">{tpl(fr.about.version, VERSION)}</p>
        </Tile>
      </div>
    </>
  )
}

/** L'en-tête d'une section : un glyphe de repère et un titre, jamais un eyebrow
 *  — ces tuiles portent du texte suivi, pas un chiffre à étiqueter (DS §6). */
function SectionHead({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="t-section flex items-center gap-2">
      {icon}
      {title}
    </h2>
  )
}
