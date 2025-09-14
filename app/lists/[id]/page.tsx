"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getTradeOwnedLists, deleteTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import type { TradeOwnedList } from "@/lib/actions/trade-owned-lists"

interface ListDetailPageProps {
  params: {
    id: string
  }
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [list, setList] = useState<TradeOwnedList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const result = await getTradeOwnedLists()
        if (result.success && result.data) {
          const foundList = result.data.find((l) => l.id === Number.parseInt(params.id))
          if (foundList) {
            setList(foundList)
          } else {
            toast({
              title: "エラー",
              description: "リストが見つかりません",
              variant: "destructive",
            })
            router.push("/lists")
          }
        }
      } catch (error) {
        toast({
          title: "エラー",
          description: "リストの読み込みに失敗しました",
          variant: "destructive",
        })
        router.push("/lists")
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [params.id, router, toast])

  const handleDelete = async () => {
    if (!list || !confirm("このリストを削除しますか？")) return

    setIsDeleting(true)
    try {
      const result = await deleteTradeOwnedList(list.id)
      if (result.success) {
        toast({
          title: "成功",
          description: "リストが削除されました",
        })
        router.push("/lists")
      } else {
        toast({
          title: "エラー",
          description: result.error || "リストの削除に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "リストの削除に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">リストが見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{list.list_name}</h1>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/lists/${list.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "削除中..." : "削除"}
            </Button>
          </div>
        </div>

        {/* List Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>リスト情報</span>
              <Badge variant="secondary">{Array.isArray(list.card_ids) ? list.card_ids.length : 0}枚</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {list.description && <p className="text-gray-600 mb-4">{list.description}</p>}
            <div className="text-sm text-gray-500">作成日: {new Date(list.created_at).toLocaleDateString("ja-JP")}</div>
          </CardContent>
        </Card>

        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle>カード一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(list.card_ids) && list.card_ids.length > 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">{list.card_ids.length}枚のカードが登録されています</p>
                <p className="text-sm text-gray-500 mt-2">カード詳細表示機能は今後実装予定です</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">カードが登録されていません</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
