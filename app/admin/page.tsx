"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Eye, TrendingUp } from "lucide-react"
import { getDashboardStats, type DashboardStats } from "@/lib/actions/dashboard-stats"

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("=== DEBUG: AdminDashboard component mounted ===")

    const fetchStats = async () => {
      console.log("=== DEBUG: Fetching dashboard stats ===")
      setLoading(true)
      setError(null)

      try {
        const result = await getDashboardStats()
        console.log("=== DEBUG: Dashboard stats result ===")
        console.log("Success:", result.success)
        console.log("Data:", result.data)
        console.log("Error:", result.error)

        if (result.success && result.data) {
          setStats(result.data)
        } else {
          setError(result.error || "統計データの取得に失敗しました")
        }
      } catch (err) {
        console.log("=== DEBUG: Error fetching dashboard stats ===")
        console.log("Error:", err)
        setError("統計データの取得中にエラーが発生しました")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-gray-600">管理画面へようこそ</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">読み込み中...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">データを取得中</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-gray-600">管理画面へようこそ</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">エラーが発生しました</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-gray-600">管理画面へようこそ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総記事数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalArticles || 0}</div>
            <p className="text-xs text-muted-foreground">公開済み: {stats?.publishedArticles || 0}件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">公開記事</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.publishedArticles || 0}</div>
            <p className="text-xs text-muted-foreground">
              全体の
              {stats?.totalArticles ? Math.round(((stats.publishedArticles || 0) / stats.totalArticles) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">登録ユーザー</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月間PV</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">実装予定</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近の記事</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentArticles && stats.recentArticles.length > 0 ? (
              <div className="space-y-4">
                {stats.recentArticles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{article.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">{article.category}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            article.is_published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {article.is_published ? "公開" : "下書き"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      <div>{formatDate(article.created_at)}</div>
                      {article.updated_at !== article.created_at && (
                        <div className="text-xs text-gray-400">更新: {formatDate(article.updated_at)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">記事がありません</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>アクセス統計</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">統計機能は実装予定です</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
