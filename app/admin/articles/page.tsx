"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import {
  getArticles,
  deleteArticle,
  toggleArticlePublished,
  toggleArticlePinned,
  type Article,
} from "@/lib/actions/admin-articles"
import { toast } from "@/hooks/use-toast"

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const result = await getArticles()

      if (result.success && result.data) {
        setArticles(result.data)
      } else {
        console.error("Failed to load articles:", result.error)
        toast({
          title: "エラー",
          description: result.error || "記事の取得に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Exception in loadArticles:", error)
      toast({
        title: "エラー",
        description: "記事の取得中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) {
      return
    }

    try {
      const result = await deleteArticle(id)

      if (result.success) {
        toast({
          title: "成功",
          description: "記事を削除しました",
        })
        await loadArticles()
      } else {
        toast({
          title: "エラー",
          description: result.error || "記事の削除に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Exception in handleDelete:", error)
      toast({
        title: "エラー",
        description: "記事の削除中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handleTogglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const result = await toggleArticlePublished(id, !currentStatus)

      if (result.success) {
        toast({
          title: "成功",
          description: !currentStatus ? "記事を公開しました" : "記事を非公開にしました",
        })
        await loadArticles()
      } else {
        toast({
          title: "エラー",
          description: result.error || "公開状態の変更に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Exception in handleTogglePublished:", error)
      toast({
        title: "エラー",
        description: "公開状態の変更中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handleTogglePinned = async (id: string, currentStatus: boolean) => {
    try {
      const result = await toggleArticlePinned(id, !currentStatus)

      if (result.success) {
        toast({
          title: "成功",
          description: !currentStatus ? "記事をピン留めしました" : "記事のピン留めを解除しました",
        })
        await loadArticles()
      } else {
        toast({
          title: "エラー",
          description: result.error || "ピン留め状態の変更に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Exception in handleTogglePinned:", error)
      toast({
        title: "エラー",
        description: "ピン留め状態の変更中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && article.is_published) ||
      (statusFilter === "draft" && !article.is_published)

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">記事管理</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">記事管理</h1>
        <Link href="/admin/articles/create">
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
                  placeholder="記事を検索..."
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
                <SelectItem value="news">ニュース</SelectItem>
                <SelectItem value="guide">ガイド</SelectItem>
                <SelectItem value="update">アップデート</SelectItem>
                <SelectItem value="event">イベント</SelectItem>
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

      {/* 記事一覧 */}
      <div className="grid gap-4">
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="flex justify-center items-center h-32">
              <p className="text-gray-500">記事が見つかりません</p>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{article.title}</h3>
                      {article.pinned && <Badge variant="secondary">ピン留め</Badge>}
                      <Badge variant={article.is_published ? "default" : "secondary"}>
                        {article.is_published ? "公開" : "下書き"}
                      </Badge>
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">スラッグ: {article.slug}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>作成: {new Date(article.created_at).toLocaleDateString()}</span>
                      <span>更新: {new Date(article.updated_at).toLocaleDateString()}</span>
                      <span>閲覧数: {article.view_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublished(article.id, article.is_published)}
                    >
                      {article.is_published ? (
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
                    <Button variant="outline" size="sm" onClick={() => handleTogglePinned(article.id, article.pinned)}>
                      {article.pinned ? "ピン解除" : "ピン留め"}
                    </Button>
                    <Link href={`/admin/articles/${article.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        編集
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(article.id, article.title)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
