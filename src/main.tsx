/* ============================================================================
 * Tout compte fait — suivi des finances du foyer, sans compte ni serveur.
 * Copyright (C) 2026 Andréa Larboullet Marin
 *
 * Ce programme est un logiciel libre : vous pouvez le redistribuer et/ou le
 * modifier selon les termes de la GNU Affero General Public License, telle que
 * publiée par la Free Software Foundation, en version 3 ou — à votre choix —
 * toute version ultérieure.
 *
 * Il est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ;
 * sans même la garantie implicite de QUALITÉ MARCHANDE ou d'ADÉQUATION À UN
 * USAGE PARTICULIER. Voir la GNU Affero General Public License pour plus de
 * détails. Vous devriez en avoir reçu une copie avec ce programme ; sinon, voir
 * <https://www.gnu.org/licenses/>.
 *
 * **La notice est ici et nulle part ailleurs.** La FSF recommande de la poser
 * en tête de chaque fichier source ; ce n'est pas une condition de validité, et
 * cent cinquante en-têtes identiques diraient *quoi* et jamais *pourquoi* — la
 * règle de commentaire de ce dépôt les refuse. Ce fichier-ci est le point
 * d'entrée : c'est le seul dont la lecture est garantie.
 *
 * Le texte intégral est dans `LICENSE`, et la source du programme tel qu'il
 * tourne est à l'adresse que `src/app/meta.ts` porte — ce que l'article 13
 * exige d'une app servie par le réseau.
 * ==========================================================================*/

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
