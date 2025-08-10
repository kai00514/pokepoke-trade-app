export default function LoadingNewsIndex() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="h-8 w-56 bg-slate-200 rounded mb-6" />
      <div className="rounded-2xl bg-white shadow divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 sm:p-5">
            <div className="h-4 w-2/3 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </main>
  )
}
