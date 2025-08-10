export default function LoadingNewsIndex() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100/60 to-white">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 h-7 w-40 animate-pulse rounded bg-slate-200" />
        <div className="rounded-xl border border-slate-200 bg-white">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4 sm:px-6">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
