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
import { Search, Edit, Trash2, Plus, Pin, Eye } from "lucide-react"
import { toast } from "sonner"

import {
  getArticles,
  deleteArticle,
  toggleArticlePublished,
  toggleArticlePinned,
  type Article,
} from "@/lib/actions/admin-articles"

const categories = [
  { value: "", label: "すべて" },
  { value: "news", label: "ニュース" },
  { value: "guide", label: "ガイド" },
  { value: "update", label: "アップデート" },
  { value: "event", label: "イベント" },
  { value: "other", label: "その他" },
]

export function ArticleTable() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const result = await getArticles(page, 10, search, category)
      if (result.success) {
        setArticles(result.data)
        setTotalPages(result.totalPages)
      } else {
        toast.error(result.error || "記事の取得に失敗しました")
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
      toast.error("記事の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [page, search, category])

  const handleDelete = async (id: number) => {
    try {
      const result = await deleteArticle(id)
      if (result.success) {
        toast.success("記事を削除しました")
        fetchArticles()
      } else {
        toast.error(result.error || "削除に失敗しました")
      }
    } catch (error) {
      console.error("Error deleting article:", error)
      toast.error("削除に失敗しました")
    }
  }

  const handleTogglePublished = async (id: number, isPublished: boolean) => {
    try {
      const result = await toggleArticlePublished(id, isPublished)
      if (result.success) {
        toast.success(isPublished ? "記事を公開しました" : "記事を下書きにしました")
        fetchArticles()
      } else {
        toast.error(result.error || "更新に失敗しました")
      }
    } catch (error) {
      console.error("Error toggling published:", error)
      toast.error("更新に失敗しました")
    }
  }

  const handleTogglePinned = async (id: number, isPinned: boolean) => {
    try {
      const result = await toggleArticlePinned(id, isPinned)
      if (result.success) {
        toast.success(isPinned ? "記事をピン留めしました" : "ピン留めを解除しました")
        fetchArticles()
      } else {
        toast.error(result.error || "更新に失敗しました")
      }
    } catch (error) {
      console.error("Error toggling pinned:", error)
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

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">記事管理</h1>
        <Link href="/admin/articles/create">
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
            placeholder="記事を検索..."
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
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>カテゴリー</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  記事が見つかりません
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {article.is_pinned && <Pin className="h-4 w-4 text-yellow-500" />}
                      <div>
                        <div className="font-medium">{article.title}</div>
                        <div className="text-sm text-gray-500">/{article.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {categories.find((cat) => cat.value === article.category)?.label || article.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={article.is_published}
                        onCheckedChange={(checked) => article.id && handleTogglePublished(article.id, checked)}
                      />
                      <span className="text-sm">{article.is_published ? "公開" : "下書き"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{article.created_at && formatDate(article.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => article.id && handleTogglePinned(article.id, !article.is_pinned)}
                        className={article.is_pinned ? "text-yellow-600" : "text-gray-400"}
                      >
                        <Pin className="h-4 w-4" />
                      </Button>

                      <Link href={`/info/${article.slug}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Link href={`/admin/articles/${article.id}/edit`}>
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
                            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は取り消せません。記事「{article.title}」を完全に削除します。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => article.id && handleDelete(article.id)}
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

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page <= 1}>
            前へ
          </Button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
            次へ
          </Button>
        </div>
      )}
    </div>
  )
}
