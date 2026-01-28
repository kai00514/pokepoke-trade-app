"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Check, X, Loader2, Plus, Minus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import ImagePreviewOverlay from "../image-preview-overlay"
import { useTranslations, useLocale } from "next-intl"

export interface Card {
  id: string
  name: string
  imageUrl: string
  type?: string
  rarity?: string
  category?: string
  pack_id?: string
}

export interface DeckCard extends Card {
  count: number
}

const cardCategoriesForUI = ["全て", "ポケモン", "トレーナーズ", "グッズ", "どうぐ"]
const typesForUI = [
  { name: "全タイプ", icon: null, id: "all" },
  { name: "草", icon: "/images/types/草.png", id: "草" },
  { name: "炎", icon: "/images/types/炎.png", id: "炎" },
  { name: "水", icon: "/images/types/水.png", id: "水" },
  { name: "電気", icon: "/images/types/電気.png", id: "電気" },
  { name: "エスパー", icon: "/images/types/念.png", id: "エスパー" },
  { name: "格闘", icon: "/images/types/格闘.png", id: "格闘" },
  { name: "悪", icon: "/images/types/悪.png", id: "悪" },
  { name: "鋼", icon: "/images/types/鋼.png", id: "鋼" },
  { name: "無色", icon: "/images/types/無色.png", id: "無色" },
  { name: "ドラゴン", icon: "/images/types/龍.png", id: "ドラゴン" },
]

interface RarityOption {
  uiLabel: string
  dbValue: string
  iconPath?: string
  fullUiLabel: string
}

const rarityOptions: RarityOption[] = [
  { uiLabel: "全レアリティ", dbValue: "all", fullUiLabel: "全レアリティ" },
  { uiLabel: "1", dbValue: "ダイヤ1", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: "ダイヤ1" },
  { uiLabel: "2", dbValue: "ダイヤ2", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: "ダイヤ2" },
  { uiLabel: "3", dbValue: "ダイヤ3", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: "ダイヤ3" },
  { uiLabel: "4", dbValue: "ダイヤ4", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: "ダイヤ4" },
  { uiLabel: "1", dbValue: "星1", iconPath: "/images/rarities/star_single.png", fullUiLabel: "星1" },
  { uiLabel: "2", dbValue: "星2", iconPath: "/images/rarities/star_single.png", fullUiLabel: "星2" },
  { uiLabel: "3", dbValue: "星3", iconPath: "/images/rarities/star_single.png", fullUiLabel: "星3" },
  { uiLabel: "クラウン", dbValue: "クラウン", iconPath: "/images/rarities/crown.png", fullUiLabel: "クラウン" },
  { uiLabel: "色1", dbValue: "色1", iconPath: "/images/rarities/color2.png", fullUiLabel: "色1" },
  { uiLabel: "色2", dbValue: "色2", iconPath: "/images/rarities/color2.png", fullUiLabel: "色2" },
]

const allowedDisplayRaritiesDB = ["ダイヤ1", "ダイヤ2", "ダイヤ3", "ダイヤ4", "星1", "星2", "色1", "色2", "クラウン"]

interface DeckCardSelectionModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSelectionComplete: (selectedCards: DeckCard[]) => void
  initialSelectedCards?: DeckCard[]
  modalTitle?: string
}

export default function DeckCardSelectionModal({
  isOpen,
  onOpenChange,
  onSelectionComplete,
  initialSelectedCards = [],
  modalTitle = "デッキカード選択",
}: DeckCardSelectionModalProps) {
  const [keyword, setKeyword] = useState("")
  const [selectedCategoryUI, setSelectedCategoryUI] = useState("全て")
  const [selectedRarityDBValue, setSelectedRarityDBValue] = useState("all")
  const [selectedTypeUI, setSelectedTypeUI] = useState("all")
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [packOptions, setPackOptions] = useState<{ id: string; name: string }[]>([])
  const [currentSelectedCards, setCurrentSelectedCards] = useState<DeckCard[]>([])
  const [fetchedCards, setFetchedCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewOverlayOpen, setIsPreviewOverlayOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewCardName, setPreviewCardName] = useState<string | undefined>(undefined)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressTriggeredRef = useRef(false)
  const isInitializedRef = useRef(false)
  const touchStartTimeRef = useRef<number>(0)
  const touchStartPositionRef = useRef<{ x: number; y: number } | null>(null)
  const { toast } = useToast()
  const locale = useLocale()
  const t = useTranslations()

  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      setCurrentSelectedCards([...initialSelectedCards])
      isInitializedRef.current = true
    } else if (!isOpen) {
      isInitializedRef.current = false
      setIsPreviewOverlayOpen(false)
      setPreviewImageUrl(null)
      setPreviewCardName(undefined)
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [isOpen, initialSelectedCards])

  useEffect(() => {
    async function fetchPackOptions() {
      if (!isOpen) return
      const { data, error } = await supabase.from("packs").select("id, name, name_multilingual").order("id", { ascending: true })
      if (error) {
        toast({
          title: "パック情報取得エラー",
          description: "パック情報の読み込みに失敗しました。",
          variant: "destructive",
        })
      } else if (data) {
        // Localize pack names
        const localizedPacks = data.map(pack => ({
          id: pack.id,
          name: pack.name_multilingual?.[locale] || pack.name
        }))
        setPackOptions([{ id: "all", name: "全てのパック" }, ...localizedPacks])
      }
    }
    fetchPackOptions()
  }, [isOpen, toast, locale])

  useEffect(() => {
    async function fetchCardsFromSupabase() {
      if (!isOpen) return
      setIsLoading(true)
      let query = supabase
        .from("cards")
        .select("id, name, image_url, type_code, rarity_code, category, thumb_url, pack_id")
        .eq("is_visible", true)
      if (keyword.trim()) query = query.ilike("name", `%${keyword.trim()}%`)
      if (selectedCategoryUI !== "全て") {
        let dbCategory: string | undefined
        if (selectedCategoryUI === "ポケモン") dbCategory = "pokemon"
        else if (selectedCategoryUI === "トレーナーズ") dbCategory = "trainers"
        else if (selectedCategoryUI === "グッズ") dbCategory = "goods"
        else if (selectedCategoryUI === "どうぐ") dbCategory = "tools"
        if (dbCategory) query = query.eq("category", dbCategory)
      }
      if (selectedTypeUI !== "all") query = query.eq("type_code", selectedTypeUI)
      if (selectedRarityDBValue !== "all") query = query.eq("rarity_code", selectedRarityDBValue)
      if (selectedPackId && selectedPackId !== "all") query = query.eq("pack_id", selectedPackId)
      query = query.order("pack_id", { ascending: false }).order("id", { ascending: true })
      const { data, error } = await query
      if (error) {
        toast({
          title: "データ取得エラー",
          description: "カード情報の読み込みに失敗しました。",
          variant: "destructive",
        })
        setFetchedCards([])
      } else if (data) {
        const mappedData: Card[] = data.map((dbCard) => ({
          id: String(dbCard.id),
          name: dbCard.name,
          imageUrl: dbCard.image_url,
          type: dbCard.type_code,
          rarity: dbCard.rarity_code,
          category: String(dbCard.category),
          pack_id: dbCard.pack_id,
        }))
        setFetchedCards(mappedData)
      }
      setIsLoading(false)
    }
    fetchCardsFromSupabase()
  }, [isOpen, keyword, selectedCategoryUI, selectedRarityDBValue, selectedTypeUI, selectedPackId, toast])

  const totalCardCount = currentSelectedCards.reduce((sum, card) => sum + card.count, 0)

  const addCardToDeck = (card: Card) => {
    const existingCard = currentSelectedCards.find((sc) => sc.id === card.id)
    if (existingCard) {
      if (existingCard.count >= 2) {
        toast({ title: "枚数制限", description: "同じカードは最大2枚まで追加できます。", variant: "destructive" })
        return
      }
      setCurrentSelectedCards(
        currentSelectedCards.map((sc) => (sc.id === card.id ? { ...sc, count: sc.count + 1 } : sc)),
      )
    } else {
      if (totalCardCount >= 20) {
        toast({ title: "デッキ上限", description: "デッキは最大20枚まで追加できます。", variant: "destructive" })
        return
      }
      setCurrentSelectedCards([...currentSelectedCards, { ...card, count: 1 }])
    }
  }

  const removeCardFromDeck = (card: Card) => {
    const existingCard = currentSelectedCards.find((sc) => sc.id === card.id)
    if (existingCard) {
      if (existingCard.count > 1) {
        setCurrentSelectedCards(
          currentSelectedCards.map((sc) => (sc.id === card.id ? { ...sc, count: sc.count - 1 } : sc)),
        )
      } else {
        setCurrentSelectedCards(currentSelectedCards.filter((sc) => sc.id !== card.id))
      }
    }
  }

  const getCardCount = (cardId: string) => {
    const card = currentSelectedCards.find((sc) => sc.id === cardId)
    return card ? card.count : 0
  }

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const startLongPressTimer = (card: Card) => {
    clearLongPressTimer()
    isLongPressTriggeredRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true
      setPreviewImageUrl(card.imageUrl)
      setPreviewCardName(card.name)
      setIsPreviewOverlayOpen(true)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
  }

  const handleTouchStart = (card: Card, e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    touchStartTimeRef.current = Date.now()
    touchStartPositionRef.current = { x: touch.clientX, y: touch.clientY }
    startLongPressTimer(card)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPositionRef.current && e.touches[0]) {
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPositionRef.current.x)
      const deltaY = Math.abs(touch.clientY - touchStartPositionRef.current.y)
      if (deltaX > 10 || deltaY > 10) {
        clearLongPressTimer()
        isLongPressTriggeredRef.current = false
      }
    }
  }

  const handleTouchEnd = (card: Card, e: React.TouchEvent) => {
    e.preventDefault()
    clearLongPressTimer()
    const touchDuration = Date.now() - touchStartTimeRef.current
    if (!isLongPressTriggeredRef.current && touchDuration < 500) {
      addCardToDeck(card)
    }
    isLongPressTriggeredRef.current = false
    touchStartPositionRef.current = null
  }

  const handleTouchCancel = () => {
    clearLongPressTimer()
    isLongPressTriggeredRef.current = false
    touchStartPositionRef.current = null
  }

  const handleMouseDown = (card: Card, e: React.MouseEvent) => {
    if ("ontouchstart" in window) return
    e.preventDefault()
    startLongPressTimer(card)
  }

  const handleMouseUp = (card: Card, e: React.MouseEvent) => {
    if ("ontouchstart" in window) return
    e.preventDefault()
    clearLongPressTimer()
    if (!isLongPressTriggeredRef.current) {
      addCardToDeck(card)
    }
    isLongPressTriggeredRef.current = false
  }

  const handleMouseLeave = () => {
    if ("ontouchstart" in window) return
    clearLongPressTimer()
    isLongPressTriggeredRef.current = false
  }

  const handleSelectionComplete = () => {
    onSelectionComplete([...currentSelectedCards])
  }

  const handlePreviewClose = () => {
    setIsPreviewOverlayOpen(false)
    setPreviewImageUrl(null)
    setPreviewCardName(undefined)
  }

  const handleMainModalClose = (open: boolean) => {
    if (!open && isPreviewOverlayOpen) {
      handlePreviewClose()
      return
    }
    if (!open) {
      setIsPreviewOverlayOpen(false)
      setPreviewImageUrl(null)
      setPreviewCardName(undefined)
    }
    onOpenChange(open)
  }

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        if (isPreviewOverlayOpen) {
          handlePreviewClose()
          event.preventDefault()
          event.stopPropagation()
        } else {
          onOpenChange(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey, true)
      return () => {
        document.removeEventListener("keydown", handleEscapeKey, true)
      }
    }
  }, [isOpen, isPreviewOverlayOpen, onOpenChange])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleMainModalClose}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">{modalTitle}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 min-h-0">
            {/* 左側: カード検索・選択エリア */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-grow bg-slate-50/50 min-h-0">
                <div className="p-4 space-y-4 border-b">
                  <Input
                    type="text"
                    placeholder="キーワー"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-grow"
                  />
                  <div className="flex flex-wrap gap-2">
                    {cardCategoriesForUI.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategoryUI === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategoryUI(category)}
                        className={cn(
                          selectedCategoryUI === category && "bg-blue-600 hover:bg-blue-700 text-white",
                          "text-xs px-3 py-1 h-auto",
                        )}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {rarityOptions.map((option) => (
                      <Button
                        key={option.dbValue}
                        variant={selectedRarityDBValue === option.dbValue ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedRarityDBValue(option.dbValue)}
                        className={cn(
                          selectedRarityDBValue === option.dbValue && "bg-blue-600 hover:bg-blue-700 text-white",
                          "text-xs px-3 py-1 h-auto flex items-center gap-1",
                        )}
                      >
                        {option.iconPath && option.dbValue !== "all" ? (
                          <Image
                            src={option.iconPath || "/placeholder.svg"}
                            alt={option.fullUiLabel}
                            width={16}
                            height={16}
                            className="object-contain"
                          />
                        ) : option.dbValue === "all" ? (
                          <Check className="h-3 w-3" />
                        ) : null}
                        {option.uiLabel}
                      </Button>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1 text-slate-700">タイプ</p>
                    <div className="flex flex-wrap gap-2">
                      {typesForUI.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedTypeUI(type.id)}
                          className={cn(
                            "p-1.5 rounded-md border transition-colors",
                            selectedTypeUI === type.id
                              ? "border-blue-600 ring-2 ring-blue-600 ring-offset-1 bg-blue-50"
                              : "border-slate-300 hover:border-slate-400",
                          )}
                          title={type.name}
                        >
                          {type.icon ? (
                            <Image src={type.icon || "/placeholder.svg"} alt={type.name} width={28} height={28} />
                          ) : (
                            <span className="h-7 w-7 flex items-center justify-center text-blue-600">
                              <Check className="h-5 w-5" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1 text-slate-700">パック名</p>
                    <div className="flex flex-wrap gap-2">
                      {packOptions.map((pack) => (
                        <Button
                          key={pack.id}
                          variant={selectedPackId === pack.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedPackId(pack.id)}
                          className={cn(
                            selectedPackId === pack.id && "bg-blue-600 hover:bg-blue-700 text-white",
                            "text-xs px-3 py-1 h-auto",
                          )}
                        >
                          {pack.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 relative">
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    </div>
                  )}
                  <div className={cn("transition-opacity duration-300", isLoading ? "opacity-50" : "opacity-100")}>
                    {fetchedCards.length > 0 ? (
                      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2">
                        {fetchedCards.map((card) => {
                          const cardCount = getCardCount(card.id)
                          return (
                            <div key={card.id} className="relative">
                              <button
                                onMouseDown={(e) => handleMouseDown(card, e)}
                                onMouseUp={(e) => handleMouseUp(card, e)}
                                onMouseLeave={handleMouseLeave}
                                onTouchStart={(e) => handleTouchStart(card, e)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={(e) => handleTouchEnd(card, e)}
                                onTouchCancel={handleTouchCancel}
                                className={cn(
                                  "aspect-[5/7] relative rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all cursor-pointer select-none w-full",
                                  cardCount > 0
                                    ? "border-blue-600 shadow-lg scale-105"
                                    : "border-transparent hover:border-blue-300",
                                )}
                                aria-label={`Add card ${card.name}`}
                                style={{
                                  touchAction: "none",
                                  WebkitTouchCallout: "none",
                                  WebkitUserSelect: "none",
                                  userSelect: "none",
                                }}
                              >
                                <Image
                                  src={
                                    card.imageUrl ||
                                    `/placeholder.svg?width=150&height=210&query=${encodeURIComponent(card.name) || "card"}`
                                  }
                                  alt={card.name}
                                  fill
                                  sizes="(max-width: 640px) 20vw, (max-width: 768px) 16vw, (max-width: 1024px) 14vw, 12vw"
                                  className="object-cover bg-slate-100 pointer-events-none"
                                  draggable={false}
                                />
                                {cardCount > 0 && (
                                  <div className="absolute inset-0 bg-blue-700 bg-opacity-60 flex items-center justify-center">
                                    <span className="text-white font-bold text-2xl">{cardCount}</span>
                                  </div>
                                )}
                              </button>
                              {cardCount > 0 && (
                                <div className="absolute -top-2 -right-2 flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600 border-red-500"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeCardFromDeck(card)
                                    }}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 w-6 p-0 bg-green-500 text-white hover:bg-green-600 border-green-500"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      addCardToDeck(card)
                                    }}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="col-span-full text-center text-slate-500 py-10">該当するカードが見つかりません。</p>
                    )}
                  </div>
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>

            {/* 右側: 選択されたカード一覧 */}
            <div className="w-80 border-l bg-white flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-lg">選択中のカード</h3>
                <p className="text-sm text-gray-600">
                  {totalCardCount}/20枚 ({currentSelectedCards.length}種類)
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {currentSelectedCards.map((card) => (
                    <div key={card.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      <Image
                        src={card.imageUrl || "/placeholder.svg"}
                        alt={card.name}
                        width={40}
                        height={56}
                        className="rounded object-cover bg-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{card.name}</p>
                        <p className="text-xs text-gray-500">×{card.count}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 bg-transparent"
                          onClick={() => removeCardFromDeck(card)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 bg-transparent"
                          onClick={() => addCardToDeck(card)}
                          disabled={card.count >= 2}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {currentSelectedCards.length === 0 && (
                    <p className="text-center text-gray-500 py-8">まだカードが選択されていません</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-white flex-shrink-0">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-600">
                  合計: {totalCardCount}/20枚 ({currentSelectedCards.length}種類)
                </p>
                {totalCardCount > 20 && <p className="text-sm text-red-600">⚠️ 20枚を超えています</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button
                  onClick={handleSelectionComplete}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={totalCardCount === 0}
                >
                  {t('common.buttons.complete')}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImagePreviewOverlay
        isOpen={isPreviewOverlayOpen}
        imageUrl={previewImageUrl}
        cardName={previewCardName}
        onClose={handlePreviewClose}
      />
    </>
  )
}
