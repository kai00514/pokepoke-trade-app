"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { createTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import DetailedSearchModal from "@/components/detailed-search-modal"
import { Card } from "@/components/ui/card"
import { X, Search } from "lucide-react"
import { event as gtagEvent } from "@/lib/analytics/gtag"
import { useTranslations } from "next-intl"

interface ListCreationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: (list: TradeOwnedList) => void
}

interface SelectedCard {
  id: string
  name: string
  image_url?: string
}

export default function ListCreationModal({ isOpen, onOpenChange, userId, onSuccess }: ListCreationModalProps) {
  const t = useTranslations()
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const handleClose = () => {
    setListName("")
    setSelectedCards([])
    onOpenChange(false)
  }

  const handleCardSelect = (cards: any[]) => {
    const formattedCards = cards.map((card) => ({
      id: card.id.toString(),
      name: card.name,
      image_url: card.image_url,
    }))
    setSelectedCards(formattedCards)
    setIsSearchModalOpen(false)
  }

  const removeCard = (cardId: string) => {
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleCreate = async () => {
    if (!listName.trim()) {
      toast({
        title: t("errors.errors.title"),
        description: t("errors.validation.enterListName"),
        variant: "destructive",
      })
      return
    }

    if (selectedCards.length === 0) {
      toast({
        title: t("errors.errors.title"),
        description: t("errors.validation.selectAtLeastOneCard"),
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    const cardIds = selectedCards.map((card) => Number.parseInt(card.id))
    const result = await createTradeOwnedList(userId, listName.trim(), cardIds)

    if (result.success) {
      gtagEvent("list_created", {
        category: "engagement",
        list_name: listName.trim(),
        card_count: cardIds.length,
      })

      onSuccess(result.list)
      handleClose()
    } else {
      toast({
        title: t("errors.errors.title"),
        description: result.error,
        variant: "destructive",
      })
    }

    setIsCreating(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("forms.lists.createNewList")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="listName">{t("forms.lists.listName")}</Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder={t("forms.lists.enterListName")}
                maxLength={100}
              />
              <p className="text-sm text-gray-500">{t("forms.lists.characterCount", { current: listName.length, max: 100 })}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>{t("forms.lists.cardSelection", { current: selectedCards.length, max: 35 })}</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSearchModalOpen(true)}
                  disabled={selectedCards.length >= 35}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {t("common.buttons.searchCards")}
                </Button>
              </div>

              {selectedCards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-60 overflow-y-auto">
                  {selectedCards.map((card) => (
                    <Card key={card.id} className="relative p-2">
                      <button
                        onClick={() => removeCard(card.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="aspect-[3/4] bg-gray-100 rounded overflow-hidden mb-2">
                        {card.image_url ? (
                          <img
                            src={card.image_url || "/placeholder.svg"}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">{t("common.misc.noImage")}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center truncate">{card.name}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("forms.lists.noCardsSelected")}</p>
                  <p className="text-sm">{t("forms.lists.selectCardsPrompt")}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t("common.buttons.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !listName.trim() || selectedCards.length === 0}>
                {isCreating ? t("common.buttons.creating") : t("common.buttons.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onCardSelect={handleCardSelect}
        maxSelection={35}
        selectedCards={selectedCards}
        title={t("forms.lists.selectCards")}
        description={t("forms.lists.selectCardsDescription", { max: 35, current: selectedCards.length })}
      />
    </>
  )
}
