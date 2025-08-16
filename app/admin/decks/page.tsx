"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import { Plus } from "lucide-react"
import { getDecks } from "@/lib/actions/admin-decks"
import { DecksPageClient } from "@/components/admin/decks-page-client"

const categories = [
  { value: "", label: "すべて" },
  { value: "tier", label: "Tier" },
  { value: "featured", label: "注目" },
  { value: "newpack", label: "新パック" },
]

const tierRanks = [
  { value: "", label: "すべて" },
  { value: "SS", label: "SS" },
  { value: "S", label: "S" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
]

// Server Componentとして実装
export default async function DecksPage() {
  // サーバーサイドでデータを取得
  const result = await getDecks()
  const decks = result.success ? result.data : []

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">デッキ管理</h1>
        <Button asChild>
          <Link href="/admin/decks/create">
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Link>
        </Button>
      </div>

      {/* メインコンテンツ */}
      <Card>
        <CardHeader>
          <CardTitle>デッキ一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
            <DecksPageClient initialDecks={decks} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
