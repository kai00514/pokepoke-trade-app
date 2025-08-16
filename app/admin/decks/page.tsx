"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Search, Edit, Trash2, Plus, Eye } from "lucide-react"
import { toast } from "sonner"

import { getDecks, deleteDeck, toggleDeckPublished, type DeckPage } from "@/lib/actions/admin-decks"

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

export default function DecksPage() {
  const router = useRouter()
  const [decks, setDecks] = useState<DeckPage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [tierFilter, setTierFilter] = useState("")

  const fetchDecks = async () => {
    setLoading(true)
    try {
      const result = await getDecks()
      if (result.success) {
        setDecks(result.data)
      } else {
        toast.error(result.error || "デッキの取得に失敗しました")
      }
    } catch (error) {
      console.error("Error fetching decks:", error)
      toast.error("デッキの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDecks()
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) {
      return
    }

    try {
      const result = await deleteDeck(id)
      if (result.success) {
        toast.success("デッキを削除しました")
        fetchDecks()
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
      const result = await toggleDeckPublished(id, isPublished)
      if (result.success) {
        toast.success(isPublished ? "デッキを公開しました" : "デッキを下書きにしました")
        fetchDecks()
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
        <h1 className="text-2xl font-bold">デッキ管理</h1>
        <Link href="/admin/decks/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </Link>
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
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="カテゴリーで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tierで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            {tierRanks.map((tier) => (
              <SelectItem key={tier.value} value={tier.value}>
                {tier.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-100">
              <TableHead>デッキ名</TableHead>
              <TableHead>カテゴリー</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>統計</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : filteredDecks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  デッキが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              filteredDecks.map((deck) => (
                <TableRow key={deck.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {deck.thumbnail_image_url && (
                        <img
                          src={deck.thumbnail_image_url || "/placeholder.svg"}
                          alt={deck.deck_name}
                          className="w-12 h-8 object-cover rounded border"
                        />
                      )}
                      <div>
                        <div className="font-medium">{deck.deck_name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{deck.title}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getCategoryLabel(deck.category)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={deck.tier_rank === "SS" ? "default" : "outline"}
                      className={
                        deck.tier_rank === "SS"
                          ? "bg-red-600"
                          : deck.tier_rank === "S"
                            ? "bg-orange-500"
                            : deck.tier_rank === "A"
                              ? "bg-yellow-500"
                              : deck.tier_rank === "B"
                                ? "bg-green-500"
                                : "bg-gray-500"
                      }
                    >
                      {deck.tier_rank}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={deck.is_published}
                        onCheckedChange={(checked) => handleTogglePublished(deck.id, checked)}
                      />
                      <span className="text-sm">{deck.is_published ? "公開" : "下書き"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      <div>閲覧: {deck.view_count}</div>
                      <div>いいね: {deck.like_count}</div>
                      <div>お気に入り: {deck.favorite_count}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(deck.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link href={`/content/${deck.id}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Link href={`/admin/decks/${deck.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>デッキを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は取り消せません。デッキ「{deck.deck_name}」を完全に削除します。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(deck.id, deck.deck_name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
