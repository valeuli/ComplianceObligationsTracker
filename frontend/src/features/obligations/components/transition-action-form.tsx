'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { Dictionary } from '@/i18n/dictionaries'
import { transitionObligationAction } from '@/app/[locale]/obligations/[id]/actions'

import type { ApiErrorCode, Locale, ObligationStatus, TransitionActionState } from '../types'
import { StatusBadge } from './status-badge'

const initialState: TransitionActionState = { status: 'idle' }

export function TransitionActionForm({
  locale,
  obligationId,
  expectedVersion,
  targetStatus,
  dictionary,
}: Readonly<{
  locale: Locale
  obligationId: string
  expectedVersion: number
  targetStatus: ObligationStatus
  dictionary: Dictionary
}>) {
  const router = useRouter()
  const refreshed = useRef(false)
  const [state, formAction, isPending] = useActionState(transitionObligationAction, initialState)

  useEffect(() => {
    if (state.status === 'success' && !refreshed.current) {
      refreshed.current = true
      router.refresh()
    }

    if (state.status !== 'success') {
      refreshed.current = false
    }
  }, [router, state.status])

  const errorState = state.status === 'error' ? state : null
  const errorMessage = errorState ? translateError(errorState.code, dictionary) : null
  const buttonLabel =
    errorState && errorState.code === 'network_error'
      ? dictionary.detail.retry
      : `${dictionary.detail.transitionTo} ${dictionary.statuses[targetStatus]}`

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="obligation_id" value={obligationId} />
      <input type="hidden" name="target_status" value={targetStatus} />
      <input type="hidden" name="expected_version" value={expectedVersion} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={targetStatus} label={dictionary.statuses[targetStatus]} />
          </div>
          <p className="text-sm text-slate-600">{dictionary.detail.transitionTo} {dictionary.statuses[targetStatus]}</p>
        </div>

        <Button type="submit" disabled={isPending} variant="primary" className="min-w-36">
          {isPending ? dictionary.detail.transitioning : buttonLabel}
        </Button>
      </div>

      {errorMessage ? (
        <Alert tone="error">
          <div className="space-y-3">
            <p>{errorMessage}</p>
            <div className="flex flex-wrap gap-2">
              {errorState?.code === 'version_conflict' ? (
                <Button type="button" variant="secondary" onClick={() => router.refresh()}>
                  {dictionary.detail.reloadRecord}
                </Button>
              ) : null}
            </div>
          </div>
        </Alert>
      ) : null}
    </form>
  )
}

function translateError(code: ApiErrorCode, dictionary: Dictionary): string {
  if (code === 'version_conflict') {
    return dictionary.detail.currentRecordChanged
  }

  if (code === 'invalid_transition') {
    return dictionary.detail.invalidTransition
  }

  if (code === 'required_document_missing') {
    return dictionary.detail.documentRequired
  }

  if (code === 'network_error') {
    return dictionary.detail.networkError
  }

  return dictionary.detail.genericError
}
