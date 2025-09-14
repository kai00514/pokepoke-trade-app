"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, X, Plus } from "lucide-react"
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

  // モーダルを閉じる際のリセット
  const handleClose = () => {
    setListName("")
    setSelectedCards([])
    setIsSearchModalOpen(false)
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

    if (listName.trim().length > 100) {
      toast({
        title: "エラー",
        description: "リスト名は100文字以内で入力してください。",
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
      toast({
        title: "成功",
        description: "新しいリストを作成しました。",
      })
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold text-gray-900">新しいリストを作成</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* リスト名入力 */}
            <div className="space-y-2">
              <Label htmlFor="listName" className="text-sm font-semibold text-gray-700">
                リスト名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="例: 交換用レアカード"
                maxLength={100}
                className="text-base"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">リスト名は必須項目です</p>
                <p className="text-xs text-gray-400">{listName.length}/100</p>
              </div>
            </div>

            {/* カード選択セクション */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold text-gray-700">
                  カード選択 <span className="text-gray-400">（最大35枚）</span>
                </Label>
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                  {selectedCards.length}/35
                </Badge>
              </div>

              <Button
                onClick={() => setIsSearchModalOpen(true)}
                variant="outline"
                className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                disabled={selectedCards.length >= 35}
              >
                <Search className="h-5 w-5 mr-2" />
                {selectedCards.length === 0 ? "カードを検索して追加" : "カードを追加"}
              </Button>

              {/* 選択されたカード一覧 */}
              {selectedCards.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">選択されたカード ({selectedCards.length}枚)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {selectedCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                      >
                        <img
                          src={card.game8_image_url || "/no-card.png"}
                          alt={card.name}
                          className="w-10 h-14 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                          <p className="text-xs text-gray-500 truncate">{card.set_name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCard(card.id)}
                          className="p-1 h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
              disabled={!listName.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  作成
                </>
              )}
            </Button>
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
        title="リストに追加するカードを選択"
      />
    </>
  )
}
