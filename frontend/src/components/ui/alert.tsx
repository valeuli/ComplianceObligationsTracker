import type { ReactNode } from 'react'

export function Alert({
  children,
  tone = 'info',
}: Readonly<{
  children: ReactNode
  tone?: 'info' | 'error'
}>) {
  const toneClasses = tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-700'

  return <div className={`rounded-2xl border p-4 text-sm shadow-sm ${toneClasses}`}>{children}</div>
}
