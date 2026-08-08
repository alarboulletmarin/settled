/* ============================================================================
 * Les écrans des réglages, réunis derrière un seul spécificateur.
 *
 * `app/Routes.tsx` les charge tous par ce module-ci, et donc dans un seul
 * morceau : ouvrir « Réglages » amène la section entière, et descendre vers les
 * catégories puis vers une famille n'attend plus le réseau à chaque pas. Un
 * `import()` par écran aurait produit sept morceaux dont six se chargent
 * toujours à la suite du premier.
 *
 * Rien d'autre ne passe par ici : les composants s'importent entre eux par leur
 * fichier, comme partout ailleurs dans l'app.
 * ==========================================================================*/

export { AppearancePage } from './AppearancePage'
export { CategoriesPage } from './CategoriesPage'
export { CategoryNewPage, FamilyNewPage } from './CategoryForms'
export { DataPage } from './DataPage'
export { FamilyPage } from './FamilyPage'
export { MemberPage } from './MemberPage'
export { PeoplePage } from './PeoplePage'
export { SettingsPage } from './SettingsPage'
export { StoragePage } from './StoragePage'
