import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { listObligations } from '@/features/obligations/api/obligations-api'
import { Dashboard } from '@/features/obligations/components/dashboard'
import {
  availableLocales,
  buildLocaleHref,
  buildStatusHref,
  filterObligationsByStatus,
  getDictionary,
  normalizeLocale,
  normalizeStatusFilter,
  sortObligationsByDueDate,
} from '@/features/obligations/presentation'

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LocalePage({ params, searchParams }: PageProps) {
  await connection()
  const { locale: localeParam } = await params
  const locale = normalizeLocale(localeParam)
  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const resolvedSearchParams = (await searchParams) ?? {}
  const status = normalizeStatusFilter(
    typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : 'all',
  )
  const allObligations = await listObligations()
  const obligations = sortObligationsByDueDate(filterObligationsByStatus(allObligations, status))

  return (
    <Dashboard
      locale={locale}
      dictionary={dictionary}
      allObligations={allObligations}
      obligations={obligations}
      activeStatus={status}
      buildStatusHref={(nextStatus) => buildStatusHref(locale, nextStatus)}
      renderHeaderActions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
            {availableLocales.map((candidate) => {
              const isActive = candidate === locale
              return (
                <Link
                  key={candidate}
                  href={buildLocaleHref(candidate, status)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'rounded-full px-3 py-1 text-sm font-medium transition',
                    isActive
                      ? 'bg-compliance-primary text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  ].join(' ')}
                >
                  {candidate.toUpperCase()}
                </Link>
              )
            })}
          </div>
          <Link
            href={`/${locale}/obligations/new`}
            className="rounded-full bg-compliance-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:ring-2 focus-visible:ring-compliance-primary"
          >
            {dictionary.actions.newObligation}
          </Link>
        </div>
      }
    />
  )
}
