"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Search, X } from "lucide-react"
import { updateTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { DetailedSearchModal } from "@/components/detailed-search-modal"
import NotificationModal from "@/components/ui/notification-modal"

interface SelectedCard {
  id: number
  name: string
  imageUrl?: string
  packName?: string
}

interface ListEditorModalProps {
  isOpen: boolean
  onClose: () => void
  list: {
    id: string
    list_name: string
    description?: string
    card_ids: number[]
  } | null
  onUpdate: () => void
}

export default function ListEditorModal({ isOpen, onClose, list, onUpdate }: ListEditorModalProps) {
  const [listName, setListName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Notification modal state
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  })

  useEffect(() => {
    if (list) {
      setListName(list.list_name)
      setDescription(list.description || "")
      // カード情報は実際のAPIから取得する必要があります
      // ここでは仮のデータを設定
      setSelectedCards([])
    }
  }, [list])

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

  const handleUpdate = async () => {
    if (!list) return

    if (!listName.trim()) {
      setNotificationModal({
        isOpen: true,
        type: "warning",
        title: "入力エラー",
        message: "リスト名を入力してください。",
      })
      return
    }

    setIsUpdating(true)

    try {
      const cardIds = selectedCards.map((card) => card.id)
      const result = await updateTradeOwnedList(list.id, {
        listName: listName.trim(),
        description: description.trim(),
        cardIds,
      })

      if (result.success) {
        setNotificationModal({
          isOpen: true,
          type: "success",
          title: "更新完了",
          message: "リストが正常に更新されました。",
        })
        onUpdate()
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setNotificationModal({
          isOpen: true,
          type: "error",
          title: "更新エラー",
          message: result.error || "リストの更新に失敗しました。",
        })
      }
    } catch (error) {
      console.error("Error updating list:", error)
      setNotificationModal({
        isOpen: true,
        type: "error",
        title: "システムエラー",
        message: "予期しないエラーが発生しました。もう一度お試しください。",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>リストを編集</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="editListName" className="block text-sm font-medium text-gray-700 mb-2">
                リスト名 *
              </label>
              <Input
                id="editListName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="リスト名を入力"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-2">
                説明（任意）
              </label>
              <Textarea
                id="editDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="説明を入力"
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カード選択</label>
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
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-60 overflow-y-auto">
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
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose} disabled={isUpdating}>
                キャンセル
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating || !listName.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isUpdating ? "更新中..." : "更新"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  )
}
