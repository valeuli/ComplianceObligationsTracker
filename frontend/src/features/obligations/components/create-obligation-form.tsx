'use client'

import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { Dictionary } from '@/i18n/dictionaries'

import { createObligationAction } from '@/app/[locale]/obligations/new/actions'

import type { CreateObligationActionState, Locale } from '../types'

const initialState: CreateObligationActionState = { status: 'idle' }

export function CreateObligationForm({
  locale,
  dictionary,
}: Readonly<{
  locale: Locale
  dictionary: Dictionary
}>) {
  const [requiresDocument, setRequiresDocument] = useState(false)
  const [state, formAction, isPending] = useActionState(createObligationAction, initialState)

  const errorMessage =
    state.status === 'error'
      ? state.code === 'validation_error'
        ? dictionary.create.errors.validation
        : state.code === 'network_error'
          ? dictionary.create.errors.network
          : dictionary.create.errors.api
      : null

  return (
    <form action={formAction} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="locale" value={locale} />

      <fieldset className="space-y-6" disabled={isPending}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="type" className="block text-sm font-medium text-slate-700">
              {dictionary.create.fields.type}
            </label>
            <p className="mt-1 text-sm text-slate-500">{dictionary.create.help.type}</p>
            <select
              id="type"
              name="type"
              required
              defaultValue=""
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            >
              <option value="" disabled>
                {dictionary.create.fields.type}
              </option>
              <option value="annual_report">{dictionary.types.annual_report}</option>
              <option value="franchise_tax">{dictionary.types.franchise_tax}</option>
              <option value="boi_report">{dictionary.types.boi_report}</option>
              <option value="registered_agent_renewal">{dictionary.types.registered_agent_renewal}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
              {dictionary.create.fields.title}
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={150}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              {dictionary.create.fields.description}
            </label>
            <textarea
              id="description"
              name="description"
              required
              maxLength={2000}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-slate-700">
              {dictionary.create.fields.dueDate}
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              required
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>

          <div>
            <label htmlFor="owner" className="block text-sm font-medium text-slate-700">
              {dictionary.create.fields.owner}
            </label>
            <input
              id="owner"
              name="owner"
              type="text"
              required
              maxLength={120}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700" htmlFor="requires_document">
              <input
                id="requires_document"
                name="requires_document"
                type="checkbox"
                checked={requiresDocument}
                onChange={(event) => setRequiresDocument(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-compliance-primary focus:ring-compliance-primary"
              />
              {dictionary.create.fields.requiresDocument}
            </label>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="document_name" className="block text-sm font-medium text-slate-700">
              {dictionary.create.fields.documentName}
            </label>
            <p className="mt-1 text-sm text-slate-500">
              {requiresDocument ? dictionary.create.help.documentRequired : dictionary.create.help.documentOptional}
            </p>
            <input
              id="document_name"
              name="document_name"
              type="text"
              maxLength={255}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="company_tax_id" className="block text-sm font-medium text-slate-700">
              {dictionary.create.fields.companyTaxId}
            </label>
            <p className="mt-1 text-sm text-slate-500">{dictionary.create.help.companyTaxId}</p>
            <input
              id="company_tax_id"
              name="company_tax_id"
              type="text"
              required
              minLength={4}
              maxLength={80}
              autoComplete="off"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>
        </div>
      </fieldset>

      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{dictionary.create.help.companyTaxId}</p>
        <Button type="submit" disabled={isPending} variant="primary">
          {isPending ? dictionary.create.submitting : dictionary.create.submit}
        </Button>
      </div>
    </form>
  )
}
