import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StyleguidePage } from './styleguide/StyleguidePage'

/** Coquille de la phase 0 : seule la page de styleguide existe encore. */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/styleguide" element={<StyleguidePage />} />
        <Route path="*" element={<Navigate to="/styleguide" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
