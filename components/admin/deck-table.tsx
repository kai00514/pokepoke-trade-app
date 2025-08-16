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
import { deleteDeck, toggleDeckPublished, type DeckPage } from "@/lib/actions/admin-decks"

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

  if (decks.length === 0) {
    return <div className="text-center py-8 text-gray-500">デッキがありません。新規作成してください。</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-blue-50">
          <TableHead>タイトル</TableHead>
          <TableHead>カテゴリー</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>公開状態</TableHead>
          <TableHead>統計</TableHead>
          <TableHead>作成日</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {decks.map((deck) => (
          <TableRow key={deck.id}>
            <TableCell>
              <div className="space-y-1">
                <div className="font-medium">{deck.deck_name}</div>
                <div className="text-sm text-gray-500 truncate max-w-xs">{deck.title}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {categoryLabels[deck.category as keyof typeof categoryLabels] || deck.category}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Badge variant="secondary">{deck.tier_rank}</Badge>
                <div className="text-xs text-gray-500">{deck.tier_name}</div>
              </div>
            </TableCell>
            <TableCell>
              <Switch
                checked={deck.is_published}
                onCheckedChange={(checked) => handleTogglePublished(deck.id, checked)}
                disabled={loading === deck.id}
              />
            </TableCell>
            <TableCell>
              <div className="text-sm space-y-1">
                <div>閲覧: {deck.view_count}</div>
                <div>いいね: {deck.like_count}</div>
                <div>お気に入り: {deck.favorite_count}</div>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm text-gray-500">{new Date(deck.created_at).toLocaleDateString("ja-JP")}</div>
            </TableCell>
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
  )
}
