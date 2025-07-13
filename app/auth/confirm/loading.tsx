import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md w-full">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">読み込み中...</h1>
        <p className="text-gray-600">しばらくお待ちください</p>
      </div>
    </div>
  )
}
