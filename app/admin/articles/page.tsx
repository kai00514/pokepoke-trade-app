"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { getArticles, deleteArticle, toggleArticlePublished, toggleArticlePinned } from "@/lib/actions/admin-articles"
import { toast } from "@/hooks/use-toast"

interface Article {
  id: string
  title: string
  slug: string
  category: string
  is_published: boolean
  published_at: string
  pinned: boolean
  priority: number
  view_count: number
  created_at: string
  updated_at: string
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  console.log("=== DEBUG: ArticlesPage component initialized ===")
  console.log("Search term:", searchTerm)
  console.log("Category filter:", categoryFilter)
  console.log("Status filter:", statusFilter)

  useEffect(() => {
    console.log("=== DEBUG: useEffect triggered for loading articles ===")
    loadArticles()
  }, [])

  const loadArticles = async () => {
    console.log("=== DEBUG: loadArticles function started ===")
    try {
      setLoading(true)
      const result = await getArticles()
      console.log("=== DEBUG: getArticles result ===")
      console.log("Result success:", result.success)
      console.log("Result data:", result.data)
      console.log("Result error:", result.error)

      if (result.success && result.data) {
        setArticles(result.data)
        console.log("=== DEBUG: Articles loaded successfully ===")
        console.log("Articles count:", result.data.length)
      } else {
        console.error("=== DEBUG: Failed to load articles ===")
        console.error("Error:", result.error)
        toast({
          title: "エラー",
          description: result.error || "記事の取得に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("=== DEBUG: Exception in loadArticles ===")
      console.error("Error:", error)
      toast({
        title: "エラー",
        description: "記事の取得中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      console.log("=== DEBUG: loadArticles completed ===")
    }
  }

  const handleDelete = async (id: string, title: string) => {
    console.log("=== DEBUG: handleDelete started ===")
    console.log("Article ID:", id)
    console.log("Article title:", title)

    if (!confirm(`「${title}」を削除しますか？`)) {
      console.log("=== DEBUG: Delete cancelled by user ===")
      return
    }

    try {
      const result = await deleteArticle(id)
      console.log("=== DEBUG: deleteArticle result ===")
      console.log("Result:", result)

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
      console.error("=== DEBUG: Exception in handleDelete ===")
      console.error("Error:", error)
      toast({
        title: "エラー",
        description: "記事の削除中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handleTogglePublished = async (id: string, currentStatus: boolean) => {
    console.log("=== DEBUG: handleTogglePublished started ===")
    console.log("Article ID:", id)
    console.log("Current status:", currentStatus)
    console.log("New status:", !currentStatus)

    try {
      const result = await toggleArticlePublished(id, !currentStatus)
      console.log("=== DEBUG: toggleArticlePublished result ===")
      console.log("Result:", result)

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
      console.error("=== DEBUG: Exception in handleTogglePublished ===")
      console.error("Error:", error)
      toast({
        title: "エラー",
        description: "公開状態の変更中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const handleTogglePinned = async (id: string, currentStatus: boolean) => {
    console.log("=== DEBUG: handleTogglePinned started ===")
    console.log("Article ID:", id)
    console.log("Current pinned status:", currentStatus)
    console.log("New pinned status:", !currentStatus)

    try {
      const result = await toggleArticlePinned(id, !currentStatus)
      console.log("=== DEBUG: toggleArticlePinned result ===")
      console.log("Result:", result)

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
      console.error("=== DEBUG: Exception in handleTogglePinned ===")
      console.error("Error:", error)
      toast({
        title: "エラー",
        description: "ピン留め状態の変更中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  const filteredArticles = articles.filter((article) => {
    console.log("=== DEBUG: Filtering article ===")
    console.log("Article:", article.title)
    console.log("Search term:", searchTerm)
    console.log("Category filter:", categoryFilter)
    console.log("Status filter:", statusFilter)

    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && article.is_published) ||
      (statusFilter === "draft" && !article.is_published)

    console.log("Matches search:", matchesSearch)
    console.log("Matches category:", matchesCategory)
    console.log("Matches status:", matchesStatus)

    return matchesSearch && matchesCategory && matchesStatus
  })

  console.log("=== DEBUG: Filtered articles count ===")
  console.log("Total articles:", articles.length)
  console.log("Filtered articles:", filteredArticles.length)

  if (loading) {
    console.log("=== DEBUG: Rendering loading state ===")
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

  console.log("=== DEBUG: Rendering main content ===")

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
                  onChange={(e) => {
                    console.log("=== DEBUG: Search term changed ===")
                    console.log("New search term:", e.target.value)
                    setSearchTerm(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                console.log("=== DEBUG: Category filter changed ===")
                console.log("New category filter:", value)
                setCategoryFilter(value)
              }}
            >
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
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                console.log("=== DEBUG: Status filter changed ===")
                console.log("New status filter:", value)
                setStatusFilter(value)
              }}
            >
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
          filteredArticles.map((article) => {
            console.log("=== DEBUG: Rendering article ===")
            console.log("Article ID:", article.id)
            console.log("Article title:", article.title)

            return (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePinned(article.id, article.pinned)}
                      >
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
            )
          })
        )}
      </div>
    </div>
  )
}
