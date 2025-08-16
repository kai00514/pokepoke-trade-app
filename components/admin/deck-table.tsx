"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import { deleteDeck, toggleDeckPublished } from "@/lib/actions/admin-decks"

interface DeckPage {
  id: string
  title: string
  deck_name: string
  category: string
  tier_rank: string
  tier_name: string
  is_published: boolean
  view_count: number
  like_count: number
  favorite_count: number
  created_at: string
  updated_at: string
  thumbnail_image_url?: string
}

interface DeckTableProps {
  decks: DeckPage[]
}

const categoryLabels = {
  tier: "Tier",
  featured: "注目",
  newpack: "新パック",
}

export function DeckTable({ decks: initialDecks }: DeckTableProps) {
  const [decks, setDecks] = useState(initialDecks)
  const [loading, setLoading] = useState<string | null>(null)

  const handleTogglePublished = async (id: string, isPublished: boolean) => {
    setLoading(id)
    try {
      const result = await toggleDeckPublished(id, isPublished)
      if (result.success) {
        setDecks((prev) => prev.map((deck) => (deck.id === id ? { ...deck, is_published: isPublished } : deck)))
        toast.success(isPublished ? "公開しました" : "非公開にしました")
      } else {
        toast.error(result.error || "更新に失敗しました")
      }
    } catch (error) {
      toast.error("更新中にエラーが発生しました")
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return

    setLoading(id)
    try {
      const result = await deleteDeck(id)
      if (result.success) {
        setDecks((prev) => prev.filter((deck) => deck.id !== id))
        toast.success("削除しました")
      } else {
        toast.error(result.error || "削除に失敗しました")
      }
    } catch (error) {
      toast.error("削除中にエラーが発生しました")
    } finally {
      setLoading(null)
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
    return categoryLabels[cat as keyof typeof categoryLabels] || cat
  }

  if (decks.length === 0) {
    return <div className="text-center py-8 text-gray-500">デッキがありません。新規作成してください。</div>
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-50">
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
          {decks.map((deck) => (
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
                    disabled={loading === deck.id}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/content/${deck.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-2" />
                        プレビュー
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/decks/${deck.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        編集
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(deck.id)}
                      className="text-red-600"
                      disabled={loading === deck.id}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
