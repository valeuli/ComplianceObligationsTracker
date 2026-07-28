import { notFound } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button'
import { getObligation, ApiRequestError } from '@/features/obligations/api/obligations-api'
import { ObligationUpsertForm } from '@/features/obligations/components/create-obligation-form'
import { getDictionary, normalizeLocale } from '@/features/obligations/presentation'
import type { ObligationDetail } from '@/features/obligations/types'

import { updateObligationAction } from './actions'

type PageProps = {
  params: Promise<{ locale: string; id: string }>
}

export default async function EditObligationPage({ params }: PageProps) {
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{dictionary.edit.title}</p>
              <h1 className="text-2xl font-semibold text-slate-900">{obligation.title}</h1>
              <p className="max-w-3xl text-sm text-slate-600">{dictionary.edit.description}</p>
            </div>

            <ButtonLink href={`/${locale}/obligations/${id}`} variant="secondary">
              {dictionary.edit.backToDetail}
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <ObligationUpsertForm
          locale={locale}
          dictionary={dictionary}
          mode="edit"
          action={updateObligationAction}
          hiddenFields={
            <>
              <input type="hidden" name="obligation_id" value={id} />
              <input type="hidden" name="expected_version" value={String(obligation.version)} />
            </>
          }
          initialValues={{
            type: obligation.type,
            title: obligation.title,
            description: obligation.description,
            due_date: obligation.due_date,
            owner: obligation.owner,
            requires_document: obligation.requires_document,
            document_name: obligation.document_name,
            company_tax_id: '',
          }}
          initialState={{ status: 'idle' }}
        />
      </main>
    </div>
  )
}
