export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading obligations dashboard</span>
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
