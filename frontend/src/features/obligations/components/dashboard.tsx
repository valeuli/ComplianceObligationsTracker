import type { ReactNode } from 'react'

import Link from 'next/link'

import { Alert } from '@/components/ui/alert'
import type { Dictionary } from '@/i18n/dictionaries'

import { buildKpis } from '../presentation'
import type { Locale, ObligationSummary, StatusFilter } from '../types'
import { KpiCard } from './kpi-card'
import { ObligationsList } from './obligations-list'

export function Dashboard({
  locale,
  dictionary,
  allObligations,
  obligations,
  activeStatus,
  buildStatusHref,
  renderHeaderActions,
}: Readonly<{
  locale: Locale
  dictionary: Dictionary
  allObligations: ObligationSummary[]
  obligations: ObligationSummary[]
  activeStatus: StatusFilter
  buildStatusHref: (status: StatusFilter) => string
  renderHeaderActions: ReactNode
}>) {
  const kpis = buildKpis(allObligations)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-1">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{dictionary.app.subtitle}</p>
            <h1 className="text-2xl font-semibold text-slate-900">{dictionary.app.title}</h1>
            <p className="max-w-2xl text-sm text-slate-600">{dictionary.app.description}</p>
          </div>
          {renderHeaderActions}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <section aria-label="KPIs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <KpiCard label={dictionary.kpis.total} value={kpis.total} />
          <KpiCard label={dictionary.kpis.pending} value={kpis.pending} />
          <KpiCard label={dictionary.kpis.in_progress} value={kpis.in_progress} />
          <KpiCard label={dictionary.kpis.submitted} value={kpis.submitted} />
          <KpiCard label={dictionary.kpis.overdue} value={kpis.overdue} />
          <KpiCard label={dictionary.kpis.due_30_days} value={kpis.due_30_days} />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600">{dictionary.filters.label}:</span>
            <FilterLink href={buildStatusHref('all')} active={activeStatus === 'all'}>
              {dictionary.filters.all}
            </FilterLink>
            <FilterLink href={buildStatusHref('pending')} active={activeStatus === 'pending'}>
              {dictionary.filters.pending}
            </FilterLink>
            <FilterLink href={buildStatusHref('in_progress')} active={activeStatus === 'in_progress'}>
              {dictionary.filters.in_progress}
            </FilterLink>
            <FilterLink href={buildStatusHref('submitted')} active={activeStatus === 'submitted'}>
              {dictionary.filters.submitted}
            </FilterLink>
            <FilterLink href={buildStatusHref('done')} active={activeStatus === 'done'}>
              {dictionary.filters.done}
            </FilterLink>
          </div>

          {obligations.length === 0 ? (
            <Alert tone="info">
              {activeStatus === 'all' ? dictionary.fields.emptyState : dictionary.fields.noResults}
            </Alert>
          ) : (
            <ObligationsList locale={locale} dictionary={dictionary} obligations={obligations} />
          )}
        </section>
      </main>
    </div>
  )
}

function FilterLink({
  href,
  active,
  children,
}: Readonly<{
  href: string
  active: boolean
  children: ReactNode
}>) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={[
        'rounded-full border px-3 py-1 text-sm font-medium transition',
        active
          ? 'border-compliance-primary bg-compliance-primary text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}
