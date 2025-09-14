"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { createOwnedList } from "@/lib/actions/trade-owned-lists"
import DetailedSearchModal from "@/components/detailed-search-modal"
import { X, Search, Package } from "lucide-react"
import type { Card } from "@/components/detailed-search-modal"

interface ListCreationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: () => void
}

export default function ListCreationModal({ isOpen, onOpenChange, userId, onSuccess }: ListCreationModalProps) {
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const maxCards = 35
  const progressPercentage = (selectedCards.length / maxCards) * 100

  const handleCardSelectionComplete = (cards: Card[]) => {
    if (cards.length > maxCards) {
      toast({
        title: "選択上限エラー",
        description: `カードは最大${maxCards}枚まで選択できます。`,
        variant: "destructive",
      })
      return
    }
    setSelectedCards(cards)
    setIsSearchModalOpen(false)
  }

  const handleRemoveCard = (cardId: string) => {
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
    try {
      const cardIds = selectedCards.map((card) => Number.parseInt(card.id))
      const result = await createOwnedList(userId, listName.trim(), cardIds)

      if (result.success) {
        toast({
          title: "成功",
          description: "新しいリストを作成しました。",
        })
        onSuccess()
        handleClose()
      } else {
        toast({
          title: "作成エラー",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating list:", error)
      toast({
        title: "エラー",
        description: "リストの作成中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
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
            <DialogTitle className="text-xl font-bold text-gray-900">新しいリストを作成</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* リスト名入力 */}
            <div className="space-y-2">
              <Label htmlFor="listName" className="text-sm font-medium text-gray-700">
                リスト名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="例: 交換用レアカード"
                maxLength={100}
                className="bg-white/80"
              />
              <div className="text-xs text-gray-500 text-right">{listName.length}/100文字</div>
            </div>

            {/* カード選択セクション */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  カード選択 <span className="text-red-500">*</span>
                </Label>
                <Button
                  onClick={() => setIsSearchModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="bg-white/80 hover:bg-blue-50"
                >
                  <Search className="h-4 w-4 mr-2" />
                  カードを検索
                </Button>
              </div>

              {/* プログレスバー */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">選択状況</span>
                  </div>
                  <Badge
                    variant={
                      selectedCards.length === maxCards
                        ? "destructive"
                        : selectedCards.length > 25
                          ? "secondary"
                          : "default"
                    }
                    className="font-medium"
                  >
                    {selectedCards.length} / {maxCards}
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{selectedCards.length === 0 ? "カード未選択" : `${selectedCards.length}枚選択済み`}</span>
                  <span>{maxCards - selectedCards.length}枚追加可能</span>
                </div>
              </div>

              {/* 選択されたカード一覧 */}
              {selectedCards.length > 0 ? (
                <div className="bg-gray-50/80 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">選択されたカード</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {selectedCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center gap-3 bg-white/80 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <img
                          src={card.imageUrl || "/no-card.png"}
                          alt={card.name}
                          className="w-12 h-16 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{card.name}</p>
                          <p className="text-xs text-gray-500">ID: {card.id}</p>
                        </div>
                        <Button
                          onClick={() => handleRemoveCard(card.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/80 rounded-lg p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">カードが選択されていません</p>
                  <Button
                    onClick={() => setIsSearchModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="bg-white/80 hover:bg-blue-50"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    カードを検索して追加
                  </Button>
                </div>
              )}
            </div>

            {/* 作成ボタン */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button onClick={handleClose} variant="outline" className="bg-white/80">
                キャンセル
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !listName.trim() || selectedCards.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? "作成中..." : "作成"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onSelectionComplete={handleCardSelectionComplete}
        maxSelection={maxCards}
        initialSelectedCards={selectedCards}
        modalTitle="カードを選択"
      />
    </>
  )
}
