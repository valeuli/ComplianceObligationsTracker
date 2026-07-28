'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-red-200 bg-white p-6 text-red-800 shadow-sm">
        <h2 className="text-lg font-semibold">We could not load the dashboard.</h2>
        <p className="mt-2 text-sm text-red-700">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
