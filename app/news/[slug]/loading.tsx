export default function LoadingNewsDetail() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100/60 to-white">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 h-7 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="mb-6 aspect-[16/9] w-full animate-pulse rounded-2xl bg-slate-200" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
