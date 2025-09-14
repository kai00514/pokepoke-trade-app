"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, Search, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { DetailedSearchModal } from "@/components/detailed-search-modal"
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

  const maxCards = 35
  const progressPercentage = (selectedCards.length / maxCards) * 100

  const handleCardSelect = (cards: Card[]) => {
    if (cards.length > maxCards) {
      toast({
        title: "選択上限エラー",
        description: `カードは最大${maxCards}枚まで選択できます。`,
        variant: "destructive",
      })
      return
    }
    setSelectedCards(cards)
  }

  const handleRemoveCard = (cardId: number) => {
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleCreate = async () => {
    if (!listName.trim()) {
      toast({
        title: "入力エラー",
        description: "リスト名を入力してください。",
        variant: "destructive",
      })
      return
    }

    if (selectedCards.length === 0) {
      toast({
        title: "選択エラー",
        description: "少なくとも1枚のカードを選択してください。",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    const cardIds = selectedCards.map((card) => card.id)
    const result = await createTradeOwnedList(userId, listName.trim(), cardIds)

    if (result.success) {
      onSuccess(result.list)
      handleClose()
    } else {
      toast({
        title: "作成エラー",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsCreating(false)
  }

  const handleClose = () => {
    setListName("")
    setSelectedCards([])
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">新しいリストを作成</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto">
            {/* リスト名入力 */}
            <div className="space-y-2">
              <Label htmlFor="listName" className="text-sm font-medium">
                リスト名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="例: 交換用レアカード"
                maxLength={100}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-right">{listName.length}/100</div>
            </div>

            {/* カード選択セクション */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">カード選択</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedCards.length === maxCards ? "destructive" : "default"}>
                    {selectedCards.length}/{maxCards}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSearchModalOpen(true)}
                    disabled={selectedCards.length >= maxCards}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    カードを検索
                  </Button>
                </div>
              </div>

              {/* プログレスバー */}
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>選択状況</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
              </div>

              {/* 選択されたカード一覧 */}
              {selectedCards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                  {selectedCards.map((card) => (
                    <div key={card.id} className="relative group">
                      <div className="bg-white rounded-lg p-2 shadow-sm border hover:shadow-md transition-shadow">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCard(card.id)}
                          className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">カードを検索して選択してください</p>
                </div>
              )}
            </div>
          </div>

          {/* フッター */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isCreating}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !listName.trim() || selectedCards.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? "作成中..." : "作成"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onCardSelect={handleCardSelect}
        selectedCards={selectedCards}
        maxSelection={maxCards}
        title="カードを選択"
      />
    </>
  )
}
