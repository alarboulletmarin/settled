import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { ErrorBoundary } from './app/ErrorBoundary'
/* Importé pour son effet de bord, et importé ici pour qu'il ait lieu avant le
   premier rendu : `beforeinstallprompt` se déclenche une fois, tôt, et ne se
   rejoue pas — un écouteur posé dans un effet React arriverait après lui. */
import './lib/install'
import './styles/index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Élément #root introuvable')

/* La barrière est au-dessus de tout, y compris du routeur : une exception dans
   la coquille elle-même doit encore trouver un écran pour s'afficher. */
createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
