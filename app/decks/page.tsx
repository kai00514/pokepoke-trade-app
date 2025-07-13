"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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

      {/* Search Form */}
      <div className="flex flex-row items-center gap-2 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="キーワード検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={handleSearch} className="whitespace-nowrap px-4">
          検索
        </Button>
        <Button variant="outline" onClick={() => setIsDetailedSearchOpen(true)} className="whitespace-nowrap px-3">
          詳細検索
        </Button>
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
