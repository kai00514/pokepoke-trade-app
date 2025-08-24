"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
// 必要なimportを追加
import { getCardsByIds } from "@/lib/card-api"

interface TradeOwnedList {
  id: number
  list_name: string
  card_ids: number[]
  updated_at: string
}

interface ListEditorModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  list: TradeOwnedList
  onSave: (updatedList: TradeOwnedList) => void
}

interface CardInfo {
  id: number
  name: string
  image_url: string
}

export default function ListEditorModal({ isOpen, onOpenChange, list, onSave }: ListEditorModalProps) {
  const [listName, setListName] = useState(list.list_name)
  const [cards, setCards] = useState<CardInfo[]>([])
  const [isCardSearchOpen, setIsCardSearchOpen] = useState(false)
  const { toast } = useToast()

  // old: モックカードデータ（実際の実装時はAPIから取得）
  // useEffect内を以下に置き換え
  useEffect(() => {
    if (isOpen) {
      setListName(list.list_name)
      
      // 実際のカード情報を取得
      if (list.card_ids.length > 0) {
        const fetchCards = async () => {
          try {
            const cardData = await getCardsByIds(list.card_ids)
            const cardInfos: CardInfo[] = cardData.map((card) => ({
              id: card.id,
              name: card.name,
              image_url: card.image_url || card.game8_image_url || `/placeholder.svg?height=100&width=70&text=${card.name}`,
            }))
            setCards(cardInfos)
          } catch (error) {
            console.error('カード情報の取得に失敗しました:', error)
            // エラー時はプレースホルダーを使用
            const fallbackCards: CardInfo[] = list.card_ids.map((id) => ({
              id,
              name: `カード${id}`,
              image_url: `/placeholder.svg?height=100&width=70&text=Card${id}`,
            }))
            setCards(fallbackCards)
          }
        }
        fetchCards()
      } else {
        setCards([])
      }
    }
  }, [isOpen, list])

  const handleAddCards = (selectedCards: SelectedCardType[]) => {
    // 重複除去
    const existingIds = new Set(cards.map((card) => card.id))
    const newCards = selectedCards
      .filter((card) => !existingIds.has(card.id))
      .map((card) => ({
        id: card.id,
        name: card.name,
        image_url: card.image_url || `/placeholder.svg?height=100&width=70&text=${card.name}`,
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

  const handleSave = () => {
    if (!listName.trim()) {
      toast({
        title: "エラー",
        description: "リスト名を入力してください。",
        variant: "destructive",
      })
      return
    }

    const updatedList: TradeOwnedList = {
      ...list,
      list_name: listName.trim(),
      card_ids: cards.map((card) => card.id),
      updated_at: new Date().toISOString(),
    }

    onSave(updatedList)
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
              />
            </div>

            {/* Card Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#374151]">登録カード</span>
                <Badge variant="secondary">{cards.length}/35枚</Badge>
              </div>
              <Button variant="outline" onClick={() => setIsCardSearchOpen(true)} disabled={cards.length >= 35}>
                <Plus className="h-4 w-4 mr-2" />
                カードを追加
              </Button>
            </div>

            {/* Cards Grid */}
            {cards.length > 0 ? (
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
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
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave}>保存</Button>
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
