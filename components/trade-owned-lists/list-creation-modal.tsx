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
import { X, Search, Plus } from "lucide-react"

interface Card {
  id: string
  name: string
  imageUrl?: string // image_url から imageUrl に変更
}

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

  const handleCardSelect = (cards: Card[]) => {
    if (cards.length > maxCards) {
      toast({
        title: "選択上限",
        description: `カードは最大${maxCards}枚まで選択できます。`,
        variant: "destructive",
      })
      return
    }
    setSelectedCards(cards)
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

    setIsCreating(true)
    try {
      const cardIds = selectedCards.map((card) => Number.parseInt(card.id))
      const result = await createOwnedList(userId, listName.trim(), cardIds)

      if (result.success) {
        toast({
          title: "作成完了",
          description: "新しいリストを作成しました。",
        })
        onSuccess()
        handleClose()
      } else {
        toast({
          title: "作成エラー",
          description: result.error || "リストの作成に失敗しました。",
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
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">新しいリストを作成</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* リスト名入力 */}
            <div className="space-y-2">
              <Label htmlFor="listName" className="text-sm font-medium">
                リスト名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="例: メインデッキ用カード"
                maxLength={100}
                className="w-full"
              />
              <p className="text-xs text-gray-500">{listName.length}/100文字</p>
            </div>

            {/* カード選択セクション */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">カード選択 (最大{maxCards}枚)</Label>
                <Button
                  onClick={() => setIsSearchModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Search className="h-4 w-4 mr-2" />
                  カードを検索
                </Button>
              </div>

              {/* プログレスバー */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">選択済み</span>
                  <Badge variant={selectedCards.length === maxCards ? "destructive" : "default"}>
                    {selectedCards.length}/{maxCards}枚
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* 選択されたカード一覧 */}
              {selectedCards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                  {selectedCards.map((card) => (
                    <div key={card.id} className="relative group">
                      <div className="bg-white rounded-lg p-2 shadow-sm border hover:shadow-md transition-shadow">
                        <div className="aspect-[3/4] bg-gray-100 rounded mb-2 overflow-hidden">
                          {card.imageUrl ? ( // image_url から imageUrl に変更
                            <img
                              src={card.imageUrl || "/placeholder.svg"} // image_url から imageUrl に変更
                              alt={card.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900 line-clamp-2">{card.name}</p>
                        <Button
                          onClick={() => handleRemoveCard(card.id)}
                          variant="ghost"
                          size="sm"
                          className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-2">
                    <Plus className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500">カードが選択されていません</p>
                  <Button
                    onClick={() => setIsSearchModalOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-blue-600 hover:text-blue-700"
                  >
                    カードを検索して追加
                  </Button>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                キャンセル
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!listName.trim() || isCreating}
                className="bg-blue-600 hover:bg-blue-700"
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
        onSelectionComplete={handleCardSelect} // onCardSelect から onSelectionComplete に変更
        initialSelectedCards={selectedCards} // selectedCards から initialSelectedCards に変更
        maxSelection={maxCards}
        modalTitle="カードを選択" // title から modalTitle に変更
      />
    </>
  )
}
