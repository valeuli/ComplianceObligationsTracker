'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import type { Dictionary } from '@/i18n/dictionaries'

import { deleteObligationAction } from '@/app/[locale]/obligations/[id]/actions'

import type { DeleteObligationActionState, Locale } from '../types'

const initialState: DeleteObligationActionState = { status: 'idle' }

export function DeleteObligationButton({
  locale,
  obligationId,
  obligationTitle,
  dictionary,
}: Readonly<{
  locale: Locale
  obligationId: string
  obligationTitle: string
  dictionary: Dictionary
}>) {
  const titleId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(deleteObligationAction, initialState)

  const errorMessage =
    state.status === 'error'
      ? state.code === 'not_found'
        ? dictionary.detail.recordNotFound
        : state.code === 'network_error'
          ? dictionary.detail.networkError
          : dictionary.detail.genericError
      : null

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function openModal() {
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    window.setTimeout(() => {
      triggerButtonRef.current?.focus()
    }, 0)
  }

  return (
    <>
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-compliance-primary"
      >
        {dictionary.detail.deleteObligation}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isPending) {
              closeModal()
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl outline-none sm:p-8"
          >
            <form action={formAction} className="space-y-5">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="obligation_id" value={obligationId} />

              <div className="space-y-3">
                <h2 id={titleId} className="text-xl font-semibold text-slate-900">
                  {dictionary.detail.deleteTitle}
                </h2>
                <p className="text-sm text-slate-700">
                  {dictionary.detail.deleteConfirmMessage.replace('{obligationTitle}', obligationTitle)}
                </p>
                <p className="text-sm text-slate-600">{dictionary.detail.deleteConfirmWarning}</p>
              </div>

              {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  ref={cancelButtonRef}
                  type="button"
                  disabled={isPending}
                  onClick={closeModal}
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-compliance-primary sm:w-auto"
                >
                  {dictionary.detail.cancelDelete}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex w-full items-center justify-center rounded-full border border-red-300 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-compliance-primary sm:w-auto"
                >
                  {isPending ? dictionary.detail.deleting : dictionary.detail.confirmDelete}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
