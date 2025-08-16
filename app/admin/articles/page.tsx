import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter } from "lucide-react"
import { ArticleTable } from "@/components/admin/article-table"

export default function AdminArticlesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">記事管理</h1>
          <p className="text-slate-600">記事の作成、編集、削除を行います</p>
        </div>
        <Link href="/admin/articles/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規記事作成
          </Button>
        </Link>
      </div>

      {/* フィルター・検索 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">フィルター・検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="記事タイトルで検索..." className="pl-10" />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="カテゴリー" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="news">ニュース</SelectItem>
                <SelectItem value="guide">ガイド</SelectItem>
                <SelectItem value="update">アップデート</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="公開状態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="published">公開中</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              フィルター
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 記事一覧テーブル */}
      <ArticleTable />
    </div>
  )
}
