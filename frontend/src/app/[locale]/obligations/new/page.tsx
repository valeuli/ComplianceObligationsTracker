import { notFound } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button'
import { getDictionary, normalizeLocale } from '@/features/obligations/presentation'

type PageProps = {
  params: Promise<{ locale: string }>
}

export default async function NewObligationPage({ params }: PageProps) {
  const { locale: localeParam } = await params
  const locale = normalizeLocale(localeParam)

  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">{dictionary.detail.title}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{dictionary.actions.newObligation}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {locale === 'es'
            ? 'La creación de obligaciones todavía no está implementada.'
            : 'Creating obligations is not implemented yet.'}
        </p>

        <div className="mt-6">
          <ButtonLink href={`/${locale}`} variant="secondary">
            {dictionary.detail.backToDashboard}
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
