"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { getTradeOwnedLists, deleteTradeOwnedList, updateTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import CardDisplay from "@/components/card-display"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { TradeOwnedList } from "@/lib/actions/trade-owned-lists"

interface ListDetailPageProps {
  params: { id: string }
}

export default function ListDetailPage({ params }: ListDetailPageProps) {
  const { id } = params
  const router = useRouter()
  const { toast } = useToast()
  const [list, setList] = useState<TradeOwnedList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [editListName, setEditListName] = useState("")
  const [editSelectedCards, setEditSelectedCards] = useState<number[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

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
            setEditListName(foundList.list_name)
            setEditSelectedCards(foundList.card_ids || [])
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

  const handleEdit = () => {
    if (list) {
      setEditListName(list.list_name)
      setEditSelectedCards(list.card_ids || [])
      setIsEditModalOpen(true)
    }
  }

  const handleUpdateList = async () => {
    if (!list || !userId) return

    if (!editListName.trim()) {
      toast({
        title: "エラー",
        description: "リスト名を入力してください",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const result = await updateTradeOwnedList(list.id, userId, editListName.trim(), editSelectedCards)

      if (result.success) {
        setList(result.list)
        setIsEditModalOpen(false)
        toast({
          title: "成功",
          description: "リストを更新しました",
        })
      } else {
        toast({
          title: "エラー",
          description: result.error || "リストの更新に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating list:", error)
      toast({
        title: "エラー",
        description: "リストの更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCardSelect = (cardId: number) => {
    setEditSelectedCards((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId)
      } else {
        return [...prev, cardId]
      }
    })
  }

  const handleAddCards = () => {
    if (list) {
      setEditSelectedCards(list.card_ids || [])
      setIsSearchModalOpen(true)
    }
  }

  const handleAddCardsComplete = () => {
    if (!list || !userId) return

    setIsUpdating(true)
    updateTradeOwnedList(list.id, userId, list.list_name, editSelectedCards)
      .then((result) => {
        if (result.success) {
          setList(result.list)
          setIsSearchModalOpen(false)
          toast({
            title: "成功",
            description: "カードを追加しました",
          })
        } else {
          toast({
            title: "エラー",
            description: result.error || "カードの追加に失敗しました",
            variant: "destructive",
          })
        }
      })
      .catch((error) => {
        console.error("Error adding cards:", error)
        toast({
          title: "エラー",
          description: "カードの追加に失敗しました",
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsUpdating(false)
      })
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
            <Button variant="outline" size="sm" onClick={handleEdit}>
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
              <span className="text-sm font-normal text-gray-600">{list.card_ids?.length || 0}枚のカード</span>
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
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAddCards}>
                <Plus className="h-4 w-4 mr-2" />
                カードを追加
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {list.card_ids && list.card_ids.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {list.card_ids.map((cardId, index) => (
                  <div key={`${cardId}-${index}`} className="aspect-[5/7]">
                    <CardDisplay
                      cardId={cardId.toString()}
                      width={80}
                      height={112}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">カードが登録されていません</p>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddCards}>
                  <Plus className="h-4 w-4 mr-2" />
                  最初のカードを追加
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>リストを編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* List Name */}
              <div className="space-y-2">
                <Label htmlFor="editListName">リスト名</Label>
                <Input
                  id="editListName"
                  value={editListName}
                  onChange={(e) => setEditListName(e.target.value)}
                  placeholder="リスト名を入力してください"
                />
              </div>

              {/* Card Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>カード選択</Label>
                  <Button
                    onClick={() => setIsSearchModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    カードを検索
                  </Button>
                </div>

                {editSelectedCards.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{editSelectedCards.length}枚のカードが選択されています</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-60 overflow-y-auto">
                      {editSelectedCards.map((cardId, index) => (
                        <div key={`${cardId}-${index}`} className="aspect-[5/7]">
                          <CardDisplay
                            cardId={cardId.toString()}
                            width={80}
                            height={112}
                            className="w-full h-full object-cover rounded-md cursor-pointer"
                            onClick={() => handleCardSelect(cardId)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  キャンセル
                </Button>
                <Button
                  onClick={handleUpdateList}
                  disabled={isUpdating || !editListName.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? "更新中..." : "更新"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search Modal */}
        <DetailedSearchModal
          isOpen={isSearchModalOpen}
          onOpenChange={(open) => {
            setIsSearchModalOpen(open)
            if (!open && list) {
              // モーダルが閉じられた時にカードを追加
              handleAddCardsComplete()
            }
          }}
          onCardSelect={handleCardSelect}
          selectedCards={editSelectedCards}
        />
      </div>
    </div>
  )
}
