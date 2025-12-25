"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import ImagePreviewOverlay from "./image-preview-overlay"
import { useTranslations, useLocale } from "next-intl"
import { getLocalizedCardName, getLocalizedCardImage } from "@/lib/i18n-helpers"

export interface Card {
  id: string
  name: string
  imageUrl: string
  type?: string
  rarity?: string
  category?: string
  pack_id?: string
}

interface RarityOption {
  uiLabel: string
  dbValue: string
  iconPath?: string
  fullUiLabel: string
}

interface DetailedSearchModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSelectionComplete: (selectedCards: Card[]) => void
  maxSelection?: number
  initialSelectedCards?: Card[]
  modalTitle?: string
}

export default function DetailedSearchModal({
  isOpen,
  onOpenChange,
  onSelectionComplete,
  maxSelection,
  initialSelectedCards = [],
  modalTitle,
}: DetailedSearchModalProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [keyword, setKeyword] = useState("")
  const [selectedCategoryUI, setSelectedCategoryUI] = useState(t("cards.categories.all"))
  const [selectedRarityDBValue, setSelectedRarityDBValue] = useState("all")
  const [selectedTypeUI, setSelectedTypeUI] = useState("all")
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [packOptions, setPackOptions] = useState<{ id: string; name: string }[]>([])
  const [currentSelectedCards, setCurrentSelectedCards] = useState<Card[]>([])
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

  const cardCategoriesForUI = [
    t("cards.categories.all"),
    t("cards.categories.pokemon"),
    t("cards.categories.trainers"),
    t("cards.categories.goods"),
    t("cards.categories.tools"),
  ]

  const typesForUI = [
    { name: t("cards.types.all"), icon: null, id: "all" },
    { name: t("cards.types.grass"), icon: "/images/types/草.png", id: "草" },
    { name: t("cards.types.fire"), icon: "/images/types/炎.png", id: "炎" },
    { name: t("cards.types.water"), icon: "/images/types/水.png", id: "水" },
    { name: t("cards.types.electric"), icon: "/images/types/電気.png", id: "電気" },
    { name: t("cards.types.psychic"), icon: "/images/types/念.png", id: "エスパー" },
    { name: t("cards.types.fighting"), icon: "/images/types/格闘.png", id: "格闘" },
    { name: t("cards.types.darkness"), icon: "/images/types/悪.png", id: "悪" },
    { name: t("cards.types.metal"), icon: "/images/types/鋼.png", id: "鋼" },
    { name: t("cards.types.colorless"), icon: "/images/types/無色.png", id: "無色" },
    { name: t("cards.types.dragon"), icon: "/images/types/龍.png", id: "ドラゴン" },
  ]

  const rarityOptions: RarityOption[] = [
    { uiLabel: t("cards.rarities.all"), dbValue: "all", fullUiLabel: t("cards.rarities.all") },
    { uiLabel: "1", dbValue: "ダイヤ1", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: t("cards.rarities.diamond1") },
    { uiLabel: "2", dbValue: "ダイヤ2", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: t("cards.rarities.diamond2") },
    { uiLabel: "3", dbValue: "ダイヤ3", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: t("cards.rarities.diamond3") },
    { uiLabel: "4", dbValue: "ダイヤ4", iconPath: "/images/rarities/diamond_single.png", fullUiLabel: t("cards.rarities.diamond4") },
    { uiLabel: "1", dbValue: "星1", iconPath: "/images/rarities/star_single.png", fullUiLabel: t("cards.rarities.star1") },
    { uiLabel: "2", dbValue: "星2", iconPath: "/images/rarities/star_single.png", fullUiLabel: t("cards.rarities.star2") },
    { uiLabel: "3", dbValue: "星3", iconPath: "/images/rarities/star_single.png", fullUiLabel: t("cards.rarities.star3") },
    { uiLabel: t("cards.rarities.crownLabel"), dbValue: "クラウン", iconPath: "/images/rarities/crown.png", fullUiLabel: t("cards.rarities.crown") },
    { uiLabel: t("cards.rarities.color1Label"), dbValue: "色1", iconPath: "/images/rarities/color2.png", fullUiLabel: t("cards.rarities.color1") },
    { uiLabel: t("cards.rarities.color2Label"), dbValue: "色2", iconPath: "/images/rarities/color2.png", fullUiLabel: t("cards.rarities.color2") },
  ]

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
      const { data, error } = await supabase.from("packs").select("id, name").order("name", { ascending: true })
      if (error) {
        toast({
          title: t("errors.data.packsFetchError"),
          description: t("errors.data.packsFetchFailed"),
          variant: "destructive",
        })
      } else if (data) {
        setPackOptions([{ id: "all", name: t("forms.packs.all") }, ...data])
      }
    }
    fetchPackOptions()
  }, [isOpen, toast])

  useEffect(() => {
    async function fetchCardsFromSupabase() {
      if (!isOpen) return
      setIsLoading(true)
      let query = supabase
        .from("cards")
        .select("id, name, name_multilingual, image_url, image_url_multilingual, type_code, rarity_code, category, thumb_url, pack_id")
        .eq("is_visible", true)
      if (keyword.trim()) query = query.ilike("name", `%${keyword.trim()}%`)
      if (selectedCategoryUI !== t("decks.categories.all")) {
        let dbCategory: string | undefined
        if (selectedCategoryUI === t("decks.categories.pokemon")) dbCategory = "pokemon"
        else if (selectedCategoryUI === t("decks.categories.trainers")) dbCategory = "trainers"
        else if (selectedCategoryUI === t("decks.categories.goods")) dbCategory = "goods"
        else if (selectedCategoryUI === t("decks.categories.tools")) dbCategory = "tools"
        if (dbCategory) query = query.eq("category", dbCategory)
      }
      if (selectedTypeUI !== "all") query = query.eq("type_code", selectedTypeUI)
      if (selectedRarityDBValue !== "all") query = query.eq("rarity_code", selectedRarityDBValue)
      if (selectedPackId && selectedPackId !== "all") query = query.eq("pack_id", selectedPackId)
      query = query.order("pack_id", { ascending: false }).order("id", { ascending: true })
      const { data, error } = await query
      if (error) {
        toast({
          title: t("errors.data.fetchError"),
          description: t("errors.data.cardsFetchFailed"),
          variant: "destructive",
        })
        setFetchedCards([])
      } else if (data) {
        const mappedData: Card[] = data.map((dbCard) => ({
          id: String(dbCard.id),
          name: getLocalizedCardName(dbCard, locale),
          imageUrl: getLocalizedCardImage(dbCard, locale),
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

  const toggleCardSelection = (card: Card) => {
    setCurrentSelectedCards((prevSelected) => {
      const isAlreadySelected = prevSelected.find((sc) => sc.id === card.id)
      if (maxSelection === 1) return isAlreadySelected ? [] : [card]
      if (isAlreadySelected) return prevSelected.filter((sc) => sc.id !== card.id)
      if (maxSelection && prevSelected.length >= maxSelection) {
        toast({ title: t("messages.warning.selectionLimit"), description: t("messages.warning.maxSelectionReached", { maxSelection }), variant: "destructive" })
        return prevSelected
      }
      return [...prevSelected, card]
    })
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
    clearLongPressTimer()
    const touchDuration = Date.now() - touchStartTimeRef.current
    if (!isLongPressTriggeredRef.current && touchDuration < 500) {
      toggleCardSelection(card)
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
    startLongPressTimer(card)
  }

  const handleMouseUp = (card: Card, e: React.MouseEvent) => {
    if ("ontouchstart" in window) return
    clearLongPressTimer()
    if (!isLongPressTriggeredRef.current) {
      toggleCardSelection(card)
    }
    isLongPressTriggeredRef.current = false
  }

  const handleMouseLeave = () => {
    if ("ontouchstart" in window) return
    clearLongPressTimer()
    isLongPressTriggeredRef.current = false
  }

  const handleSelectionComplete = () => {
    if (maxSelection === 1 && currentSelectedCards.length !== 1) {
      toast({ title: t("messages.selection.title"), description: t("errors.validation.selectOneCard"), variant: "destructive" })
      return
    }
    onSelectionComplete([...currentSelectedCards])
    onOpenChange(false)
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
    if (typeof onOpenChange === "function") {
      onOpenChange(open)
    }
  }

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        if (isPreviewOverlayOpen) {
          event.preventDefault()
          event.stopPropagation()
          handlePreviewClose()
        } else if (typeof onOpenChange === "function") {
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

  const selectionText = useMemo(() => {
    let text = t("messages.info.selectedCountCards", { count: currentSelectedCards.length })
    if (maxSelection) text += t("messages.info.maxCards", { max: maxSelection })
    return text
  }, [currentSelectedCards, maxSelection, t])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleMainModalClose}>
        <DialogContent className="max-w-3xl w-[95vw] h-[85vh] p-0 flex flex-col gap-0">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">{modalTitle || t("modals.detailedSearch.title")}</DialogTitle>
            <DialogClose
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={(e) => {
                if (isPreviewOverlayOpen) {
                  e.preventDefault()
                  handlePreviewClose()
                }
              }}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t("common.buttons.close")}</span>
            </DialogClose>
          </DialogHeader>
          <ScrollArea className="flex-grow bg-slate-50/50 min-h-0">
            <div className="p-4 space-y-4 border-b">
              <Input
                type="text"
                placeholder={t("forms.placeholders.keyword")}
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
                <p className="text-sm font-medium mb-1 text-slate-700">{t("filters.type")}</p>
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
                <p className="text-sm font-medium mb-1 text-slate-700">{t("filters.pack")}</p>
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
                    {fetchedCards.map((card) => (
                      <button
                        key={card.id}
                        onMouseDown={(e) => handleMouseDown(card, e)}
                        onMouseUp={(e) => handleMouseUp(card, e)}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={(e) => handleTouchStart(card, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={(e) => handleTouchEnd(card, e)}
                        onTouchCancel={handleTouchCancel}
                        className={cn(
                          "aspect-[5/7] relative rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all cursor-pointer select-none",
                          currentSelectedCards.find((sc) => sc.id === card.id)
                            ? "border-blue-600 shadow-lg scale-105"
                            : "border-transparent hover:border-blue-300",
                        )}
                        aria-label={`Select card ${card.name}`}
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
                        {currentSelectedCards.find((sc) => sc.id === card.id) && (
                          <div className="absolute inset-0 bg-blue-700 bg-opacity-60 flex items-center justify-center">
                            <Check className="h-10 w-10 text-white stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="col-span-full text-center text-slate-500 py-10">{t("messages.info.noCardsFound")}</p>
                )}
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
          <DialogFooter className="p-4 border-t bg-white flex-shrink-0 pb-6">
            <div className="flex justify-between items-center w-full gap-3">
              {maxSelection === 1 && currentSelectedCards.length === 1 ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <Image
                    src={currentSelectedCards[0].imageUrl || "/placeholder.svg"}
                    alt={currentSelectedCards[0].name}
                    width={32}
                    height={45}
                    className="rounded object-contain border bg-slate-100"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-slate-700 truncate">{currentSelectedCards[0].name}</span>
                    <span className="text-xs text-slate-500">{selectionText}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">{selectionText}</p>
              )}
              <Button
                onClick={handleSelectionComplete}
                className="bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] px-6 flex-shrink-0"
                disabled={
                  (maxSelection === 1 && currentSelectedCards.length !== 1) ||
                  (maxSelection !== 1 && currentSelectedCards.length === 0 && !!maxSelection)
                }
              >
                {t("common.buttons.complete")}
              </Button>
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

// Named export for compatibility
export { DetailedSearchModal }
