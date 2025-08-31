"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import { createTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"

interface ListCreationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: (newList: TradeOwnedList) => void
}

interface CardInfo {
  id: number
  name: string
  image_url: string
}

export default function ListCreationModal({ isOpen, onOpenChange, userId, onSuccess }: ListCreationModalProps) {
  const [listName, setListName] = useState("")
  const [cards, setCards] = useState<CardInfo[]>([])
  const [isCardSearchOpen, setIsCardSearchOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  // モーダルが閉じられた時の初期化
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setListName("")
      setCards([])
      setIsCardSearchOpen(false)
    }
    onOpenChange(open)
  }

  // カード追加処理
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

  // カード削除処理
  const handleRemoveCard = (cardId: number) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  // リスト作成処理
  const handleCreate = async () => {
    if (!listName.trim()) {
      toast({
        title: "エラー",
        description: "リスト名を入力してください。",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    // まずリストを作成
    const createResult = await createTradeOwnedList(userId, listName.trim())

    if (!createResult.success) {
      toast({
        title: "エラー",
        description: createResult.error,
        variant: "destructive",
      })
      setIsCreating(false)
      return
    }

    // カードが選択されている場合は更新
    if (cards.length > 0) {
      const { updateTradeOwnedList } = await import("@/lib/actions/trade-owned-lists")
      const updateResult = await updateTradeOwnedList(
        createResult.list.id,
        userId,
        listName.trim(),
        cards.map((card) => card.id),
      )

      if (!updateResult.success) {
        toast({
          title: "警告",
          description: "リストは作成されましたが、カードの追加に失敗しました。",
          variant: "destructive",
        })
        setIsCreating(false)
        onSuccess(createResult.list)
        return
      }

      onSuccess(updateResult.list)
    } else {
      onSuccess(createResult.list)
    }

    setIsCreating(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新しいリストを作成</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* リスト名入力 */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                リスト名 <span className="text-red-500">*</span>
              </label>
              <Input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="例: 交換用カードリスト"
                className="mt-1"
                disabled={isCreating}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{listName.length}/100文字</p>
            </div>

            {/* カード選択セクション */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">登録カード</span>
                <Badge variant="secondary">{cards.length}/35枚</Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsCardSearchOpen(true)}
                disabled={cards.length >= 35 || isCreating}
              >
                <Plus className="h-4 w-4 mr-2" />
                カードを追加
              </Button>
            </div>

            {/* カード一覧 */}
            {cards.length > 0 ? (
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                {cards.map((card) => (
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
                      disabled={isCreating}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-center mt-1 truncate text-gray-600">{card.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p>カードが選択されていません</p>
                <p className="text-sm mt-1">「カードを追加」ボタンから追加してください</p>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => handleModalClose(false)} disabled={isCreating}>
                キャンセル
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !listName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    作成中...
                  </>
                ) : (
                  "作成"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* カード検索モーダル */}
      <DetailedSearchModal
        isOpen={isCardSearchOpen}
        onOpenChange={setIsCardSearchOpen}
        onSelectionComplete={handleAddCards}
        modalTitle="カードを選択"
      />
    </>
  )
}
