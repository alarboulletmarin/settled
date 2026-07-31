import { useRegisterSW } from 'virtual:pwa-register/react'
import { fr } from '@/i18n/fr'
import { Button } from '@/ui/Button'

/**
 * Le service worker est enregistré en mode « prompt » : une nouvelle version
 * ne remplace jamais l'app en cours d'usage sans le dire. Les données étant
 * locales, un rechargement surprise en pleine saisie serait impardonnable.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="surface fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-tile border border-border bg-surface p-4 shadow-tile md:bottom-6">
      <p className="t-body min-w-0 flex-1">{fr.settings.updateAvailable}</p>
      <Button
        size="sm"
        onClick={() => {
          void updateServiceWorker(true)
        }}
      >
        {fr.settings.updateAction}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setNeedRefresh(false)
        }}
      >
        {fr.common.close}
      </Button>
    </div>
  )
}
