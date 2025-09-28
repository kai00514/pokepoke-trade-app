"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Loader2 } from "lucide-react"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import { getCardsByIds } from "@/lib/card-api"
import { updateTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import NotificationModal from "@/components/ui/notification-modal"

interface ListEditorModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  list: TradeOwnedList
  userId: string
  onSave: (updatedList: TradeOwnedList) => void
}

interface CardInfo {
  id: number
  name: string
  image_url: string
}

export default function ListEditorModal({ isOpen, onOpenChange, list, userId, onSave }: ListEditorModalProps) {
  const [listName, setListName] = useState(list.list_name)
  const [cards, setCards] = useState<CardInfo[]>([])
  const [isCardSearchOpen, setIsCardSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  })

  const showNotification = (type: "success" | "error" | "warning" | "info", title: string, message: string) => {
    setNotificationModal({
      isOpen: true,
      type,
      title,
      message,
    })
  }

  // カード情報を取得
  useEffect(() => {
    if (isOpen) {
      setListName(list.list_name)

      if (list.card_ids.length > 0) {
        setIsLoading(true)
        const fetchCards = async () => {
          try {
            const cardData = await getCardsByIds(list.card_ids)
            const cardInfos: CardInfo[] = cardData.map((card) => ({
              id: card.id,
              name: card.name,
              image_url:
                card.image_url || card.game8_image_url || `/placeholder.svg?height=100&width=70&text=${card.name}`,
            }))
            setCards(cardInfos)
          } catch (error) {
            console.error("カード情報の取得に失敗しました:", error)
            // エラー時はプレースホルダーを使用
            const fallbackCards: CardInfo[] = list.card_ids.map((id) => ({
              id,
              name: `カード${id}`,
              image_url: `/placeholder.svg?height=100&width=70&text=Card${id}`,
            }))
            setCards(fallbackCards)
          } finally {
            setIsLoading(false)
          }
        }
        fetchCards()
      } else {
        setCards([])
        setIsLoading(false)
      }
    }
  }, [isOpen, list])

  const handleAddCards = (selectedCards: SelectedCardType[]) => {
    // 重複除去
    const existingIds = new Set(cards.map((card) => card.id))

    const newCards = selectedCards
      .filter((card) => !existingIds.has(Number.parseInt(card.id)))
      .map((card) => ({
        id: Number.parseInt(card.id),
        name: card.name,
        image_url: card.imageUrl || `/placeholder.svg?height=100&width=70&text=${card.name}`,
      }))

    const totalCards = cards.length + newCards.length
    if (totalCards > 35) {
      showNotification("error", "エラー", `カードは最大35枚まで登録できます。（現在: ${cards.length}枚）`)
      return
    }

    setCards((prev) => [...prev, ...newCards])
    setIsCardSearchOpen(false)

    if (newCards.length > 0) {
      showNotification("success", "成功", `${newCards.length}枚のカードを追加しました。`)
    }
  }

  const handleRemoveCard = (cardId: number) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleSave = async () => {
    if (!listName.trim()) {
      showNotification("error", "エラー", "リスト名を入力してください。")
      return
    }

    setIsSaving(true)
    const result = await updateTradeOwnedList(
      list.id,
      userId,
      listName.trim(),
      cards.map((card) => card.id),
    )

    if (result.success) {
      onSave(result.list)
    } else {
      showNotification("error", "エラー", result.error)
    }
    setIsSaving(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>リストを編集</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* List Name */}
            <div>
              <label className="text-sm font-medium text-[#374151]">リスト名</label>
              <Input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="リスト名を入力"
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            {/* Card Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#374151]">登録カード</span>
                <Badge variant="secondary">{cards.length}/35枚</Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsCardSearchOpen(true)}
                disabled={cards.length >= 35 || isSaving}
              >
                <Plus className="h-4 w-4 mr-2" />
                カードを追加
              </Button>
            </div>

            {/* Cards Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
              </div>
            ) : cards.length > 0 ? (
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                {cards.map((card, index) => (
                  <div key={card.id} className="relative group">
                    <div className="aspect-[7/10] bg-gray-100 rounded-md overflow-hidden border">
                      <img
                        src={card.image_url || "/placeholder.svg"}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveCard(card.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-center mt-1 truncate text-[#6B7280]">{card.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#6B7280] border-2 border-dashed border-[#E5E7EB] rounded-lg">
                <p>カードが登録されていません</p>
                <p className="text-sm mt-1">「カードを追加」ボタンから追加してください</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Search Modal */}
      <DetailedSearchModal
        isOpen={isCardSearchOpen}
        onOpenChange={setIsCardSearchOpen}
        onSelectionComplete={handleAddCards}
        modalTitle="カードを選択"
        allowMultipleSelection={true}
      />

      {/* Notification Modal */}
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
