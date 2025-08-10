export default function LoadingNewsDetail() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-2/3 bg-slate-200 rounded mb-4" />
        <div className="h-3 w-32 bg-slate-100 rounded mb-6" />
        <div className="w-full h-64 bg-slate-200 rounded-2xl shadow mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    </main>
  )
}
