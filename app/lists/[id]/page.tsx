"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getTradeOwnedLists, deleteTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { createClient } from "@/lib/supabase/client"
import { CardDisplay } from "@/components/card-display"
import type { TradeOwnedList } from "@/lib/actions/trade-owned-lists"

interface ListDetailPageProps {
  params: { id: string }
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [list, setList] = useState<TradeOwnedList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUserId(user.id)

        // Get lists
        const result = await getTradeOwnedLists(user.id)

        if (result.success && result.lists) {
          const foundList = result.lists.find((l) => l.id === Number.parseInt(params.id))
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
        } else {
          toast({
            title: "エラー",
            description: result.error || "リストの読み込みに失敗しました",
            variant: "destructive",
          })
          router.push("/lists")
        }
      } catch (error) {
        console.error("Error loading list:", error)
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

    loadData()
  }, [params.id, router, toast])

  const handleDelete = async () => {
    if (!list || !userId || !confirm("このリストを削除しますか？")) return

    setIsDeleting(true)
    try {
      const result = await deleteTradeOwnedList(list.id, userId)

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
      console.error("Error deleting list:", error)
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
      <div className="min-h-screen bg-blue-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-blue-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-4">リストが見つかりません</p>
              <Button onClick={() => router.push("/lists")}>リスト一覧に戻る</Button>
            </div>
          </div>
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
              onClick={() => router.push("/lists")}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              リスト一覧に戻る
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{list.list_name}</h1>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
            >
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
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
              <Badge variant="secondary">{list.card_ids?.length || 0}枚</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">作成日: {new Date(list.created_at).toLocaleDateString("ja-JP")}</div>
            {list.updated_at && (
              <div className="text-sm text-gray-500">
                更新日: {new Date(list.updated_at).toLocaleDateString("ja-JP")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cards */}
        {list.card_ids && list.card_ids.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>カード一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {list.card_ids.map((cardId, index) => (
                  <div key={`${cardId}-${index}`} className="flex flex-col items-center">
                    <CardDisplay cardId={cardId.toString()} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">このリストにはカードが登録されていません</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                カードを追加
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
