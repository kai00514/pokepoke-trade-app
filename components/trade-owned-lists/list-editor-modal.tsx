"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Search, Trash2, Plus } from "lucide-react"
import { updateTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { DetailedSearchModal } from "@/components/detailed-search-modal"
import { NotificationModal } from "@/components/ui/notification-modal"

interface SelectedCard {
  id: number
  name: string
  imageUrl?: string
  packName?: string
}

interface TradeOwnedList {
  id: number
  list_name: string
  description?: string
  card_ids: number[]
}

interface ListEditorModalProps {
  isOpen: boolean
  onClose: () => void
  list: TradeOwnedList | null
  onUpdate: () => void
}

export function ListEditorModal({ isOpen, onClose, list, onUpdate }: ListEditorModalProps) {
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

  useEffect(() => {
    if (list) {
      setListName(list.list_name)
      setDescription(list.description || "")
      // カード情報を取得してselectedCardsに設定する処理が必要
      // 今回は簡略化してcard_idsのみを使用
      const cards = list.card_ids.map((id) => ({
        id,
        name: `Card ${id}`,
        imageUrl: "/placeholder.svg",
      }))
      setSelectedCards(cards)
    }
  }, [list])

  const handleCardSelect = (cards: SelectedCard[]) => {
    setSelectedCards(cards)
    setIsSearchModalOpen(false)
  }

  const handleRemoveCard = (cardId: number) => {
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!list) return

    if (!listName.trim()) {
      showNotification("warning", "入力エラー", "リスト名を入力してください。")
      return
    }

    setIsSubmitting(true)

    try {
      const cardIds = selectedCards.map((card) => card.id)
      const result = await updateTradeOwnedList(list.id, {
        listName: listName.trim(),
        description: description.trim(),
        cardIds,
      })

      if (result.success) {
        showNotification("success", "更新完了", "リストが正常に更新されました。")
        onUpdate()
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        showNotification("error", "エラーが発生しました", result.error || "リストの更新に失敗しました。")
      }
    } catch (error) {
      console.error("List update error:", error)
      showNotification("error", "エラーが発生しました", "リストの更新中に予期しないエラーが発生しました。")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>リストを編集</DialogTitle>
            <DialogDescription>リストの情報とカードを編集できます</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="listName">リスト名 *</Label>
                <Input
                  id="listName"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="リスト名を入力"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">説明（任意）</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="リストの説明"
                  rows={2}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>カード選択</Label>
                <Button
                  type="button"
                  onClick={() => setIsSearchModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  カードを追加
                </Button>
              </div>

              {selectedCards.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
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
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(card.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>カードが選択されていません</p>
                  <p className="text-sm">上のボタンからカードを追加してください</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
                {isSubmitting ? "更新中..." : "リストを更新"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
    </>
  )
}
