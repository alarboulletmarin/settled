/**
 * Déclaration du module virtuel de vite-plugin-pwa.
 *
 * On ne référence pas `vite-plugin-pwa/react` dans `types` : cette chaîne tire
 * les types de workbox, écrits pour un service worker, et le compilateur de
 * l'app réclamerait alors la lib `WebWorker` — donc `self`, `ExtendableEvent`
 * et le reste des globales d'un worker dans du code de navigateur.
 * La surface réellement utilisée tient en une fonction.
 */
declare module 'virtual:pwa-register/react' {
  export type RegisterSWOptions = {
    immediate?: boolean
    onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: unknown) => void
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, (value: boolean) => void]
    offlineReady: [boolean, (value: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
