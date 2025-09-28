"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Search, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { DetailedSearchModal } from "@/components/detailed-search-modal"
import NotificationModal from "@/components/ui/notification-modal"

interface SelectedCard {
  id: number
  name: string
  imageUrl?: string
  packName?: string
}

export default function CreateListPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [listName, setListName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Notification modal state
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
    }
  }, [user, router])

  const handleCardSelect = (cards: any[]) => {
    const newCards: SelectedCard[] = cards.map((card) => ({
      id: card.id,
      name: card.name,
      imageUrl: card.game8_image_url || card.image_url,
      packName: card.pack_name,
    }))
    setSelectedCards(newCards)
    setIsSearchModalOpen(false)
  }

  const removeCard = (cardId: number) => {
    setSelectedCards(selectedCards.filter((card) => card.id !== cardId))
  }

  const handleCreateList = async () => {
    if (!user) {
      setNotificationModal({
        isOpen: true,
        type: "error",
        title: "認証エラー",
        message: "ログインが必要です。",
      })
      return
    }

    if (!listName.trim()) {
      setNotificationModal({
        isOpen: true,
        type: "warning",
        title: "入力エラー",
        message: "リスト名を入力してください。",
      })
      return
    }

    if (selectedCards.length === 0) {
      setNotificationModal({
        isOpen: true,
        type: "warning",
        title: "カード未選択",
        message: "少なくとも1枚のカードを選択してください。",
      })
      return
    }

    setIsCreating(true)

    try {
      const cardIds = selectedCards.map((card) => card.id)
      const result = await createTradeOwnedList({
        userId: user.id,
        listName: listName.trim(),
        description: description.trim(),
        cardIds,
      })

      if (result.success) {
        setNotificationModal({
          isOpen: true,
          type: "success",
          title: "作成完了",
          message: "カードリストが正常に作成されました。",
        })

        // 成功時は少し遅延してからリダイレクト
        setTimeout(() => {
          router.push("/lists")
        }, 1500)
      } else {
        setNotificationModal({
          isOpen: true,
          type: "error",
          title: "作成エラー",
          message: result.error || "リストの作成に失敗しました。",
        })
      }
    } catch (error) {
      console.error("Error creating list:", error)
      setNotificationModal({
        isOpen: true,
        type: "error",
        title: "システムエラー",
        message: "予期しないエラーが発生しました。もう一度お試しください。",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/lists")}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            リスト一覧に戻る
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">新しいカードリストを作成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-2">
                  リスト名 *
                </label>
                <Input
                  id="listName"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="例: 欲しいカードリスト"
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  説明（任意）
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="このリストについての説明を入力してください"
                  rows={3}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* カード選択セクション */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">カードを選択</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setIsSearchModalOpen(true)}
                className="mb-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                カードを検索・追加
              </Button>

              {selectedCards.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">選択されたカード ({selectedCards.length}枚)</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {selectedCards.map((card) => (
                      <div key={card.id} className="relative group">
                        <div className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
                          <div className="aspect-[3/4] mb-1">
                            <img
                              src={card.imageUrl || "/placeholder.svg"}
                              alt={card.name}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <p className="text-xs text-gray-900 font-medium truncate">{card.name}</p>
                          {card.packName && <p className="text-xs text-gray-500 truncate">{card.packName}</p>}
                        </div>
                        <button
                          onClick={() => removeCard(card.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          aria-label="カードを削除"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>まだカードが選択されていません</p>
                  <p className="text-sm">「カードを検索・追加」ボタンからカードを選択してください</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 作成ボタン */}
          <div className="flex justify-end">
            <Button
              onClick={handleCreateList}
              disabled={isCreating || !listName.trim() || selectedCards.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
            >
              {isCreating ? "作成中..." : "リストを作成"}
            </Button>
          </div>
        </div>
      </div>

      {/* カード検索モーダル */}
      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectionComplete={handleCardSelect}
        allowMultipleSelection={true}
      />

      {/* 通知モーダル */}
      <NotificationModal
        isOpen={notificationModal.isOpen}
        onOpenChange={(open) => setNotificationModal((prev) => ({ ...prev, isOpen: open }))}
        type={notificationModal.type}
        title={notificationModal.title}
        message={notificationModal.message}
      />
    </div>
  )
}
