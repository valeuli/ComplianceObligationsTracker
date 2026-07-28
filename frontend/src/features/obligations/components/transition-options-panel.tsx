import type { Dictionary } from '@/i18n/dictionaries'

import { StatusBadge } from './status-badge'
import { TransitionActionForm } from './transition-action-form'
import type { Locale, TransitionOption } from '../types'
import { translateTransitionReason } from '../presentation'

export function TransitionOptionsPanel({
  locale,
  obligationId,
  expectedVersion,
  transitionOptions,
  dictionary,
}: Readonly<{
  locale: Locale
  obligationId: string
  expectedVersion: number
  transitionOptions: readonly TransitionOption[]
  dictionary: Dictionary
}>) {
  return (
    <div className="mt-4 grid gap-3">
      {transitionOptions.length === 0 ? (
        <p className="text-sm text-slate-600">{dictionary.detail.noTransitions}</p>
      ) : (
        transitionOptions.map((option) =>
          option.enabled ? (
            <TransitionActionForm
              key={option.status}
              locale={locale}
              obligationId={obligationId}
              expectedVersion={expectedVersion}
              targetStatus={option.status}
              dictionary={dictionary}
            />
          ) : (
            <div key={option.status} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-80">
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
  )
}
