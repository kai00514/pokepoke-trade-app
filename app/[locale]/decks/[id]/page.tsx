"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useRouter } from "@/lib/i18n-navigation"
import Image from "next/image"
import { Heart, StarIcon, ArrowLeft, User, Calendar, MessageCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTranslations } from "next-intl"
import { getDeckById, likeDeck, unlikeDeck, favoriteDeck, unfavoriteDeck } from "@/lib/services/deck-service"
import { fetchCardDetailsByIds } from "@/lib/card-api"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import CardDisplay from "@/components/card-display"
import Header from "@/components/layout/header"
import { FooterNavigation } from "@/components/layout/footer-navigation"
import { ThemeProvider } from "@/components/theme-provider"
import type { DeckWithCards } from "@/types/deck-types"
import type { CardData } from "@/lib/card-utils"
import { AuthProvider } from "@/contexts/auth-context"
import DeckComments from "@/components/DeckComments"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import { event as gtagEvent } from "@/lib/analytics/gtag"

export default function DeckDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const t = useTranslations("decks")
  const tComments = useTranslations("comments")
  const tCards = useTranslations("cards")
  const [deck, setDeck] = useState<DeckWithCards | null>(null)
  const [cardDetails, setCardDetails] = useState<Record<string, CardData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { toast } = useToast()

  const energyTypes = [
    { name: "草", icon: "/images/types/草.png", id: "grass", color: "bg-green-500" },
    { name: "炎", icon: "/images/types/炎.png", id: "fire", color: "bg-red-500" },
    { name: "水", icon: "/images/types/水.png", id: "water", color: "bg-blue-500" },
    { name: "電気", icon: "/images/types/電気.png", id: "electric", color: "bg-yellow-500" },
    { name: "エスパー", icon: "/images/types/念.png", id: "psychic", color: "bg-purple-500" },
    { name: "格闘", icon: "/images/types/格闘.png", id: "fighting", color: "bg-orange-500" },
    { name: tCards('types.dark'), icon: "/images/types/悪.png", id: "dark", color: "bg-gray-800" },
    { name: tCards('types.steel'), icon: "/images/types/鋼.png", id: "metal", color: "bg-gray-500" },
    { name: "無色", icon: "/images/types/無色.png", id: "colorless", color: "bg-gray-400" },
    { name: "ドラゴン", icon: "/images/types/龍.png", id: "dragon", color: "bg-yellow-600" },
  ]

  useEffect(() => {
    if (id === "create") {
      router.replace("/decks/create")
    }
  }, [id, router])

  const groupCardsByType = (cards: CardData[]): Record<string, CardData[]> => {
    return cards.reduce(
      (acc, card) => {
        const type = card.type_code || "unknown"
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(card)
        return acc
      },
      {} as Record<string, CardData[]>,
    )
  }

  const fetchDeckData = async () => {
    if (id === "create") {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await getDeckById(id)
      if (error || !data) {
        setError(error || t("fetchError"))
        return
      }

      setDeck(data)
      setLikeCount(data.like_count || 0)
      setFavoriteCount(data.favorite_count || 0)
      setCommentCount(data.comment_count || 0)

      gtagEvent("deck_viewed", {
        category: "engagement",
        deck_id: id,
        deck_title: data.title,
        deck_type: "user_created",
      })

      if (data.deck_cards && data.deck_cards.length > 0) {
        const cardIds = data.deck_cards.map((dc) => String(dc.card_id))
        const details = await fetchCardDetailsByIds(cardIds)
        const detailsMap = details.reduce(
          (acc, card) => {
            acc[String(card.id)] = card
            return acc
          },
          {} as Record<string, CardData>,
        )
        setCardDetails(detailsMap)
      }
    } catch (err) {
      setError(t("fetchErrorOccurred"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && id !== "create") {
      fetchDeckData()
    }
  }, [id, authLoading])

  const handleLike = async () => {
    if (isLikeLoading) return
    setIsLikeLoading(true)
    const originalIsLiked = isLiked
    const originalLikeCount = likeCount

    setIsLiked(!isLiked)
    setLikeCount((prev) => (originalIsLiked ? prev - 1 : prev + 1))

    try {
      const action = originalIsLiked ? unlikeDeck : likeDeck
      const { error } = await action(id)
      if (error) {
        toast({ title: t("error"), description: error, variant: "destructive" })
        setIsLiked(originalIsLiked)
        setLikeCount(originalLikeCount)
      } else {
        setTimeout(async () => {
          const { data: updatedDeck } = await getDeckById(id)
          if (updatedDeck) {
            setLikeCount(updatedDeck.like_count || 0)
          }
        }, 100)
      }
    } catch {
      toast({ title: t("error"), description: t("fetchErrorOccurred"), variant: "destructive" })
      setIsLiked(originalIsLiked)
      setLikeCount(originalLikeCount)
    } finally {
      setIsLikeLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    if (isFavoriteLoading) return

    setIsFavoriteLoading(true)
    const originalIsFavorited = isFavorited
    const originalFavoriteCount = favoriteCount

    setIsFavorited(!isFavorited)
    setFavoriteCount((prev) => (originalIsFavorited ? prev - 1 : prev + 1))

    try {
      const action = originalIsFavorited ? unfavoriteDeck : favoriteDeck
      const { error } = await action(id)

      if (error) {
        toast({ title: t("error"), description: error, variant: "destructive" })
        setIsFavorited(originalIsFavorited)
        setFavoriteCount(originalFavoriteCount)
      } else {
        setTimeout(async () => {
          const { data: updatedDeck } = await getDeckById(id)
          if (updatedDeck) {
            setFavoriteCount(updatedDeck.favorite_count || 0)
          }
        }, 100)
      }
    } catch {
      toast({ title: t("error"), description: t("fetchErrorOccurred"), variant: "destructive" })
      setIsFavorited(originalIsFavorited)
      setFavoriteCount(originalFavoriteCount)
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  if (id === "create") {
    return null
  }

  if (isLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">{t("loadingDeck")}</p>
                </div>
              </div>
            </main>
            <FooterNavigation />
          </div>
        </AuthProvider>
      </ThemeProvider>
    )
  }

  if (error || !deck) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
                    <p>{error || t("deckNotFound")}</p>
                  </div>
                  <Button onClick={() => router.back()} variant="outline" className="mr-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("back")}
                  </Button>
                  <Button onClick={() => router.push("/decks")}>{t("deckList")}</Button>
                </div>
              </div>
            </main>
            <FooterNavigation />
          </div>
        </AuthProvider>
      </ThemeProvider>
    )
  }

  const cardsWithDetails = deck.deck_cards.flatMap((dc) => {
    const cardDetail = cardDetails[String(dc.card_id)]
    if (!cardDetail?.id) return []
    return Array.from({ length: dc.quantity }, (_, index) => ({
      ...cardDetail,
      quantity: dc.quantity,
      card_id: dc.card_id,
      uniqueKey: `${dc.card_id}-${index}`,
    }))
  })

  const cardsByType = groupCardsByType(cardsWithDetails)

  const renderCardGrid = (cardsToRender: (CardData & { uniqueKey: string })[]) => {
    const midPoint = Math.ceil(cardsToRender.length / 2)
    const row1Cards = cardsToRender.slice(0, midPoint)
    const row2Cards = cardsToRender.slice(midPoint)

    const renderCardItem = (card: CardData & { uniqueKey: string }) => (
      <div key={card.uniqueKey} className="w-[80px] sm:w-[90px] md:w-[100px] flex flex-col items-center flex-shrink-0">
        <div className="w-full aspect-[5/7] bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-sm mb-1.5">
          <CardDisplay cardId={card.card_id} useThumb={false} fill objectFit="contain" />
        </div>
        <p className="text-xs font-medium text-center truncate w-full text-gray-700">{card.name}</p>
      </div>
    )

    return (
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-y-4" style={{ minWidth: "max-content" }}>
          <div className="flex gap-x-3">{row1Cards.map(renderCardItem)}</div>
          {row2Cards.length > 0 && <div className="flex gap-x-3">{row2Cards.map(renderCardItem)}</div>}
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
          <Header />
          <main className="container mx-auto px-4 py-6 pb-24">
            <div className="mb-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("back")}
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{deck.title}</h1>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>{deck.user_display_name || tComments('anonymousUser')}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{t("createdDate")}: {new Date(deck.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {deck.description && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{deck.description}</p>}
                </div>

                <div className="flex items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleLike}
                          disabled={isLikeLoading}
                          className={`flex flex-col items-center p-2 rounded-full hover:bg-gray-100 transition-colors ${
                            isLiked ? "text-red-500" : "text-gray-500"
                          } ${isLikeLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          aria-label={isLiked ? t("unlike") : t("like")}
                        >
                          {isLikeLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <Heart className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} />
                          )}
                          <span className="text-xs mt-1">{likeCount}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isLiked ? t("unlike") : t("like")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleFavorite}
                          disabled={isFavoriteLoading}
                          className={`flex flex-col items-center p-2 rounded-full hover:bg-gray-100 transition-colors ${
                            isFavorited ? "text-yellow-500" : "text-gray-500"
                          } ${isFavoriteLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
                        >
                          {isFavoriteLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <StarIcon className="h-6 w-6" fill={isFavorited ? "currentColor" : "none"} />
                          )}
                          <span className="text-xs mt-1">{favoriteCount}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isFavorited ? t("removeFromFavorites") : t("addToFavorites")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex flex-col items-center p-2 text-gray-500">
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-xs mt-1">{commentCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("deckContent")}</h2>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">{t("allCards")}</TabsTrigger>
                  {deck.tags &&
                    deck.tags.length > 0 &&
                    deck.tags.map((tagId) => {
                      const energyType = energyTypes.find((et) => et.id === tagId)
                      if (!energyType) return null

                      return (
                        <TabsTrigger key={energyType.id} value={energyType.name}>
                          <Image
                            src={energyType.icon || "/placeholder.svg"}
                            alt={energyType.name}
                            width={24}
                            height={24}
                            className="inline-block mr-1"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?width=24&height=24"
                              e.currentTarget.alt = t("unknownType")
                            }}
                          />
                          <span className="sr-only">{energyType.name}</span>
                        </TabsTrigger>
                      )
                    })}
                </TabsList>
                <TabsContent value="all">{renderCardGrid(cardsWithDetails)}</TabsContent>
                {deck.tags &&
                  deck.tags.length > 0 &&
                  deck.tags.map((tagId) => {
                    const energyType = energyTypes.find((et) => et.id === tagId)
                    if (!energyType) return null

                    return (
                      <TabsContent key={energyType.id} value={energyType.name}>
                        {renderCardGrid(cardsByType[energyType.name] || [])}
                      </TabsContent>
                    )
                  })}
              </Tabs>
            </div>

            <div className="mt-6">
              <DeckComments deckId={id} deckTitle={deck.title} commentType="deck" />
            </div>
          </main>
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <FooterNavigation />
          </div>
        </div>

        {showLoginPrompt && (
          <LoginPromptModal
            onClose={() => setShowLoginPrompt(false)}
            onContinueAsGuest={() => {
              setShowLoginPrompt(false)
              router.push("/decks")
            }}
          />
        )}
      </AuthProvider>
    </ThemeProvider>
  )
}
