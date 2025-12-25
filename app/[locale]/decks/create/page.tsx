"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Link } from "@/lib/i18n-navigation"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import { getLocalizedCardName, getLocalizedCardImage } from "@/lib/i18n-helpers"
import { useParams } from "next/navigation"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ChevronDown, ChevronUp, Trash2, Save, Loader2, Check, ImageIcon } from 'lucide-react'
import { cn } from "@/lib/utils"
import type { Card as CardType } from "@/types/card"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { createDeck, type CreateDeckInput } from "@/lib/actions/deck-posts"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import { event as gtagEvent } from "@/lib/analytics/gtag"

type DeckCard = CardType & { quantity: number }

const energyTypes = [
  { name: "草", icon: "/images/types/草.png", id: "grass", color: "bg-green-500" },
  { name: "炎", icon: "/images/types/炎.png", id: "fire", color: "bg-red-500" },
  { name: "水", icon: "/images/types/水.png", id: "water", color: "bg-blue-500" },
  { name: "電気", icon: "/images/types/電気.png", id: "electric", color: "bg-yellow-500" },
  { name: "エスパー", icon: "/images/types/%E5%BF%B5.png", id: "psychic", color: "bg-purple-500" },
  { name: "格闘", icon: "/images/types/格闘.png", id: "fighting", color: "bg-orange-500" },
  { name: "悪", icon: "/images/types/悪.png", id: "dark", color: "bg-gray-800" },
  { name: "鋼", icon: "/images/types/鋼.png", id: "metal", color: "bg-gray-500" },
  { name: "無色", icon: "/images/types/無色.png", id: "colorless", color: "bg-gray-400" },
  { name: "ドラゴン", icon: "/images/types/%E9%BE%8D.png", id: "dragon", color: "bg-yellow-600" },
]

// Category filter options are now handled by translations

interface RarityOption {
  dbValue: string
  translationKey: string
  iconPath: string
}

const rarityOptionsConfig: RarityOption[] = [
  { dbValue: "all", translationKey: "allRarities", iconPath: "" },
  { dbValue: "ダイヤ1", translationKey: "rarities.diamond1", iconPath: "/images/rarities/diamond_single.png" },
  { dbValue: "ダイヤ2", translationKey: "rarities.diamond2", iconPath: "/images/rarities/diamond_single.png" },
  { dbValue: "ダイヤ3", translationKey: "rarities.diamond3", iconPath: "/images/rarities/diamond_single.png" },
  { dbValue: "ダイヤ4", translationKey: "rarities.diamond4", iconPath: "/images/rarities/diamond_single.png" },
  { dbValue: "星1", translationKey: "rarities.star1", iconPath: "/images/rarities/star_single.png" },
  { dbValue: "星2", translationKey: "rarities.star2", iconPath: "/images/rarities/star_single.png" },
  { dbValue: "星3", translationKey: "rarities.star3", iconPath: "/images/rarities/star_single.png" },
  { dbValue: "クラウン", translationKey: "rarities.crown", iconPath: "/images/rarities/crown.png" },
  { dbValue: "色1", translationKey: "rarities.color1", iconPath: "/images/rarities/color2.png" },
  { dbValue: "色2", translationKey: "rarities.color2", iconPath: "/images/rarities/color2.png" },
]

const allowedRarityDbValues = rarityOptionsConfig.filter((opt) => opt.dbValue !== "all").map((opt) => opt.dbValue)

export default function CreateDeckPage() {
  const t = useTranslations("deckCreate")
  const params = useParams()
  const locale = useLocale()
  
  const [deckName, setDeckName] = useState("")
  const [deckDescription, setDeckDescription] = useState("")
  const [selectedEnergyTypes, setSelectedEnergyTypes] = useState<string[]>([])
  const [deckCards, setDeckCards] = useState<DeckCard[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [thumbnailCard, setThumbnailCard] = useState<DeckCard | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isDeckInfoExpanded, setIsDeckInfoExpanded] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchCategory, setSearchCategory] = useState("")  // Will be set to t("all") after mount
  const [searchedCards, setSearchedCards] = useState<CardType[]>([])
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [selectedRarity, setSelectedRarity] = useState("all")
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [packOptions, setPackOptions] = useState<{ id: string | null; name: string }[]>([])
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const totalCardsInDeck = useMemo(() => deckCards.reduce((sum, card) => sum + card.quantity, 0), [deckCards])
  const maxDeckSize = 20
  const displaySlotsCount = 20
  
  const cardCategoriesForFilter = useMemo(() => [
    t("all"),
    t("pokemon"),
    t("trainers"),
    t("goods"),
    t("tools")
  ], [t])

  useEffect(() => {
    setSearchCategory(t("all"))
  }, [t])

  useEffect(() => {
    async function fetchPacks() {
      const { data, error } = await supabase.from("packs").select("id, name").order("name", { ascending: true })
      if (error) {
        console.error("Error fetching packs:", error)
        toast({
          title: t("errors.packLoadError"),
          description: t("errors.packLoadFailed"),
          variant: "destructive",
        })
      } else if (data) {
        setPackOptions([{ id: null, name: t("allPacks") }, ...data.map((p) => ({ id: String(p.id), name: p.name }))])
      }
    }
    fetchPacks()
  }, [toast, t])

  useEffect(() => {
    async function fetchCards() {
      setIsLoadingSearch(true)
      let query = supabase
        .from("cards")
        .select("id, name, name_multilingual, image_url, image_url_multilingual, type_code, rarity_code, category, thumb_url, pack_id")
        .eq("is_visible", true)
      if (searchKeyword.trim()) query = query.ilike("name", `%${searchKeyword.trim()}%`)
      if (searchCategory !== t("all")) {
        let dbCategory: string | undefined
        if (searchCategory === t("pokemon")) dbCategory = "pokemon"
        else if (searchCategory === t("trainers")) dbCategory = "trainers"
        else if (searchCategory === t("goods")) dbCategory = "goods"
        else if (searchCategory === t("tools")) dbCategory = "tools"
        if (dbCategory) query = query.eq("category", dbCategory)
      }
      if (selectedRarity !== "all") query = query.eq("rarity_code", selectedRarity)
      if (selectedPackId !== null) query = query.eq("pack_id", selectedPackId)
      query = query.order("pack_id", { ascending: false }).order("id", { ascending: true })
      const { data, error } = await query
      if (error) {
        console.error("Error fetching cards for search:", error)
        toast({
          title: t("errors.cardLoadError"),
          description: t("errors.cardLoadFailed"),
          variant: "destructive",
        })
        setSearchedCards([])
      } else if (data) {
        const mappedData: CardType[] = data.map((dbCard) => ({
          id: String(dbCard.id),
          name: getLocalizedCardName(dbCard, locale),
          imageUrl: getLocalizedCardImage(dbCard, locale),
          type: dbCard.type_code,
          rarity: dbCard.rarity_code,
          category: String(dbCard.category),
          pack_id: String(dbCard.pack_id),
        }))
        setSearchedCards(mappedData)
      }
      setIsLoadingSearch(false)
    }
    const debounceFetch = setTimeout(() => {
      fetchCards()
    }, 300)
    return () => clearTimeout(debounceFetch)
  }, [searchKeyword, searchCategory, selectedRarity, selectedPackId, toast, locale, t])

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoadingAuth(false)
    }
    getUser()
  }, [])

  const toggleEnergyType = (typeId: string) =>
    setSelectedEnergyTypes((prev) => (prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]))

  const addCardToDeck = useCallback(
    (cardToAdd: CardType) => {
      if (totalCardsInDeck >= maxDeckSize) {
        toast({
          title: t("errors.deckSizeLimitTitle"),
          description: t("errors.deckSizeLimitDesc", { max: maxDeckSize }),
          variant: "destructive",
        })
        return
      }
      setDeckCards((prevDeckCards) => {
        const existingCard = prevDeckCards.find((c) => c.id === cardToAdd.id)
        if (existingCard) {
          if (existingCard.quantity >= 2) return prevDeckCards.filter((c) => c.id !== cardToAdd.id)
          else return prevDeckCards.map((c) => (c.id === cardToAdd.id ? { ...c, quantity: c.quantity + 1 } : c))
        } else {
          return [...prevDeckCards, { ...cardToAdd, quantity: 1 }]
        }
      })
    },
    [totalCardsInDeck, toast, t],
  )

  const handleRemoveCard = useCallback((cardId: string) => {
    setDeckCards((prev) => prev.filter((card) => card.id !== cardId))
    setThumbnailCard((prev) => (prev?.id === cardId ? null : prev))
  }, [])

  const handleClearAllCards = () => {
    setDeckCards([])
    setThumbnailCard(null)
  }

  const handleDeckSlotClick = (card: DeckCard) => {
    setThumbnailCard(card)
    toast({ title: t("success.thumbnailSetTitle"), description: t("success.thumbnailSet", { name: card.name }) })
  }

  const canSave = useMemo(
    () => !isLoadingAuth && !isSaving && deckName.trim() && deckCards.length > 0 && totalCardsInDeck === 20,
    [isLoadingAuth, isSaving, deckName, deckCards.length, totalCardsInDeck],
  )

  const handleSaveClick = () => {
    if (totalCardsInDeck !== 20) {
      toast({
        title: t("errors.deckSizeErrorTitle"),
        description: t("errors.deckSizeErrorDesc", { count: totalCardsInDeck }),
        variant: "destructive",
      })
      return
    }
    if (!deckName.trim()) {
      toast({ title: t("errors.inputErrorTitle"), description: t("errors.deckNameRequired"), variant: "destructive" })
      return
    }
    if (deckCards.length === 0) {
      toast({ title: t("errors.inputErrorTitle"), description: t("errors.deckCardsRequired"), variant: "destructive" })
      return
    }
    if (!user) setShowLoginPrompt(true)
    else handleSave()
  }

  const handleContinueAsGuest = () => {
    setShowLoginPrompt(false)
    handleSave()
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const deckInput: CreateDeckInput = {
        title: deckName.trim(),
        user_id: user?.id || null,
        guestName: !user ? t("guest") : undefined,
        description: deckDescription.trim() || undefined,
        is_public: isPublic,
        tags: selectedEnergyTypes.length > 0 ? selectedEnergyTypes : undefined,
        deck_cards: deckCards.map((card) => ({
          card_id: Number.parseInt(card.id),
          quantity: card.quantity,
          name: card.name,
          image_url: card.imageUrl,
        })),
        thumbnail_card_id: thumbnailCard ? Number.parseInt(thumbnailCard.id) : undefined,
        is_authenticated: !!user,
      }
      const result = await createDeck(deckInput)
      if (result.success) {
        gtagEvent("deck_created", {
          category: "engagement",
          deck_name: deckName.trim(),
          card_count: deckCards.reduce((sum, card) => sum + card.quantity, 0),
          is_authenticated: !!user,
          is_public: isPublic,
        })

        toast({ title: t("success.deckSaveSuccess"), description: t("success.deckSaved", { name: deckName }) })
        setDeckName("")
        setDeckDescription("")
        setSelectedEnergyTypes([])
        setDeckCards([])
        setThumbnailCard(null)
        setIsPublic(true)
        window.location.href = `/${locale}/decks`
      } else {
        throw new Error(result.error || t("errors.saveFailed"))
      }
    } catch (error) {
      console.error("デッキ保存中にエラーが発生しました:", error)
      toast({
        title: t("errors.saveError"),
        description: error instanceof Error ? error.message : t("errors.saveFailed"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderDeckSlots = () => {
    const slots: (DeckCard | null)[] = []
    deckCards.forEach((card) => {
      for (let i = 0; i < card.quantity; i++) {
        if (slots.length < displaySlotsCount) slots.push(card)
      }
    })
    while (slots.length < displaySlotsCount) slots.push(null)
    return (
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {slots.map((cardOrNull, index) => (
          <div
            key={index}
            className={cn(
              "aspect-[5/7] flex items-center justify-center rounded border overflow-hidden cursor-pointer transition-all",
              cardOrNull
                ? "border-purple-300 bg-slate-100 hover:border-purple-500"
                : "bg-gray-100 border-gray-300 text-gray-500 text-xs",
              cardOrNull && thumbnailCard?.id === cardOrNull.id && "ring-2 ring-yellow-400 border-yellow-400",
            )}
            onClick={() => cardOrNull && handleDeckSlotClick(cardOrNull)}
          >
            {cardOrNull ? (
              <Image
                src={
                  cardOrNull.imageUrl ||
                  `/placeholder.svg?width=50&height=70&query=${encodeURIComponent(cardOrNull.name) || "/placeholder.svg"}`
                }
                alt={cardOrNull.name}
                width={50}
                height={70}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderThumbnailSelection = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">{t("thumbnailImage")}</label>
        <p className="text-xs text-slate-500 mb-3">
          {t("thumbnailDescription")}
        </p>
        <div className="flex justify-center">
          <div className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
            {thumbnailCard ? (
              <div className="relative w-full h-full">
                <Image
                  src={
                    thumbnailCard.imageUrl ||
                    `/placeholder.svg?width=96&height=128&query=${encodeURIComponent(thumbnailCard.name) || "/placeholder.svg"}`
                  }
                  alt={thumbnailCard.name}
                  fill
                  className="object-contain rounded-md"
                />
                <button
                  onClick={() => setThumbnailCard(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{t("notSelected")}</p>
              </div>
            )}
          </div>
        </div>
        {thumbnailCard && <p className="text-center text-sm font-medium text-slate-700 mt-2">{thumbnailCard.name}</p>}
      </div>
    </div>
  )

  const renderDeckInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t("deckName")} <span className="text-red-500">*</span>
        </label>
        <Input
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder={t("deckNamePlaceholder")}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t("deckDescription")}</label>
        <Textarea
          value={deckDescription}
          onChange={(e) => setDeckDescription(e.target.value)}
          placeholder={t("deckDescriptionPlaceholder")}
          rows={4}
          className="w-full"
        />
      </div>
      {!user && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">{t("guestPostNotice")}</p>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">{t("mainEnergyType")}</label>
        <div className="flex flex-wrap gap-2">
          {energyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleEnergyType(type.id)}
              className={cn(
                "p-1 rounded-full border-2 transition-all",
                selectedEnergyTypes.includes(type.id)
                  ? "border-purple-500 ring-2 ring-purple-200"
                  : "border-gray-300 hover:border-gray-400",
              )}
            >
              <Image
                src={type.icon || "/placeholder.svg"}
                alt={type.name}
                width={20}
                height={20}
                className="w-5 h-5"
                unoptimized
              />
            </button>
          ))}
        </div>
      </div>
      {renderThumbnailSelection()}
    </div>
  )

  const renderDeckComposition = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          {t("deckComposition", { current: totalCardsInDeck, max: maxDeckSize })}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllCards}
            className="text-red-600 hover:text-red-700"
            disabled={deckCards.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("removeAll")}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">{t("public")}</span>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isPublic ? "bg-purple-600" : "bg-gray-300",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  isPublic ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-2">{t("clickToSetThumbnail")}</p>
      {renderDeckSlots()}
    </div>
  )

  const renderCardSearchSection = () => (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder={t("cardSearchPlaceholder")}
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        className="w-full"
      />
      <div className="flex flex-wrap gap-2">
        {cardCategoriesForFilter.map((category) => (
          <Button
            key={category}
            variant={searchCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchCategory(category)}
            className={cn(
              searchCategory === category && "bg-purple-600 hover:bg-purple-700 text-white",
              "text-xs px-3 py-1 h-auto",
            )}
          >
            {category}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {rarityOptionsConfig.map((option) => (
          <Button
            key={option.dbValue}
            variant={selectedRarity === option.dbValue ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRarity(option.dbValue)}
            className={cn(
              selectedRarity === option.dbValue && "bg-purple-600 hover:bg-purple-700 text-white",
              "text-xs px-3 py-1 h-auto flex items-center gap-1",
            )}
          >
            {option.iconPath && (
              <Image
                src={option.iconPath || "/placeholder.svg"}
                alt={t(option.translationKey)}
                width={option.dbValue.includes("ダイヤ") || option.dbValue.includes("星") ? 16 : 20}
                height={option.dbValue.includes("ダイヤ") || option.dbValue.includes("星") ? 16 : 20}
                className="object-contain"
              />
            )}
            {t(option.translationKey)}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {packOptions.map((pack) => (
          <Button
            key={pack.id || "all"}
            variant={selectedPackId === pack.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPackId(pack.id)}
            className={cn(
              selectedPackId === pack.id && "bg-purple-600 hover:bg-purple-700 text-white",
              "text-xs px-3 py-1 h-auto",
            )}
          >
            {pack.name}
          </Button>
        ))}
      </div>
      {isLoadingSearch && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      )}
      {!isLoadingSearch && searchedCards.length === 0 && (
        <p className="text-center text-slate-500 py-10">{t("noCardsFound")}</p>
      )}
      {!isLoadingSearch && searchedCards.length > 0 && (
        <ScrollArea className="h-[400px] sm:h-[500px] border rounded-md p-2 bg-slate-50">
          <div className="grid grid-cols-5 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {searchedCards.map((card) => {
              const cardInDeck = deckCards.find((c) => c.id === card.id)
              const quantity = cardInDeck?.quantity || 0
              return (
                <button
                  key={card.id}
                  onClick={() => addCardToDeck(card)}
                  className={cn(
                    "aspect-[5/7] relative rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all cursor-pointer group",
                    quantity > 0 ? "border-purple-400" : "border-transparent hover:border-purple-300",
                  )}
                  aria-label={`Add card ${card.name}`}
                >
                  <Image
                    src={
                      card.imageUrl || `/placeholder.svg?width=100&height=140&query=${encodeURIComponent(card.name)}`
                    }
                    alt={card.name}
                    fill
                    sizes="(max-width: 400px) 30vw, (max-width: 640px) 22vw, (max-width: 768px) 18vw, (max-width: 1024px) 15vw, 12vw"
                    className="object-cover bg-slate-100"
                  />
                  {quantity > 0 && (
                    <div className="absolute inset-0 bg-purple-700/60 group-hover:bg-purple-700/80 flex items-center justify-center">
                      <Check className="h-6 w-6 sm:h-8 sm:h-8 text-white stroke-[3px]" />
                    </div>
                  )}
                  {quantity > 0 && (
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {quantity}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div
        className="w-full flex-1"
        style={{
          background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)",
        }}
      >
        <div className="hidden lg:block">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <Link href="/decks" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("backToDeckList")}
              </Link>
              <h1 className="text-2xl font-bold text-slate-800">{t("pageTitle")}</h1>
              <Button
                onClick={handleSaveClick}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={!canSave}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("posting")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t("post")}
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <Card className="sticky top-[calc(var(--header-height,64px)+1.5rem)]">
                <CardHeader>
                  <CardTitle>{t("cardSearch")}</CardTitle>
                </CardHeader>
                <CardContent>{renderCardSearchSection()}</CardContent>
              </Card>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("deckInfo")}</CardTitle>
                  </CardHeader>
                  <CardContent>{renderDeckInfo()}</CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">{renderDeckComposition()}</CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:hidden">
          <main className="container mx-auto px-4 py-6 space-y-6">
            <Link href="/decks" className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("backToDeckList")}
            </Link>
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setIsDeckInfoExpanded(!isDeckInfoExpanded)}>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("deckInfo")}</CardTitle>
                  {isDeckInfoExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </div>
              </CardHeader>
              {isDeckInfoExpanded && <CardContent>{renderDeckInfo()}</CardContent>}
            </Card>
            <Card>
              <CardContent className="pt-6">{renderDeckComposition()}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("cardSearch")}</CardTitle>
              </CardHeader>
              <CardContent>{renderCardSearchSection()}</CardContent>
            </Card>
            {isLoadingAuth && <p className="text-center text-slate-500">{t("checkingAuth")}</p>}
            <Button
              onClick={handleSaveClick}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 sticky bottom-4 z-10 shadow-lg"
              disabled={!canSave}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("posting")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("post")}
                </>
              )}
            </Button>
          </main>
        </div>
      </div>
      <Footer />
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} onContinueAsGuest={handleContinueAsGuest} />
      )}
    </div>
  )
}
