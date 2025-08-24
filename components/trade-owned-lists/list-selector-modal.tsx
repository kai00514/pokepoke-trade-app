"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getTradeOwnedLists, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { getCardsByIds } from "@/lib/card-api"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"

interface ListSelectorModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onListSelect: (cards: SelectedCardType[]) => void
}

export default function ListSelectorModal({ isOpen, onOpenChange, userId, onListSelect }: ListSelectorModalProps) {
  const [lists, setLists] = useState<TradeOwnedList[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true)
      const fetchLists = async () => {
        try {
          const result = await getTradeOwnedLists(userId)
          if (result.success) {
            setLists(result.lists)
          }
        } catch (error) {
          console.error("Error fetching lists:", error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchLists()
    }
  }, [isOpen, userId])

  const handleSelectList = async (list: TradeOwnedList) => {
    if (list.card_ids.length === 0) {
      onListSelect([])
      onOpenChange(false)
      return
    }

    try {
      const cardData = await getCardsByIds(list.card_ids)
      const selectedCards: SelectedCardType[] = cardData.map((card) => ({
        id: card.id.toString(),
        name: card.name,
        imageUrl: card.image_url || card.game8_image_url || `/placeholder.svg?height=100&width=70&text=${card.name}`,
        type: card.type_code || "無色",
        rarity: card.rarity_code || "星1",
        category: card.category || "pokemon",
        pack_id: 0,
      }))

      onListSelect(selectedCards)
      onOpenChange(false)
    } catch (error) {
      console.error("Error fetching card details:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>保存済みリストから選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
            </div>
          ) : lists.length > 0 ? (
            <div className="space-y-3">
              {lists.map((list) => (
                <Card
                  key={list.id}
                  className="border border-[#E5E7EB] hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-4" onClick={() => handleSelectList(list)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#111827] mb-1">{list.list_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                          <span>カード数: {list.card_ids.length}枚</span>
                          <span>更新: {formatDate(list.updated_at)}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        選択
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#6B7280]">
              <p className="text-lg mb-2">保存済みリストがありません</p>
              <p className="text-sm">リスト管理画面でリストを作成してください</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
