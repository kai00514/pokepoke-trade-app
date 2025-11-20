"use client"

import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import CollageGeneratorButton from "@/components/collage/collage-generator-button"
import CollageList from "@/components/collage/collage-list"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"

export default function CollagePage() {
  const { user } = useAuth()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              トップページに戻る
            </Link>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">コラージュ画像生成</h1>
              <LoginPromptModal message="コラージュを生成・管理するにはログインが必要です。" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            タイムラインに戻る
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">コラージュ画像</h1>
                <p className="text-gray-600 mt-2">複数のカードをコラージュにしてXで共有しましょう</p>
              </div>
              <CollageGeneratorButton />
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-purple-800">
                    合計40枚のカード画像を自動で合成して、1つのコラージュ画像を作成できます。生成したコラージュはXに投稿できます。
                  </p>
                </div>
              </div>
            </div>

            {/* Collage List */}
            <CollageList />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
