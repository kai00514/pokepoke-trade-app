"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { getTradeOwnedLists, deleteTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import CardDisplay from "@/components/card-display"
import type { TradeOwnedList } from "@/lib/actions/trade-owned-lists"

interface ListDetailPageProps {
  params: { id: string }
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  const { id } = params
  const router = useRouter()
  const { toast } = useToast()
  const [list, setList] = useState<TradeOwnedList | null>(null)
  const [cards, setCards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        router.push("/auth/login")
      }
    }
    getUser()
  }, [router])

  useEffect(() => {
    const fetchListData = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        console.log("Fetching lists for user:", userId)
        const result = await getTradeOwnedLists(userId)
        console.log("Lists result:", result)

        if (result.success && result.lists) {
          const foundList = result.lists.find((l) => l.id === Number.parseInt(id))
          console.log("Found list:", foundList)

          if (foundList) {
            setList(foundList)

            // カード情報を取得
            if (foundList.card_ids && foundList.card_ids.length > 0) {
              const supabase = createClient()
              const { data: cardsData, error } = await supabase.from("cards").select("*").in("id", foundList.card_ids)

              if (error) {
                console.error("Error fetching cards:", error)
                toast({
                  title: "エラー",
                  description: "カード情報の取得に失敗しました",
                  variant: "destructive",
                })
              } else {
                setCards(cardsData || [])
              }
            }
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
            description: result.error || "リストの取得に失敗しました",
            variant: "destructive",
          })
          router.push("/lists")
        }
      } catch (error) {
        console.error("Error fetching list:", error)
        toast({
          title: "エラー",
          description: "リストの取得に失敗しました",
          variant: "destructive",
        })
        router.push("/lists")
      } finally {
        setIsLoading(false)
      }
    }

    fetchListData()
  }, [userId, id, router, toast])

  const handleDelete = async () => {
    if (!list || !userId) return

    if (confirm("このリストを削除しますか？")) {
      try {
        const result = await deleteTradeOwnedList(list.id, userId)
        if (result.success) {
          toast({
            title: "成功",
            description: "リストを削除しました",
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
      }
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
          <Button onClick={() => router.push("/lists")} className="mt-4">
            リスト一覧に戻る
          </Button>
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
              戻る
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{list.list_name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </div>
        </div>

        {/* List Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>リスト情報</span>
              <span className="text-sm font-normal text-gray-600">{cards.length}枚のカード</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">作成日: </span>
                <span className="text-gray-600">
                  {list.created_at ? new Date(list.created_at).toLocaleDateString("ja-JP") : "不明"}
                </span>
              </div>
              {list.updated_at && (
                <div>
                  <span className="font-medium">更新日: </span>
                  <span className="text-gray-600">{new Date(list.updated_at).toLocaleDateString("ja-JP")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cards Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>カード一覧</span>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                カードを追加
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {cards.map((card) => (
                  <div key={card.id} className="aspect-[5/7]">
                    <CardDisplay
                      card={{
                        id: card.id,
                        name: card.name,
                        imageUrl: card.image_url,
                        type: card.type_code,
                        rarity: card.rarity_code,
                      }}
                      showName={true}
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">カードが登録されていません</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  最初のカードを追加
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
