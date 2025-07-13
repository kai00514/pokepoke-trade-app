"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle, Star } from "lucide-react"
import Link from "next/link"

export default function DecksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDetailedSearchOpen, setIsDetailedSearchOpen] = useState(false)

  const handleSearch = () => {
    // Implement search logic here
    console.log("Searching for:", searchTerm)
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-4">デッキ検索</h1>

      {/* デッキを投稿するボタンとお気に入りボタン */}
      <div className="my-6 flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button
          asChild
          className="bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
        >
          <Link href="/decks/create">
            <PlusCircle className="mr-2 h-5 w-5" />
            デッキを投稿する
          </Link>
        </Button>

        <Button
          asChild
          className="bg-yellow-500 hover:bg-yellow-600 text-white text-base font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
        >
          <Link href="/favorites">
            <Star className="mr-2 h-5 w-5" />
            お気に入り
          </Link>
        </Button>
      </div>

      {/* 検索フォーム - スマホでも横並び */}
      <div className="mb-6 w-full max-w-4xl mx-auto">
        <div className="flex flex-row items-center gap-2 w-full">
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              placeholder="キーワード検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <Button onClick={handleSearch} className="whitespace-nowrap px-3 py-2 text-sm flex-shrink-0">
            検索
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDetailedSearchOpen(true)}
            className="whitespace-nowrap px-2 py-2 text-sm flex-shrink-0"
          >
            詳細検索
          </Button>
        </div>
      </div>

      {/* Detailed Search Modal (Placeholder) */}
      {isDetailedSearchOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">詳細検索</h2>
            <p>詳細検索のコンテンツをここに追加します。</p>
            <Button onClick={() => setIsDetailedSearchOpen(false)}>閉じる</Button>
          </div>
        </div>
      )}

      {/* Results (Placeholder) */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">検索結果</h2>
        <p>検索結果はここに表示されます。</p>
      </div>
    </div>
  )
}
