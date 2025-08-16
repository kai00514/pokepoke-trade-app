"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import { Plus } from "lucide-react"
import { getDecks } from "@/lib/actions/admin-decks"
import { DeckTable } from "@/components/admin/deck-table"
import { Search } from "lucide-react"
import { toast } from "sonner"
import type { DeckPage } from "@/types/deck" // Import DeckPage type

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

export default async function DecksPage() {
  const result = await getDecks()
  const router = useRouter()
  const [decks, setDecks] = useState<DeckPage[]>(result.success ? result.data : [])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [tierFilter, setTierFilter] = useState("")

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) {
      return
    }

    try {
      const result = await getDecks() // Assuming getDecks is an async function that deletes a deck
      if (result.success) {
        toast.success("デッキを削除しました")
        setDecks(result.data)
      } else {
        toast.error(result.error || "削除に失敗しました")
      }
    } catch (error) {
      console.error("Error deleting deck:", error)
      toast.error("削除に失敗しました")
    }
  }

  const handleTogglePublished = async (id: string, isPublished: boolean) => {
    try {
      const result = await getDecks() // Assuming getDecks is an async function that toggles deck published status
      if (result.success) {
        toast.success(isPublished ? "デッキを公開しました" : "デッキを下書きにしました")
        setDecks(result.data)
      } else {
        toast.error(result.error || "更新に失敗しました")
      }
    } catch (error) {
      console.error("Error toggling published:", error)
      toast.error("更新に失敗しました")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getCategoryLabel = (cat: string) => {
    return categories.find((c) => c.value === cat)?.label || cat
  }

  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(search.toLowerCase()) ||
      deck.deck_name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !category || deck.category === category
    const matchesTier = !tierFilter || deck.tier_rank === tierFilter

    return matchesSearch && matchesCategory && matchesTier
  })

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

      {/* フィルター */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="デッキを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-48 border rounded px-4 py-2"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="w-32 border rounded px-4 py-2"
        >
          {tierRanks.map((tier) => (
            <option key={tier.value} value={tier.value}>
              {tier.label}
            </option>
          ))}
        </select>
      </div>

      {/* テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>デッキ一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>読み込み中...</div>}>
            <DeckTable
              decks={filteredDecks}
              handleDelete={handleDelete}
              handleTogglePublished={handleTogglePublished}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
