"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X, Search } from "lucide-react"
import { DetailedSearchModal } from "@/components/detailed-search-modal"
import { createOwnedList } from "@/lib/actions/trade-owned-lists"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface Card {
  id: string
  name: string
  image_url?: string
}

interface ListCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export function ListCreationModal({ isOpen, onClose, onCreated }: ListCreationModalProps) {
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClient()

  const handleClose = () => {
    setListName("")
    setSelectedCards([])
    onClose()
  }

  const handleCardSelect = (cards: Card[]) => {
    setSelectedCards(cards)
    setIsSearchModalOpen(false)
  }

  const removeCard = (cardId: string) => {
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

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

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("ユーザーが認証されていません")
      }

      const cardIds = selectedCards.map((card) => Number.parseInt(card.id))
      await createOwnedList(user.id, listName.trim(), cardIds)

      toast({
        title: "成功",
        description: "リストが作成されました。",
      })

      handleClose()
      onCreated()
    } catch (error) {
      console.error("Error creating list:", error)
      toast({
        title: "エラー",
        description: "リストの作成に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新しいリストを作成</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>選択したカード ({selectedCards.length}/35)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSearchModalOpen(true)}
                  disabled={selectedCards.length >= 35}
                >
                  <Search className="h-4 w-4 mr-2" />
                  カードを検索
                </Button>
              </div>

              {selectedCards.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto">
                  {selectedCards.map((card) => (
                    <div key={card.id} className="relative group">
                      <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden">
                        {card.image_url ? (
                          <img
                            src={card.image_url || "/placeholder.svg"}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs text-center p-2">{card.name}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeCard(card.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-xs text-center mt-1 truncate">{card.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🃏</div>
                  <p>カードが選択されていません</p>
                  <p className="text-sm">「カードを検索」ボタンからカードを選択してください</p>
                </div>
              )}

              {selectedCards.length >= 35 && (
                <Badge variant="secondary" className="w-fit">
                  最大枚数に達しました
                </Badge>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                キャンセル
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !listName.trim() || selectedCards.length === 0}>
                {isCreating ? "作成中..." : "作成"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onCardSelect={handleCardSelect}
        selectedCards={selectedCards}
        maxSelection={35}
        title="カードを選択"
      />
    </>
  )
}
