"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, Package, ExternalLink } from "lucide-react"
import { getTradeOwnedLists, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { getCardsByIds } from "@/lib/card-api"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import Link from "next/link"

interface ListSelectorModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  onListSelect: (cards: SelectedCardType[]) => void
}

export default function ListSelectorModal({ isOpen, onOpenChange, userId, onListSelect }: ListSelectorModalProps) {
  const [lists, setLists] = useState<TradeOwnedList[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedListId, setSelectedListId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      const fetchLists = async () => {
        setIsLoading(true)
        try {
          const result = await getTradeOwnedLists(userId)
          if (result.success) {
            setLists(result.lists)
          } else {
            console.error("Failed to fetch lists:", result.error)
            setLists([])
          }
        } catch (error) {
          console.error("Error fetching lists:", error)
          setLists([])
        } finally {
          setIsLoading(false)
        }
      }
      fetchLists()
    } else if (isOpen && !userId) {
      setLists([])
      setIsLoading(false)
    }
  }, [isOpen, userId])

  const handleSelectList = async (list: TradeOwnedList) => {
    if (selectedListId === list.id) return

    setSelectedListId(list.id)

    if (list.card_ids.length === 0) {
      onListSelect([])
      onOpenChange(false)
      setSelectedListId(null)
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
    } finally {
      setSelectedListId(null)
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            保存済みリストから選択
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : lists.length > 0 ? (
            <>
              <div className="space-y-3">
                {lists.map((list) => (
                  <Card
                    key={list.id}
                    className={`border transition-all duration-200 cursor-pointer hover:shadow-md ${
                      selectedListId === list.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <CardContent className="p-4" onClick={() => handleSelectList(list)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-2 truncate">{list.list_name}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>{list.card_ids.length}枚</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(list.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="secondary" className="text-xs">
                            ID: {list.id}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={selectedListId === list.id}
                            className="whitespace-nowrap bg-transparent"
                          >
                            {selectedListId === list.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                選択中...
                              </>
                            ) : (
                              "選択"
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>リストを管理したい場合</span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/lists" target="_blank" className="flex items-center gap-1">
                      <ExternalLink className="h-4 w-4" />
                      リスト管理画面
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-sm mx-auto">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">保存済みリストがありません</h3>
                <p className="text-sm text-gray-500 mb-6">
                  カードリストを作成すると、ここから簡単に選択できるようになります。
                </p>
                <Button asChild variant="outline">
                  <Link href="/lists" target="_blank" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    リスト管理画面を開く
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
