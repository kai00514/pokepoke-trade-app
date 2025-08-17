"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

// サンプルデータ
const sampleDecks = [
  {
    id: "1",
    title: "【ポケポケ】Aデッキのレシピと評価【ポケモンカードアプリ】",
    deck_name: "Aデッキ",
    category: "tier",
    tier_rank: "SS",
    energy_type: "闘",
    is_published: true,
    view_count: 1250,
    like_count: 45,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:22:00Z",
  },
  {
    id: "2",
    title: "【ポケポケ】新パック対応！炎タイプデッキ【最新環境】",
    deck_name: "炎タイプデッキ",
    category: "new-pack",
    tier_rank: "S",
    energy_type: "炎",
    is_published: false,
    view_count: 890,
    like_count: 32,
    created_at: "2024-01-18T09:15:00Z",
    updated_at: "2024-01-18T16:45:00Z",
  },
]

export default function DecksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "tier":
        return "Tier"
      case "featured":
        return "注目"
      case "new-pack":
        return "新パック"
      default:
        return category
    }
  }

  const getEnergyTypeLabel = (energyType: string) => {
    switch (energyType) {
      case "炎":
        return "🔥 炎"
      case "水":
        return "💧 水"
      case "草":
        return "🌿 草"
      case "電気":
        return "⚡ 電気"
      case "闘":
        return "👊 闘"
      case "悪":
        return "🌙 悪"
      case "鋼":
        return "⚙️ 鋼"
      case "無色":
        return "⚪ 無色"
      default:
        return energyType
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">デッキ管理</h1>
        <Link href="/admin/decks/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="デッキを検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="カテゴリー" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのカテゴリー</SelectItem>
                <SelectItem value="tier">Tier</SelectItem>
                <SelectItem value="featured">注目</SelectItem>
                <SelectItem value="new-pack">新パック</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="公開状態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての状態</SelectItem>
                <SelectItem value="published">公開済み</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* デッキ一覧 */}
      <div className="grid gap-4">
        {sampleDecks.map((deck) => (
          <Card key={deck.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{deck.title}</h3>
                    <Badge variant={deck.is_published ? "default" : "secondary"}>
                      {deck.is_published ? "公開" : "下書き"}
                    </Badge>
                    <Badge variant="outline">{getCategoryLabel(deck.category)}</Badge>
                    <Badge variant="secondary">Tier {deck.tier_rank}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>デッキ名: {deck.deck_name}</span>
                    <span>{getEnergyTypeLabel(deck.energy_type)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>作成: {new Date(deck.created_at).toLocaleDateString()}</span>
                    <span>更新: {new Date(deck.updated_at).toLocaleDateString()}</span>
                    <span>閲覧数: {deck.view_count}</span>
                    <span>いいね: {deck.like_count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    {deck.is_published ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        非公開
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        公開
                      </>
                    )}
                  </Button>
                  <Link href={`/admin/decks/${deck.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      編集
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
