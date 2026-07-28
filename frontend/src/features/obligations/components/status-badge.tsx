import type { ObligationStatus } from '../types'

const statusClasses: Record<ObligationStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  in_progress: 'bg-blue-100 text-blue-900',
  submitted: 'bg-violet-100 text-violet-900',
  done: 'bg-emerald-100 text-emerald-900',
}

export function StatusBadge({
  status,
  label,
}: Readonly<{
  status: ObligationStatus
  label: string
}>) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}>{label}</span>
}
