import { Link } from 'react-router-dom'
import { LANDING_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { tpl } from '@/i18n/format'
import { ChevronLeft } from '@/ui/Icons'
import { Ring } from '@/ui/Ring'

/**
 * L'en-tête des deux questions : le retour, le nom de l'app, et la progression.
 *
 * La progression était une phrase — « Étape 1 sur 2 ». Elle est maintenant
 * l'anneau signature en jauge, à l'épaisseur du DS §6, celle qu'utilisent déjà
 * l'écran de démarrage et les états vides. Le DS §1 le dit ainsi : un seul
 * motif géométrique, décliné. La phrase reste, pour les lecteurs d'écran et
 * parce qu'un anneau ne se compte pas au premier coup d'œil.
 *
 * Le retour n'est pas décoratif : en app installée il n'y a pas de bouton
 * retour du navigateur, et sans lui quelqu'un qui veut relire la présentation
 * ou charger l'exemple n'a plus qu'à répondre ou à fermer.
 */
export function StepProgress({ step, onBack }: { step: 1 | 2; onBack?: () => void }) {
  const label = tpl(fr.onboarding.progress, step)

  return (
    <header className="flex items-center gap-4">
      {onBack === undefined ? (
        <Link to={LANDING_PATH} className={BACK} aria-label={fr.onboarding.backToLanding}>
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <button type="button" onClick={onBack} className={BACK} aria-label={fr.onboarding.backToStep}>
          <ChevronLeft size={18} />
        </button>
      )}

      {/* L'anneau colle à son libellé plutôt que de fuir au bord droit : une
          jauge posée à l'autre bout de la ligne ne se rattache plus à rien. */}
      <Ring size={56} value={step / 2} label={label} srText={label} className="shrink-0" />

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="t-eyebrow text-muted">{fr.app.name}</span>
        <span className="t-label">{tpl(fr.onboarding.step, step)}</span>
      </div>
    </header>
  )
}

const BACK =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-input text-muted hover:bg-surface-2'
