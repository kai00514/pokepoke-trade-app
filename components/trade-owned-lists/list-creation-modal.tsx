"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { createTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import DetailedSearchModal from "@/components/detailed-search-modal"
import { Card } from "@/components/ui/card"
import { X, Search } from "lucide-react"

interface ListCreationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: (list: TradeOwnedList) => void
}

interface SelectedCard {
  id: string
  name: string
  image_url?: string
}

export default function ListCreationModal({ isOpen, onOpenChange, userId, onSuccess }: ListCreationModalProps) {
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  // モーダルを閉じる時の処理
  const handleClose = () => {
    setListName("")
    setSelectedCards([])
    onOpenChange(false)
  }

  // カード選択時の処理
  const handleCardSelect = (cards: any[]) => {
    const formattedCards = cards.map((card) => ({
      id: card.id.toString(),
      name: card.name,
      image_url: card.image_url,
    }))
    setSelectedCards(formattedCards)
    setIsSearchModalOpen(false)
  }

  // カードを削除
  const removeCard = (cardId: string) => {
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId))
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

    if (selectedCards.length === 0) {
      toast({
        title: "エラー",
        description: "少なくとも1枚のカードを選択してください。",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    const cardIds = selectedCards.map((card) => Number.parseInt(card.id))
    const result = await createTradeOwnedList(userId, listName.trim(), cardIds)

    if (result.success) {
      onSuccess(result.list)
      handleClose()
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }

    setIsCreating(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新しいリストを作成</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* リスト名入力 */}
            <div className="space-y-2">
              <Label htmlFor="listName">リスト名</Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="リスト名を入力してください"
                maxLength={100}
              />
              <p className="text-sm text-gray-500">{listName.length}/100文字</p>
            </div>

            {/* カード選択 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>カード選択 ({selectedCards.length}/35)</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSearchModalOpen(true)}
                  disabled={selectedCards.length >= 35}
                >
                  <Search className="h-4 w-4 mr-2" />
                  カードを検索
                </Button>
              </div>

              {/* 選択されたカード一覧 */}
              {selectedCards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-60 overflow-y-auto">
                  {selectedCards.map((card) => (
                    <Card key={card.id} className="relative p-2">
                      <button
                        onClick={() => removeCard(card.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="aspect-[3/4] bg-gray-100 rounded overflow-hidden mb-2">
                        {card.image_url ? (
                          <img
                            src={card.image_url || "/placeholder.svg"}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center truncate">{card.name}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>カードが選択されていません</p>
                  <p className="text-sm">「カードを検索」ボタンからカードを選択してください</p>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                キャンセル
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !listName.trim() || selectedCards.length === 0}>
                {isCreating ? "作成中..." : "作成"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* カード検索モーダル */}
      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onCardSelect={handleCardSelect}
        maxSelection={35}
        selectedCards={selectedCards}
        title="カードを選択"
        description={`リストに追加するカードを選択してください（最大35枚、現在${selectedCards.length}枚選択中）`}
      />
    </>
  )
}
