import type { ReactNode } from 'react'

/** Titre d'écran, avec sa zone d'actions à droite. */
export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="t-section">{title}</h1>
      {children !== undefined && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
