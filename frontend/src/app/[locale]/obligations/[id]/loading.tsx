export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800" aria-busy="true" aria-live="polite">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-8 w-72 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full max-w-3xl animate-pulse rounded bg-slate-200" />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:px-8">
        <section className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
