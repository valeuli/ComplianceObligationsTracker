import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: Readonly<{
  title: string
  description: string
  action?: ReactNode
}>) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </section>
  )
}
