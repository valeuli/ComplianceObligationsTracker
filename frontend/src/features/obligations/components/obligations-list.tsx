import type { ReactNode } from 'react'

import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, isDueSoon } from '../presentation'
import type { Dictionary } from '@/i18n/dictionaries'

import type { Locale, ObligationSummary } from '../types'
import { StatusBadge } from './status-badge'

export function ObligationsList({
  locale,
  dictionary,
  obligations,
}: Readonly<{
  locale: Locale
  dictionary: Dictionary
  obligations: ObligationSummary[]
}>) {
  if (obligations.length === 0) {
    return (
      <EmptyState
        title={dictionary.fields.emptyState}
        description={dictionary.fields.noResults}
      />
    )
  }

  return (
    <section aria-label={dictionary.app.subtitle} className="space-y-4">
      <ul className="grid gap-4">
        {obligations.map((obligation) => (
          <li
            key={obligation.id}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <Link href={`/${locale}/obligations/${obligation.id}`} className="block focus-visible:rounded-2xl">
              <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] md:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{obligation.title}</h3>
                    <StatusBadge
                      status={obligation.status}
                      label={dictionary.statuses[obligation.status]}
                    />
                  </div>
                  <p className="text-sm text-slate-600">{obligation.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm md:col-span-4 md:grid-cols-4 md:gap-4">
                  <Field label={dictionary.fields.type} value={dictionary.types[obligation.type]} />
                  <Field label={dictionary.fields.owner} value={obligation.owner} />
                  <Field
                    label={dictionary.fields.due_date}
                    value={<time dateTime={obligation.due_date}>{formatDate(obligation.due_date, locale)}</time>}
                  />
                  <Field
                    label={dictionary.fields.overdue}
                    value={
                      <span className={obligation.overdue ? 'font-semibold text-red-700' : 'text-slate-600'}>
                        {obligation.overdue ? dictionary.fields.overdue : '—'}
                      </span>
                    }
                  />
                </div>
              </div>
              {isDueSoon(obligation.due_date, 30) && !obligation.overdue ? (
                <p className="mt-3 text-sm font-medium text-amber-700">{dictionary.fields.dueSoon}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Field({
  label,
  value,
}: Readonly<{
  label: string
  value: string | ReactNode
}>) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-800">{value}</div>
    </div>
  )
}
