"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Loader2, Sparkles, Package } from "lucide-react"
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
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl">
          <DialogHeader className="pb-6 border-b border-gray-100">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              新しいリストを作成
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
            <div className="space-y-8 p-1">
              {/* リスト名入力 */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-blue-600" />
                  リスト名 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="例: 交換用レアカードリスト"
                  className="border-0 bg-white shadow-sm text-lg py-3 rounded-xl"
                  disabled={isCreating}
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">リストに分かりやすい名前をつけましょう</p>
                  <p className="text-xs text-gray-500">{listName.length}/100文字</p>
                </div>
              </div>

              {/* カード選択セクション */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">登録カード</h3>
                    <Badge
                      variant="secondary"
                      className={`px-3 py-1 ${
                        cards.length >= 35
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          : "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      }`}
                    >
                      {cards.length}/35枚
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsCardSearchOpen(true)}
                    disabled={cards.length >= 35 || isCreating}
                    className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700 rounded-full px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    カードを追加
                  </Button>
                </div>

                {/* プログレスバー */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>登録進捗</span>
                    <span>{Math.round((cards.length / 35) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((cards.length / 35) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* カード一覧 */}
                {cards.length > 0 ? (
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
                      {cards.map((card) => (
                        <div key={card.id} className="relative group">
                          <div className="aspect-[7/10] bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                            <img
                              src={card.image_url || "/placeholder.svg"}
                              alt={card.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveCard(card.id)}
                            className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                            disabled={isCreating}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="text-xs text-center mt-2 truncate text-gray-600 font-medium">{card.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                      <Package className="h-8 w-8 text-blue-600 mx-auto" />
                    </div>
                    <p className="text-gray-600 font-medium mb-2">カードが選択されていません</p>
                    <p className="text-sm text-gray-500">「カードを追加」ボタンから追加してください</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 bg-gray-50 px-6 py-4 -mx-6 -mb-6 rounded-b-2xl">
            <Button
              variant="outline"
              onClick={() => handleModalClose(false)}
              disabled={isCreating}
              className="rounded-full px-6"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !listName.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  作成
                </>
              )}
            </Button>
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
