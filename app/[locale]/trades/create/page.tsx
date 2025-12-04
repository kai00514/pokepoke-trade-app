"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Link } from "@/lib/i18n-navigation"
import Image from "next/image"
import { useRouter } from "@/lib/i18n-navigation"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, ArrowLeft, Trash2, Loader2, Clock, AlertTriangle } from "lucide-react"
import DetailedSearchModal from "@/components/detailed-search-modal"
import ListSelectorModal from "@/components/trade-owned-lists/list-selector-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import { useToast } from "@/components/ui/use-toast"
import { createTradePost } from "@/lib/actions/trade-actions"
import { supabase } from "@/lib/supabase/client"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import { checkTimeSync, formatTimeSkew, type TimeSync } from "@/lib/utils/time-sync"
import { event as gtagEvent } from "@/lib/analytics/gtag"
import { useTranslations } from "next-intl"

type SelectionContextType = "wanted" | "offered" | null

export default function CreateTradePage() {
  const t = useTranslations()
  const [tradeTitle, setTradeTitle] = useState("")
  const [wantedCards, setWantedCards] = useState<SelectedCardType[]>([])
  const [offeredCards, setOfferedCards] = useState<SelectedCardType[]>([])
  const [appId, setAppId] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [timeSync, setTimeSync] = useState<TimeSync | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSelectionContext, setModalSelectionContext] = useState<SelectionContextType>(null)
  const [modalMaxSelection, setModalMaxSelection] = useState<number | undefined>(undefined)
  const [currentModalTitle, setCurrentModalTitle] = useState(t('trades.selectCard'))
  const [modalInitialCards, setModalInitialCards] = useState<SelectedCardType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showListSelector, setShowListSelector] = useState(false)
  const [hasRegisteredPokepokeId, setHasRegisteredPokepokeId] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkTime = async () => {
      try {
        const syncResult = await checkTimeSync()
        setTimeSync(syncResult)
        if (syncResult.isSkewed)
          console.warn("⏰ Time sync issue detected:", {
            deviceTime: new Date(syncResult.deviceTime).toISOString(),
            serverTime: new Date(syncResult.serverTime).toISOString(),
            skew: formatTimeSkew(syncResult.skew),
          })
      } catch (error) {
        console.error("Time sync check failed:", error)
      }
    }
    checkTime()
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const { data } = await supabase.auth.getSession()
        const isAuth = !!data.session
        const userId = data.session?.user?.id || null
        setIsAuthenticated(isAuth)
        setCurrentUserId(userId)

        if (isAuth && userId) {
          // ユーザープロファイルからポケポケIDを取得
          const { data: profile } = await supabase.from("users").select("pokepoke_id").eq("id", userId).single()

          if (profile?.pokepoke_id) {
            setAppId(profile.pokepoke_id)
            setHasRegisteredPokepokeId(true)
          } else {
            setHasRegisteredPokepokeId(false)
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsAuthenticated(false)
        setCurrentUserId(null)
        setHasRegisteredPokepokeId(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isAuth = !!session
      const userId = session?.user?.id || null
      setIsAuthenticated(isAuth)
      setCurrentUserId(userId)

      if (isAuth && userId) {
        // ユーザープロファイルからポケポケIDを取得
        const { data: profile } = await supabase.from("users").select("pokepoke_id").eq("id", userId).single()

        if (profile?.pokepoke_id) {
          setAppId(profile.pokepoke_id)
          setHasRegisteredPokepokeId(true)
        } else {
          setHasRegisteredPokepokeId(false)
        }
      } else {
        setHasRegisteredPokepokeId(false)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const validateForm = () => {
    const errors: { [key: string]: string } = {}
    if (!tradeTitle.trim()) errors.title = t('errors.validation.tradeTitleRequired')
    if (wantedCards.length === 0) errors.wantedCards = t('errors.validation.wantedCardsRequired')
    if (offeredCards.length === 0) errors.offeredCards = t('errors.validation.offeredCardsRequired')
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAppIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // 半角数字のみを許可
    const numericValue = value.replace(/[^0-9]/g, "")
    setAppId(numericValue)
  }

  const openModal = (context: SelectionContextType, maxSelection: number | undefined, title: string) => {
    const currentCards = context === "wanted" ? wantedCards : offeredCards
    setModalSelectionContext(context)
    setModalMaxSelection(maxSelection)
    setCurrentModalTitle(title)
    setModalInitialCards([...currentCards])
    setIsModalOpen(true)
  }

  const handleModalSelectionComplete = (selected: SelectedCardType[]) => {
    if (modalSelectionContext === "wanted") {
      setWantedCards([...selected])
      if (formErrors.wantedCards) setFormErrors((prev) => ({ ...prev, wantedCards: "" }))
    } else if (modalSelectionContext === "offered") {
      setOfferedCards([...selected])
      if (formErrors.offeredCards) setFormErrors((prev) => ({ ...prev, offeredCards: "" }))
    }
    setIsModalOpen(false)
    setModalSelectionContext(null)
    setModalInitialCards([])
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setModalSelectionContext(null)
    setModalInitialCards([])
  }

  const removeCard = (cardId: string, context: "wanted" | "offered") => {
    if (context === "wanted") setWantedCards((prev) => prev.filter((card) => card.id !== cardId))
    else setOfferedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleRefreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Failed to refresh session:", error)
        toast({
          title: t('errors.auth.sessionRefreshError'),
          description: t('errors.auth.sessionRefreshFailed'),
          variant: "destructive",
        })
      } else {
        toast({ title: t('messages.success.sessionRefreshed'), description: t('messages.success.sessionUpdated') })
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
    }
  }

  const handleSubmitClick = () => {
    if (!validateForm()) {
      toast({ title: t('errors.validation.inputError'), description: t('errors.validation.requiredFields'), variant: "destructive" })
      return
    }
    if (timeSync?.isSkewed)
      toast({
        title: t('errors.system.timeSyncIssue'),
        description: t('errors.system.timeSyncWarning', { skew: formatTimeSkew(timeSync.skew) }),
        variant: "destructive",
      })
    if (!isAuthenticated) setShowLoginPrompt(true)
    else handleSubmit()
  }

  const handleContinueAsGuest = () => {
    setShowLoginPrompt(false)
    handleSubmit()
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      const result = await createTradePost({
        title: tradeTitle,
        wantedCards,
        offeredCards,
        appId: appId.trim() || undefined,
        comment: comment.trim() || undefined,
        userId: isAuthenticated ? currentUserId : undefined,
      })
      if (result.success) {
        gtagEvent("trade_post_created", {
          category: "engagement",
          label: "trade_post",
          is_authenticated: result.isAuthenticated,
          wanted_cards_count: wantedCards.length,
          offered_cards_count: offeredCards.length,
        })

        // タイムラインのキャッシュをクリア
        sessionStorage.removeItem("trade-posts-cache-page-1")

        toast({ title: t('messages.success.postSuccess'), description: t('messages.success.tradePostCreated') })
        if (result.postId) router.push(`/trades/${result.postId}`)
        else router.push("/")
      } else {
        toast({
          title: t('errors.post.postError'),
          description: result.error || t('errors.post.postCreationFailed'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting trade post:", error)
      toast({ title: t('errors.generic.error'), description: t('errors.generic.unexpectedError'), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSelectedCards = (cards: SelectedCardType[], context: "wanted" | "offered") => {
    if (cards.length === 0) {
      return (
        <div>
          <p className="text-sm text-slate-500 mt-2">{t('trades.noCardsSelected')}</p>
          {formErrors[context === "wanted" ? "wantedCards" : "offeredCards"] && (
            <p className="text-sm text-red-500 mt-1">
              {formErrors[context === "wanted" ? "wantedCards" : "offeredCards"]}
            </p>
          )}
        </div>
      )
    }
    return (
      <div className="mt-3 flex flex-wrap gap-0">
        {cards.map((card) => (
          <div key={card.id} className="relative group border rounded-md p-0 bg-slate-50 mx-0">
            <Image
              src={card.imageUrl || "/placeholder.svg"}
              alt={card.name}
              width={80}
              height={112}
              className="rounded object-contain aspect-[5/7] mx-auto"
            />
            <p className="text-xs text-center mt-1 truncate">{card.name}</p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-2 w-2 bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
              onClick={() => removeCard(card.id, context)}
              aria-label={`Remove ${card.name}`}
              disabled={isSubmitting}
            >
              <Trash2 className="h-1 w-1" />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('common.navigation.backToTimeline')}
        </Link>
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">{t('trades.registerTradeCard')}</h1>
          {timeSync?.isSkewed && (
            <Alert className="mb-6 bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertTitle className="text-yellow-700 font-semibold">{t('errors.system.timeSyncIssue')}</AlertTitle>
              <AlertDescription className="text-yellow-600 text-sm">
                {t('errors.system.timeSyncAuthWarning', { skew: formatTimeSkew(timeSync.skew) })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshSession}
                  className="ml-2 text-yellow-700 border-yellow-300 hover:bg-yellow-100 bg-transparent"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  {t('common.buttons.refreshSession')}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <InfoIcon className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-700 font-semibold">{t('common.misc.notice')}</AlertTitle>
            <AlertDescription className="text-blue-600 text-sm">
              {t('trades.postNotice')}
            </AlertDescription>
          </Alert>
          <form className="space-y-6">
            <div>
              <label htmlFor="tradeTitle" className="block text-sm font-medium text-slate-700 mb-1">
                {t('trades.tradeTitle')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="tradeTitle"
                value={tradeTitle}
                onChange={(e) => {
                  setTradeTitle(e.target.value)
                  if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: "" }))
                }}
                placeholder={t('trades.tradeTitlePlaceholder')}
                required
                disabled={isSubmitting}
                className={formErrors.title ? "border-red-500" : ""}
              />
              {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('trades.wantedCards')} <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                onClick={() => openModal("wanted", 20, t('trades.selectWantedCards'))}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {t('common.buttons.selectCards')}
              </Button>
              {renderSelectedCards(wantedCards, "wanted")}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('trades.offeredCards')} <span className="text-red-500">*</span>
              </label>
              {/* リスト選択UI */}
              <div className="mb-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-700">{t('trades.selectFromSavedList')}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowListSelector(true)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    disabled={isSubmitting}
                  >
                    {t('common.buttons.selectFromList')}
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => openModal("offered", 20, t('trades.selectOfferedCards'))}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {t('common.buttons.selectCards')}
              </Button>
              {renderSelectedCards(offeredCards, "offered")}
            </div>
            <div>
              <label htmlFor="appId" className="block text-sm font-medium text-slate-700 mb-1">
                {t('trades.pokepokeAppId')}
              </label>
              <Input
                id="appId"
                value={appId}
                onChange={handleAppIdChange}
                placeholder={t('trades.pokepokeAppIdPlaceholder')}
                disabled={isSubmitting || (isAuthenticated && hasRegisteredPokepokeId)}
                readOnly={isAuthenticated && hasRegisteredPokepokeId}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <p className="text-xs text-slate-500 mt-1">
                {isAuthenticated
                  ? hasRegisteredPokepokeId
                    ? t('trades.registeredIdAutoFilled')
                    : t('trades.loggedInIdOptional')
                  : t('trades.guestIdOptional')}
              </p>
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-1">
                {t('comments.title')} {t('common.labels.optional')}
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('trades.commentPlaceholder')}
                rows={4}
                disabled={isSubmitting}
                maxLength={256}
              />
              <p className="text-xs text-right text-slate-500 mt-1">{comment.length}/256</p>
            </div>
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleSubmitClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.buttons.submitting')}
                  </>
                ) : (
                  t('common.buttons.submit')
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      <DetailedSearchModal
        isOpen={isModalOpen}
        onOpenChange={handleModalClose}
        onSelectionComplete={handleModalSelectionComplete}
        maxSelection={modalMaxSelection}
        initialSelectedCards={modalInitialCards}
        modalTitle={currentModalTitle}
      />
      <ListSelectorModal
        isOpen={showListSelector}
        onOpenChange={(open) => setShowListSelector(open)}
        userId={currentUserId || ""}
        onListSelect={(selectedCards) => {
          // 重複を除去して追加
          const existingIds = new Set(offeredCards.map((card) => card.id))
          const newCards = selectedCards.filter((card) => !existingIds.has(card.id))
          setOfferedCards((prev) => [...prev, ...newCards])
          setShowListSelector(false)
        }}
      />
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} onContinueAsGuest={handleContinueAsGuest} />
      )}
    </div>
  )
}
