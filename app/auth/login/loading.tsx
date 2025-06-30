export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-900 border-t-transparent dark:border-gray-50" />
        <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
      </div>
    </div>
  )
}
