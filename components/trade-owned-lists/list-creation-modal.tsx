"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Trash2, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createOwnedList } from "@/lib/actions/trade-owned-lists"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"

interface ListCreationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: () => void
}

export default function ListCreationModal({ isOpen, onOpenChange, userId, onSuccess }: ListCreationModalProps) {
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<SelectedCardType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCardSearch, setShowCardSearch] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
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
        title: "入力エラー",
        description: "少なくとも1枚のカードを選択してください。",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const cardIds = selectedCards.map((card) => Number.parseInt(card.id))
      const result = await createOwnedList(userId, listName.trim(), cardIds)

      if (result.success) {
        toast({
          title: "作成完了",
          description: "リストが作成されました。",
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
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setListName("")
    setSelectedCards([])
    onOpenChange(false)
  }

  const handleCardSelectionComplete = (cards: SelectedCardType[]) => {
    setSelectedCards(cards)
    setShowCardSearch(false)
  }

  const removeCard = (cardId: string) => {
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const progressPercentage = (selectedCards.length / 35) * 100

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">新しいリストを作成</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="listName" className="text-sm font-medium text-gray-700">
                リスト名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="例：交換用レアカード"
                maxLength={100}
                disabled={isSubmitting}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-right">{listName.length}/100文字</div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  カード選択 <span className="text-red-500">*</span>
                </Label>
                <Badge variant={selectedCards.length === 35 ? "default" : "secondary"}>
                  {selectedCards.length}/35枚
                </Badge>
              </div>

              <Button
                type="button"
                onClick={() => setShowCardSearch(true)}
                disabled={isSubmitting || selectedCards.length >= 35}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                カードを選択
              </Button>

              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-2" />
                <div className="text-xs text-gray-500 text-right">
                  {progressPercentage.toFixed(0)}% ({35 - selectedCards.length}枚追加可能)
                </div>
              </div>
            </div>

            {selectedCards.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">選択されたカード ({selectedCards.length}枚)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                  {selectedCards.map((card) => (
                    <div key={card.id} className="relative group">
                      <div className="bg-white rounded-lg p-2 shadow-sm border">
                        <Image
                          src={card.imageUrl || "/placeholder.svg"}
                          alt={card.name}
                          width={80}
                          height={112}
                          className="rounded object-contain aspect-[5/7] mx-auto"
                        />
                        <p className="text-xs text-center mt-1 truncate" title={card.name}>
                          {card.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity rounded-full"
                        onClick={() => removeCard(card.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1 bg-transparent">
                キャンセル
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !listName.trim() || selectedCards.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      <DetailedSearchModal
        isOpen={showCardSearch}
        onOpenChange={setShowCardSearch}
        onSelectionComplete={handleCardSelectionComplete}
        maxSelection={35}
        initialSelectedCards={selectedCards}
        modalTitle="リスト用カードを選択"
      />
    </>
  )
}
