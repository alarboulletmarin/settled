import type { ReactNode } from 'react'

export function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <header className="flex flex-col gap-1">
        <h2 className="t-section">{title}</h2>
        {note !== undefined && <p className="t-label max-w-prose">{note}</p>}
      </header>
      {children}
    </section>
  )
}

export function SubTitle({ children }: { children: ReactNode }) {
  return <h3 className="t-eyebrow text-muted">{children}</h3>
}
