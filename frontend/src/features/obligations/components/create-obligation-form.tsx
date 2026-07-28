'use client'

import type { ReactNode } from 'react'
import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { Dictionary } from '@/i18n/dictionaries'

import { createObligationAction } from '@/app/[locale]/obligations/new/actions'

import type {
  CreateObligationActionState,
  Locale,
  ObligationMutationActionState,
  ObligationType,
} from '../types'

type UpsertMode = 'create' | 'edit'

export type ObligationUpsertValues = Readonly<{
  type: ObligationType | ''
  title: string
  description: string
  due_date: string
  owner: string
  requires_document: boolean
  document_name: string | null
  company_tax_id: string
}>

type UpsertAction = (
  previousState: ObligationMutationActionState,
  formData: FormData,
) => Promise<ObligationMutationActionState>

const createInitialValues: ObligationUpsertValues = {
  type: '',
  title: '',
  description: '',
  due_date: '',
  owner: '',
  requires_document: false,
  document_name: null,
  company_tax_id: '',
}

const createInitialState: CreateObligationActionState = { status: 'idle' }

export function CreateObligationForm({
  locale,
  dictionary,
}: Readonly<{
  locale: Locale
  dictionary: Dictionary
}>) {
  return (
    <ObligationUpsertForm
      locale={locale}
      dictionary={dictionary}
      mode="create"
      action={createObligationAction}
      initialValues={createInitialValues}
      initialState={createInitialState}
    />
  )
}

export function ObligationUpsertForm({
  locale,
  dictionary,
  mode,
  action,
  initialValues,
  initialState,
  hiddenFields,
}: Readonly<{
  locale: Locale
  dictionary: Dictionary
  mode: UpsertMode
  action: UpsertAction
  initialValues: ObligationUpsertValues
  initialState: ObligationMutationActionState
  hiddenFields?: ReactNode
}>) {
  const router = useRouter()
  const [requiresDocument, setRequiresDocument] = useState(initialValues.requires_document)
  const [state, formAction, isPending] = useActionState(action, initialState)

  const copy = mode === 'create' ? dictionary.create : dictionary.edit
  const errorMessage =
    state.status === 'error'
      ? state.code === 'validation_error'
        ? copy.errors.validation
        : state.code === 'network_error'
          ? copy.errors.network
          : state.code === 'version_conflict'
            ? dictionary.detail.currentRecordChanged
            : state.code === 'not_found'
              ? dictionary.detail.recordNotFound
              : copy.errors.api
      : null

  return (
    <form action={formAction} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="locale" value={locale} />
      {hiddenFields ?? null}

      <fieldset className="space-y-6" disabled={isPending}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="type" className="block text-sm font-medium text-slate-700">
              {copy.fields.type}
            </label>
            <p className="mt-1 text-sm text-slate-500">{copy.help.type}</p>
            <select
              id="type"
              name="type"
              required
              defaultValue={initialValues.type}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            >
              <option value="" disabled>
                {copy.fields.type}
              </option>
              <option value="annual_report">{dictionary.types.annual_report}</option>
              <option value="franchise_tax">{dictionary.types.franchise_tax}</option>
              <option value="boi_report">{dictionary.types.boi_report}</option>
              <option value="registered_agent_renewal">{dictionary.types.registered_agent_renewal}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
              {copy.fields.title}
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={150}
              defaultValue={initialValues.title}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              {copy.fields.description}
            </label>
            <textarea
              id="description"
              name="description"
              required
              maxLength={2000}
              rows={5}
              defaultValue={initialValues.description}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-slate-700">
              {copy.fields.dueDate}
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              required
              defaultValue={initialValues.due_date}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>

          <div>
            <label htmlFor="owner" className="block text-sm font-medium text-slate-700">
              {copy.fields.owner}
            </label>
            <input
              id="owner"
              name="owner"
              type="text"
              required
              maxLength={120}
              defaultValue={initialValues.owner}
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
              {copy.fields.requiresDocument}
            </label>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="document_name" className="block text-sm font-medium text-slate-700">
              {copy.fields.documentName}
            </label>
            <p className="mt-1 text-sm text-slate-500">
              {requiresDocument ? copy.help.documentRequired : copy.help.documentOptional}
            </p>
            <input
              id="document_name"
              name="document_name"
              type="text"
              maxLength={255}
              defaultValue={initialValues.document_name ?? ''}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="company_tax_id" className="block text-sm font-medium text-slate-700">
              {copy.fields.companyTaxId}
            </label>
            <p className="mt-1 text-sm text-slate-500">{copy.help.companyTaxId}</p>
            <input
              id="company_tax_id"
              name="company_tax_id"
              type="text"
              required={mode === 'create'}
              minLength={4}
              maxLength={80}
              autoComplete="off"
              defaultValue={initialValues.company_tax_id}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-compliance-primary focus:outline-none focus:ring-2 focus:ring-compliance-primary/20"
            />
          </div>
        </div>
      </fieldset>

      {errorMessage ? (
        <Alert tone="error">
          <div className="space-y-3">
            <p>{errorMessage}</p>
            {state.status === 'error' && state.code === 'version_conflict' ? (
              <Button type="button" variant="secondary" onClick={() => router.refresh()}>
                {dictionary.detail.reloadRecord}
              </Button>
            ) : null}
          </div>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="submit" disabled={isPending} variant="primary">
          {isPending ? copy.submitting : copy.submit}
        </Button>
      </div>
    </form>
  )
}
