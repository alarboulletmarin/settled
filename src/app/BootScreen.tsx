import { fr } from '@/i18n/fr'
import { Ring } from '@/ui/Ring'

/** Le temps que le document soit relu. Une seconde au plus, en général. */
export function BootScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5" role="status">
      <Ring size={72} thickness={12} value={0} label={fr.shell.loading} />
      <p className="t-label">{fr.shell.loading}</p>
    </div>
  )
}
