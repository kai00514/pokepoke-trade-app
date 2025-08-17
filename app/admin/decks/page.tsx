"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getDeckPages, deleteDeckPage, toggleDeckPagePublished } from "@/lib/actions/admin-deck-pages"

interface DeckPage {
  id: string
  title: string
  deck_name: string
  category: string
  tier_rank: string
  energy_type: string
  is_published: boolean
  view_count: number
  like_count: number
  comment_count: number
  favorite_count: number
  created_at: string
  updated_at?: string
}

export default function DecksPage() {
  const [deckPages, setDeckPages] = useState<DeckPage[]>([])
  const [filteredDecks, setFilteredDecks] = useState<DeckPage[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [energyFilter, setEnergyFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<string | null>(null)

  // デッキページを取得
  const fetchDeckPages = async () => {
    setIsLoading(true)
    try {
      const result = await getDeckPages()
      if (result.success) {
        setDeckPages(result.data)
        setFilteredDecks(result.data)
      } else {
        toast.error("データの取得に失敗しました", {
          description: result.error,
        })
      }
    } catch (error) {
      toast.error("データの取得に失敗しました", {
        description: "予期しないエラーが発生しました",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDeckPages()
  }, [])

  // フィルタリング処理
  useEffect(() => {
    let filtered = deckPages

    // 検索フィルター
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (deck) =>
          deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deck.deck_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // カテゴリーフィルター
    if (categoryFilter !== "all") {
      filtered = filtered.filter((deck) => deck.category === categoryFilter)
    }

    // 公開状態フィルター
    if (statusFilter !== "all") {
      const isPublished = statusFilter === "published"
      filtered = filtered.filter((deck) => deck.is_published === isPublished)
    }

    // ティアフィルター
    if (tierFilter !== "all") {
      filtered = filtered.filter((deck) => deck.tier_rank === tierFilter)
    }

    // エネルギータイプフィルター
    if (energyFilter !== "all") {
      filtered = filtered.filter((deck) => deck.energy_type === energyFilter)
    }

    setFilteredDecks(filtered)
  }, [deckPages, searchTerm, categoryFilter, statusFilter, tierFilter, energyFilter])

  // 公開状態の切り替え
  const handleTogglePublished = async (id: string, currentStatus: boolean) => {
    setIsToggling(id)
    try {
      const result = await toggleDeckPagePublished(id, !currentStatus)
      if (result.success) {
        setDeckPages(deckPages.map((deck) => (deck.id === id ? { ...deck, is_published: !currentStatus } : deck)))
        toast.success(`デッキを${!currentStatus ? "公開" : "非公開"}にしました`)
      } else {
        toast.error("公開状態の変更に失敗しました", {
          description: result.error,
        })
      }
    } catch (error) {
      toast.error("公開状態の変更に失敗しました")
    } finally {
      setIsToggling(null)
    }
  }

  // 削除処理
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除してもよろしいですか？この操作は取り消せません。`)) {
      return
    }

    setIsDeleting(id)
    try {
      const result = await deleteDeckPage(id)
      if (result.success) {
        setDeckPages(deckPages.filter((deck) => deck.id !== id))
        toast.success("デッキを削除しました")
      } else {
        toast.error("削除に失敗しました", {
          description: result.error,
        })
      }
    } catch (error) {
      toast.error("削除に失敗しました")
    } finally {
      setIsDeleting(null)
    }
  }

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
    const energyMap: { [key: string]: string } = {
      炎: "🔥 炎",
      水: "💧 水",
      草: "🌿 草",
      電気: "⚡ 電気",
      闘: "👊 闘",
      悪: "🌙 悪",
      鋼: "⚙️ 鋼",
      無色: "⚪ 無色",
      ドラゴン: "🐉 ドラゴン",
      エスパー: "🔮 エスパー",
    }
    return energyMap[energyType] || energyType
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">デッキ管理</h1>
          <p className="text-gray-600 mt-1">
            {filteredDecks.length}件のデッキ（全{deckPages.length}件中）
          </p>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
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
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="公開状態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての状態</SelectItem>
                <SelectItem value="published">公開済み</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ティア" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのティア</SelectItem>
                <SelectItem value="SS">SS</SelectItem>
                <SelectItem value="S">S</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <Select value={energyFilter} onValueChange={setEnergyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="エネルギータイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのタイプ</SelectItem>
                <SelectItem value="炎">🔥 炎</SelectItem>
                <SelectItem value="水">💧 水</SelectItem>
                <SelectItem value="草">🌿 草</SelectItem>
                <SelectItem value="電気">⚡ 電気</SelectItem>
                <SelectItem value="闘">👊 闘</SelectItem>
                <SelectItem value="悪">🌙 悪</SelectItem>
                <SelectItem value="鋼">⚙️ 鋼</SelectItem>
                <SelectItem value="無色">⚪ 無色</SelectItem>
                <SelectItem value="ドラゴン">🐉 ドラゴン</SelectItem>
                <SelectItem value="エスパー">🔮 エスパー</SelectItem>
              </SelectContent>
            </Select>
            <div className="lg:col-span-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setStatusFilter("all")
                  setTierFilter("all")
                  setEnergyFilter("all")
                }}
              >
                フィルターをクリア
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* デッキ一覧 */}
      <div className="space-y-4">
        {filteredDecks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">条件に一致するデッキが見つかりません</p>
              {searchTerm || categoryFilter !== "all" || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  className="mt-4 bg-transparent"
                  onClick={() => {
                    setSearchTerm("")
                    setCategoryFilter("all")
                    setStatusFilter("all")
                    setTierFilter("all")
                    setEnergyFilter("all")
                  }}
                >
                  フィルターをクリア
                </Button>
              ) : (
                <Link href="/admin/decks/create">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    最初のデッキを作成
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredDecks.map((deck) => (
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
                      <span>作成: {new Date(deck.created_at).toLocaleDateString("ja-JP")}</span>
                      {deck.updated_at && <span>更新: {new Date(deck.updated_at).toLocaleDateString("ja-JP")}</span>}
                      <span>閲覧: {deck.view_count}</span>
                      <span>いいね: {deck.like_count}</span>
                      <span>コメント: {deck.comment_count}</span>
                      <span>お気に入り: {deck.favorite_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublished(deck.id, deck.is_published)}
                      disabled={isToggling === deck.id}
                    >
                      {isToggling === deck.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : deck.is_published ? (
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(deck.id, deck.title)}
                      disabled={isDeleting === deck.id}
                    >
                      {isDeleting === deck.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          削除
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 統計情報 */}
      <Card>
        <CardHeader>
          <CardTitle>統計情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{deckPages.length}</div>
              <div className="text-sm text-gray-600">総デッキ数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {deckPages.filter((deck) => deck.is_published).length}
              </div>
              <div className="text-sm text-gray-600">公開中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {deckPages.filter((deck) => !deck.is_published).length}
              </div>
              <div className="text-sm text-gray-600">下書き</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {deckPages.reduce((sum, deck) => sum + deck.view_count, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">総閲覧数</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
