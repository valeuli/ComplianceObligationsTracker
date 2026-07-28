import type { ReactNode } from 'react'

import { notFound } from 'next/navigation'

import { getObligation, ApiRequestError } from '@/features/obligations/api/obligations-api'
import { ButtonLink } from '@/components/ui/button'
import { DeleteObligationButton } from '@/features/obligations/components/delete-obligation-button'
import { StatusBadge } from '@/features/obligations/components/status-badge'
import { TransitionActionForm } from '@/features/obligations/components/transition-action-form'
import type { ObligationDetail } from '@/features/obligations/types'
import {
  formatDate,
  formatDateTime,
  getDictionary,
  normalizeLocale,
  sortAuditHistoryChronologically,
  translateTransitionReason,
} from '@/features/obligations/presentation'

type PageProps = {
  params: Promise<{ locale: string; id: string }>
}

export default async function ObligationDetailPage({ params }: PageProps) {
  const { locale: localeParam, id } = await params
  const locale = normalizeLocale(localeParam)

  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  let obligation: ObligationDetail

  try {
    obligation = await getObligation(id)
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'not_found') {
      notFound()
    }

    throw error
  }

  const auditHistory = sortAuditHistoryChronologically(obligation.audit_history)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{dictionary.detail.title}</p>
              <h1 className="text-2xl font-semibold text-slate-900">{obligation.title}</h1>
              <p className="max-w-3xl text-sm text-slate-600">{dictionary.detail.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`/${locale}/obligations/${id}/edit`} variant="secondary">
                {dictionary.detail.editObligation}
              </ButtonLink>
              <DeleteObligationButton
                locale={locale}
                obligationId={id}
                obligationTitle={obligation.title}
                dictionary={dictionary}
              />
              <ButtonLink href={`/${locale}`} variant="secondary">
                {dictionary.detail.backToDashboard}
              </ButtonLink>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:px-8">
        <section className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  {dictionary.detail.overview}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={obligation.status} label={dictionary.statuses[obligation.status]} />
                  <span
                    className={
                      obligation.overdue
                        ? 'rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800'
                        : 'rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800'
                    }
                  >
                    {obligation.overdue ? dictionary.fields.overdue : dictionary.detail.onTime}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                {dictionary.fields.currentVersion}: <span className="font-semibold text-slate-800">{obligation.version}</span>
              </p>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailItem label={dictionary.fields.type} value={dictionary.types[obligation.type]} />
              <DetailItem label={dictionary.fields.owner} value={obligation.owner} />
              <DetailItem
                label={dictionary.fields.due_date}
                value={<time dateTime={obligation.due_date}>{formatDate(obligation.due_date, locale)}</time>}
              />
              <DetailItem label={dictionary.fields.documentName} value={obligation.document_name ?? dictionary.detail.noDocument} />
              <DetailItem label={dictionary.fields.companyTaxIdMasked} value={obligation.company_tax_id_masked} />
            </dl>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">{obligation.description}</p>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  {dictionary.detail.transitions}
                </p>
                <p className="mt-1 text-sm text-slate-600">{dictionary.detail.selectAvailableTransition}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {obligation.transition_options.length === 0 ? (
                <p className="text-sm text-slate-600">{dictionary.detail.noTransitions}</p>
              ) : (
                obligation.transition_options.map((option) =>
                  option.enabled ? (
                    <TransitionActionForm
                      key={option.status}
                      locale={locale}
                      obligationId={id}
                      expectedVersion={obligation.version}
                      targetStatus={option.status}
                      dictionary={dictionary}
                    />
                  ) : (
                    <div
                      key={option.status}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-80"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <StatusBadge status={option.status} label={dictionary.statuses[option.status]} />
                          <p className="text-sm text-slate-600">
                            {dictionary.detail.transitionDisabled}
                            {option.reason ? ` · ${translateTransitionReason(option.reason, dictionary)}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="cursor-not-allowed rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-400"
                        >
                          {dictionary.detail.transitionTo} {dictionary.statuses[option.status]}
                        </button>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </article>
        </section>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  {dictionary.detail.auditTrail}
                </p>
                <p className="mt-1 text-sm text-slate-600">{dictionary.detail.auditTrailDescription}</p>
              </div>
            </div>

            <div className="mt-4">
              {auditHistory.length === 0 ? (
                <p className="text-sm text-slate-600">{dictionary.detail.noAuditTrail}</p>
              ) : (
                <ol className="space-y-3">
                  {auditHistory.map((entry) => (
                    <li key={`${entry.previous_status}-${entry.new_status}-${entry.changed_at}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {dictionary.statuses[entry.previous_status]} → {dictionary.statuses[entry.new_status]}
                      </p>
                      <time
                        dateTime={entry.changed_at}
                        className="mt-1 block text-sm text-slate-600"
                      >
                        {formatDateTime(entry.changed_at, locale)}
                      </time>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </article>
        </aside>
      </main>
    </div>
  )
}

function DetailItem({
  label,
  value,
}: Readonly<{
  label: string
  value: ReactNode
}>) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  )
}
