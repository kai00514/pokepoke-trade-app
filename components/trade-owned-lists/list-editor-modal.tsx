"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import { getCardsByIds } from "@/lib/card-api"
import { createTradeOwnedList, updateTradeOwnedList } from "@/lib/actions/trade-owned-lists"

interface TradeOwnedList {
  id: number
  list_name: string
  card_ids: number[]
  user_id: string
  created_at: string
  updated_at: string
}

interface ListEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingList?: TradeOwnedList | null
  userId: string
}

interface CardInfo {
  id: number
  name: string
  image_url: string
}

export default function ListEditorModal({ isOpen, onClose, onSave, editingList, userId }: ListEditorModalProps) {
  const [listName, setListName] = useState("")
  const [cards, setCards] = useState<CardInfo[]>([])
  const [isCardSearchOpen, setIsCardSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // 編集モードかどうかを判定
  const isEditMode = editingList !== null && editingList !== undefined

  // モーダルが開かれた時の初期化
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingList) {
        // 編集モード
        setListName(editingList.list_name)
        if (editingList.card_ids && editingList.card_ids.length > 0) {
          loadCards(editingList.card_ids)
        } else {
          setCards([])
          setIsLoading(false)
        }
      } else {
        // 新規作成モード
        setListName("")
        setCards([])
        setIsLoading(false)
      }
    }
  }, [isOpen, editingList, isEditMode])

  const loadCards = async (cardIds: number[]) => {
    setIsLoading(true)
    try {
      const cardData = await getCardsByIds(cardIds)
      const cardInfos: CardInfo[] = cardData.map((card) => ({
        id: card.id,
        name: card.name,
        image_url: card.image_url || card.game8_image_url || `/placeholder.svg?height=100&width=70&text=${card.name}`,
      }))
      setCards(cardInfos)
    } catch (error) {
      console.error("カード情報の取得に失敗しました:", error)
      // エラー時はプレースホルダーを使用
      const fallbackCards: CardInfo[] = cardIds.map((id) => ({
        id,
        name: `カード${id}`,
        image_url: `/placeholder.svg?height=100&width=70&text=Card${id}`,
      }))
      setCards(fallbackCards)
    } finally {
      setIsLoading(false)
    }
  }

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
      toast({
        title: "エラー",
        description: `カードは最大35枚まで登録できます。（現在: ${cards.length}枚）`,
        variant: "destructive",
      })
      return
    }

    setCards((prev) => [...prev, ...newCards])
    setIsCardSearchOpen(false)

    if (newCards.length > 0) {
      toast({
        title: "成功",
        description: `${newCards.length}枚のカードを追加しました。`,
      })
    }
  }

  const handleRemoveCard = (cardId: number) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleSave = async () => {
    if (!listName.trim()) {
      toast({
        title: "エラー",
        description: "リスト名を入力してください。",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      let result
      if (isEditMode && editingList) {
        // 更新
        result = await updateTradeOwnedList(
          editingList.id,
          userId,
          listName.trim(),
          cards.map((card) => card.id),
        )
      } else {
        // 新規作成
        result = await createTradeOwnedList(
          userId,
          listName.trim(),
          cards.map((card) => card.id),
        )
      }

      if (result.success) {
        toast({
          title: "成功",
          description: isEditMode ? "リストを更新しました。" : "リストを作成しました。",
        })
        onSave()
      } else {
        toast({
          title: "エラー",
          description: result.error || "操作に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "リストを編集" : "新しいリストを作成"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* List Name */}
            <div>
              <label className="text-sm font-medium text-slate-700">リスト名</label>
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
                <span className="text-sm font-medium text-slate-700">登録カード</span>
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : cards.length > 0 ? (
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                {cards.map((card) => (
                  <div key={card.id} className="relative group">
                    <div className="aspect-[7/10] bg-gray-100 rounded-md overflow-hidden border">
                      <img
                        src={card.image_url || "/placeholder.svg"}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveCard(card.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-center mt-1 truncate text-slate-600">{card.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                <p>カードが登録されていません</p>
                <p className="text-sm mt-1">「カードを追加」ボタンから追加してください</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? "更新中..." : "作成中..."}
                  </>
                ) : isEditMode ? (
                  "更新"
                ) : (
                  "作成"
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
    </>
  )
}
