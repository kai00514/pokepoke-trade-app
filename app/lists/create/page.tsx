"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, X, Plus, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import DetailedSearchModal from "@/components/detailed-search-modal"
import NotificationModal from "@/components/ui/notification-modal"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SelectedCard {
  id: string
  name: string
  imageUrl?: string
  packName?: string
}

export default function CreateListPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [listName, setListName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Notification modal states
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) {
        console.error("認証エラー:", error)
        setIsLoading(false)
        return
      }
      setUser(user)
      setIsLoading(false)
    }

    checkUser()
  }, [])

  const showNotification = (type: "success" | "error" | "warning" | "info", title: string, message: string) => {
    setNotificationModal({
      isOpen: true,
      type,
      title,
      message,
    })
  }

  const handleCardSelect = (cards: any[]) => {
    const formattedCards = cards.map((card) => ({
      id: card.id.toString(),
      name: card.name,
      imageUrl: card.imageUrl,
      packName: card.packName,
    }))

    const existingIds = new Set(selectedCards.map((card) => card.id))
    const newCards = formattedCards.filter((card) => !existingIds.has(card.id))

    if (selectedCards.length + newCards.length > 35) {
      showNotification(
        "warning",
        "上限に達しました",
        `カードは最大35枚まで登録できます。（現在: ${selectedCards.length}枚）`,
      )
      return
    }

    setSelectedCards((prev) => [...prev, ...newCards])
    setIsSearchModalOpen(false)

    if (newCards.length > 0) {
      showNotification("success", "カードを追加しました", `${newCards.length}枚のカードを追加しました。`)
    }
  }

  const removeCard = (cardId: string) => {
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!listName.trim()) {
      showNotification("error", "エラー", "リスト名を入力してください。")
      return
    }

    if (selectedCards.length === 0) {
      showNotification("error", "エラー", "少なくとも1枚のカードを選択してください。")
      return
    }

    setIsCreating(true)

    const cardIds = selectedCards.map((card) => Number.parseInt(card.id))
    const result = await createTradeOwnedList({
      userId: user.id,
      listName: listName.trim(),
      description: description.trim(),
      cardIds,
    })

    setIsCreating(false)

    if (result.success) {
      showNotification("success", "リストを作成しました", "カードリストが正常に作成されました。")
      // 成功時は少し遅延してからリダイレクト
      setTimeout(() => {
        router.push("/lists")
      }, 1500)
    } else {
      showNotification("error", "エラーが発生しました", result.error || "リストの作成に失敗しました。")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <Link href="/auth/login">
            <Button>ログイン</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/lists" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            タイムラインに戻る
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">新しいリストを作成</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-2">
                    リスト名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="listName"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="リスト名を入力してください"
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{listName.length}/100文字</p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    説明（任意）
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="リストの説明を入力してください"
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">{description.length}/500文字</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      カード選択 <span className="text-red-500">*</span>
                    </label>
                    <Badge variant={selectedCards.length >= 35 ? "destructive" : "secondary"}>
                      {selectedCards.length}/35枚
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSearchModalOpen(true)}
                    disabled={selectedCards.length >= 35}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    カードを追加
                  </Button>
                </div>

                {selectedCards.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
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
                          type="button"
                          onClick={() => removeCard(card.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>カードが選択されていません</p>
                    <p className="text-sm mt-1">「カードを追加」ボタンからカードを選択してください</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Link href="/lists">
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isCreating || !listName.trim() || selectedCards.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      作成中...
                    </>
                  ) : (
                    "リストを作成"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onSelectionComplete={handleCardSelect}
        modalTitle="カードを選択"
        allowMultipleSelection={true}
      />

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
