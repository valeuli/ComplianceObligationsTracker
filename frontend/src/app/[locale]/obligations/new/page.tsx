import { notFound } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button'
import { CreateObligationForm } from '@/features/obligations/components/create-obligation-form'
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
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{dictionary.create.title}</p>
              <h1 className="text-2xl font-semibold text-slate-900">{dictionary.create.title}</h1>
              <p className="max-w-3xl text-sm text-slate-600">{dictionary.app.subtitle}</p>
              <p className="max-w-3xl text-sm text-slate-600">{dictionary.create.description}</p>
            </div>

            <ButtonLink href={`/${locale}`} variant="secondary">
              {dictionary.create.backToDashboard}
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <CreateObligationForm locale={locale} dictionary={dictionary} />
      </main>
    </div>
  )
}
