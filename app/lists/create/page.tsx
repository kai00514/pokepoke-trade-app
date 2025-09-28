"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { DetailedSearchModal } from "@/components/detailed-search-modal"
import { createTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { NotificationModal } from "@/components/ui/notification-modal"

interface SelectedCard {
  id: number
  name: string
  imageUrl?: string
  packName?: string
}

export default function CreateListPage() {
  const { user } = useAuth()
  const [listName, setListName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{
    isOpen: boolean
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  })

  const showNotification = (type: "success" | "error" | "warning" | "info", title: string, message: string) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
    })
  }

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }))
  }

  const handleCardSelect = (cards: SelectedCard[]) => {
    setSelectedCards(cards)
    setIsSearchModalOpen(false)
  }

  const handleRemoveCard = (cardId: number) => {
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      showNotification("error", "ログインが必要です", "リストを作成するにはログインしてください。")
      return
    }

    if (!listName.trim()) {
      showNotification("warning", "入力エラー", "リスト名を入力してください。")
      return
    }

    if (selectedCards.length === 0) {
      showNotification("warning", "入力エラー", "少なくとも1枚のカードを選択してください。")
      return
    }

    setIsSubmitting(true)

    try {
      const cardIds = selectedCards.map((card) => card.id)
      const result = await createTradeOwnedList({
        userId: user.id,
        listName: listName.trim(),
        description: description.trim(),
        cardIds,
      })

      if (result.success) {
        showNotification("success", "リスト作成完了", "カードリストが正常に作成されました。")
        // フォームをリセット
        setListName("")
        setDescription("")
        setSelectedCards([])
      } else {
        showNotification("error", "エラーが発生しました", result.error || "リストの作成に失敗しました。")
      }
    } catch (error) {
      console.error("List creation error:", error)
      showNotification("error", "エラーが発生しました", "リストの作成中に予期しないエラーが発生しました。")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>ログインが必要です</CardTitle>
            <CardDescription>カードリストを作成するにはログインしてください。</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/login">
              <Button className="bg-violet-600 hover:bg-violet-700">ログインページへ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/lists"
            className="inline-flex items-center text-violet-600 hover:text-violet-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            リスト一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">新しいカードリストを作成</h1>
          <p className="text-gray-600 mt-2">トレード用のカードリストを作成して、他のユーザーと交換しましょう。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* リスト情報入力 */}
          <Card>
            <CardHeader>
              <CardTitle>リスト情報</CardTitle>
              <CardDescription>リストの基本情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="listName">リスト名 *</Label>
                  <Input
                    id="listName"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="例: 交換用カードリスト"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">説明（任意）</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="リストの説明を入力してください"
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedCards.length === 0}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {isSubmitting ? "作成中..." : "リストを作成"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* カード選択 */}
          <Card>
            <CardHeader>
              <CardTitle>カード選択</CardTitle>
              <CardDescription>リストに追加するカードを選択してください</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsSearchModalOpen(true)} className="w-full mb-4 bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-2" />
                カードを検索・追加
              </Button>

              {selectedCards.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">選択されたカード: {selectedCards.length}枚</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
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
                          onClick={() => handleRemoveCard(card.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>まだカードが選択されていません</p>
                  <p className="text-sm">上のボタンからカードを追加してください</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* カード検索モーダル */}
      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectionComplete={handleCardSelect}
        multiSelect={true}
        selectedCards={selectedCards}
      />

      {/* 通知モーダル */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  )
}
