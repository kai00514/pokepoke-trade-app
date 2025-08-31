"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X, Search, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card } from "@/types/card"

interface ListCreationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: (newList: TradeOwnedList) => void
}

export default function ListCreationModal({ isOpen, onOpenChange, userId, onSuccess }: ListCreationModalProps) {
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  // モーダルを閉じる際の初期化
  const handleClose = () => {
    setListName("")
    setSelectedCards([])
    onOpenChange(false)
  }

  // カード選択完了時の処理
  const handleCardSelection = (cards: Card[]) => {
    setSelectedCards(cards)
    setIsSearchModalOpen(false)
  }

  // カードを削除
  const removeCard = (cardId: number) => {
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

    const result = await createTradeOwnedList({
      userId,
      listName: listName.trim(),
      cardIds: selectedCards.map((card) => card.id),
    })

    setIsCreating(false)

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
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
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

            {/* カード選択セクション */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>選択したカード ({selectedCards.length}/35)</Label>
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

              {/* 選択したカード一覧 */}
              {selectedCards.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                  {selectedCards.map((card) => (
                    <div key={card.id} className="relative group">
                      <div className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="aspect-[3/4] bg-gray-100 rounded mb-2 overflow-hidden">
                          {card.game8_image_url ? (
                            <img
                              src={card.game8_image_url || "/placeholder.svg"}
                              alt={card.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/no-card.png"
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-xs">画像なし</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900 truncate">{card.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {card.rarity}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeCard(card.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">カードを検索して選択してください</p>
                </div>
              )}

              {/* 上限警告 */}
              {selectedCards.length >= 35 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">カードは最大35枚まで選択できます。</p>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
                キャンセル
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !listName.trim() || selectedCards.length === 0}>
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
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onCardSelect={handleCardSelection}
        selectedCards={selectedCards}
        maxSelection={35}
        title="カードを選択"
      />
    </>
  )
}
