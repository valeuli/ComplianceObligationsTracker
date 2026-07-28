'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { getDictionary, normalizeLocale } from '@/features/obligations/presentation'

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  const params = useParams<{ locale?: string }>()
  const locale = normalizeLocale(params.locale) ?? 'es'
  const dictionary = getDictionary(locale)

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{dictionary.detail.genericError}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={reset}>
            {dictionary.detail.retry}
          </Button>
        </div>
      </div>
    </div>
  )
}
