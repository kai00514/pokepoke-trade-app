"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, ListChecks, BarChartBig, Zap, Star } from "lucide-react"
import Link from "next/link"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import { useAuth } from "@/contexts/auth-context"
import type { Deck } from "@/components/deck-card"
import DeckHorizontalRow from "@/components/deck-horizontal-row"
import { getDecksList, getDeckPagesList } from "@/lib/actions/deck-posts"
import { useToast } from "@/components/ui/use-toast"

type TabId = "posted" | "tier" | "featured" | "newpack"

interface CategoryInfo {
  id: TabId
  title: string
  icon: React.ComponentType<{ className?: string }>
}

const categories: CategoryInfo[] = [
  { id: "tier", title: "Tierデッキ", icon: ListChecks },
  { id: "featured", title: "注目デッキ", icon: BarChartBig },
  { id: "newpack", title: "新パックデッキ", icon: Zap },
  { id: "posted", title: "みんなのデッキを見る", icon: Users },
]

interface DeckPageData extends Deck {
  is_deck_page?: boolean
  deck_cards?: any[]
}

export default function DecksPage() {
  const [selectedCategory, setSelectedCategory] = useState<TabId | null>(null)
  const [decks, setDecks] = useState<DeckPageData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // 投稿デッキ取得
  const fetchPostedDecks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getDecksList({ isPublic: true, limit: 50 })
      if ((result as any).success && (result as any).data) {
        const decksWithFlag = (result as any).data.map((deck: any) => ({
          ...deck,
          is_deck_page: false,
        }))
        setDecks(decksWithFlag)
      } else {
        const msg = (result as any).error || "デッキの取得に失敗しました"
        setError(msg)
        toast({ title: "エラー", description: msg, variant: "destructive" })
      }
    } catch {
      const msg = "デッキの取得中にエラーが発生しました"
      setError(msg)
      toast({ title: "エラー", description: msg, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // deck_pages 取得 (Step 2: データマッピング処理)
  const fetchDeckPages = useCallback(
    async (category: "tier" | "newpack" | "featured") => {
      setIsLoading(true)
      setError(null)
      try {
        let sortBy: "tier" | "popular" | "latest" = "latest"
        if (category === "tier") sortBy = "tier"
        if (category === "featured") sortBy = "popular"
        if (category === "newpack") sortBy = "latest"

        const result = await getDeckPagesList({ category, sortBy, limit: 50 })
        if ((result as any).success && (result as any).data) {
          // Step 2: DeckHorizontalRowが期待する形式に変換
          const formatted: DeckPageData[] = (result as any).data.map((deckPage: any) => ({
            id: deckPage.id.toString(),
            name: deckPage.title || deckPage.deck_name || "無題のデッキ",
            imageUrl: deckPage.thumbnail_image_url || "/placeholder.svg?width=120&height=168",
            cardName: deckPage.deck_name || "カード名不明",
            updatedAt: new Date(deckPage.updated_at).toLocaleDateString("ja-JP"),
            likes: deckPage.like_count || 0,
            favorites: 0,
            views: deckPage.view_count || 0,
            comments: deckPage.comment_count || 0,
            is_deck_page: true,
            // Step 2: カード詳細を含むdeck_cardsを設定
            deck_cards: deckPage.deck_cards || [],
          }))
          setDecks(formatted)
        } else {
          const msg = (result as any).error || "デッキの取得に失敗しました"
          setError(msg)
          toast({ title: "エラー", description: msg, variant: "destructive" })
        }
      } catch (fetchError) {
        // Step 3: エラーハンドリング
        console.error("Error fetching deck pages:", fetchError)
        const msg = "デッキの取得中にエラーが発生しました"
        setError(msg)
        toast({ title: "エラー", description: msg, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    fetchPostedDecks()
    setSelectedCategory("posted")
  }, [fetchPostedDecks])

  const handleCategoryClick = (categoryId: TabId) => {
    setSelectedCategory(categoryId)
    if (categoryId === "posted") fetchPostedDecks()
    else if (categoryId === "tier") fetchDeckPages("tier")
    else if (categoryId === "featured") fetchDeckPages("featured")
    else if (categoryId === "newpack") fetchDeckPages("newpack")
  }

  const handleFavoritesClick = () => {
    if (!user) {
      setShowLoginPrompt(true)
    } else {
      // お気に入りページに遷移
      window.location.href = "/favorites"
    }
  }

  const renderDeckList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">デッキを読み込み中...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => handleCategoryClick(selectedCategory || "posted")} variant="outline">
            再試行
          </Button>
        </div>
      )
    }

    if (decks.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="mb-6">
            <PlusCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">まだデッキが投稿されていません</h3>
            <p className="text-slate-500 mb-6">最初のデッキを投稿してみませんか？</p>
          </div>
          <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Link href="/decks/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              デッキを投稿する
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {decks.map((deck) => (
          <DeckHorizontalRow key={deck.id} deck={deck} currentCategory={selectedCategory || "posted"} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div
        className="w-full flex-1"
        style={{ background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)" }}
      >
        <main className="flex-grow container mx-auto px-4 pb-8">
          {/* 上部ボタン */}
          <div className="my-4 flex justify-center items-center gap-3 max-w-lg mx-auto">
            <Button
              asChild
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 border-0"
            >
              <Link href="/decks/create">
                <PlusCircle className="mr-1.5 h-4 w-4" />
                デッキを投稿
              </Link>
            </Button>

            <Button
              onClick={handleFavoritesClick}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 border-0"
            >
              <Star className="mr-1.5 h-4 w-4" />
              お気に入り
            </Button>
          </div>

          {/* カテゴリ */}
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
            {categories.map((category) => {
              const IconComponent = category.icon
              const isActive = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`group rounded-xl p-4 shadow-lg transition-all duration-300 transform hover:-translate-y-1 border ${
                    isActive
                      ? "bg-blue-100 border-blue-300 shadow-xl"
                      : "bg-white border-blue-100 hover:border-blue-200 hover:shadow-xl"
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`p-3 rounded-full transition-colors duration-300 ${
                        isActive ? "bg-blue-200" : "bg-blue-100 group-hover:bg-blue-200"
                      }`}
                    >
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${isActive ? "text-blue-800" : "text-slate-800"}`}>
                        {category.title}
                      </h3>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* リスト（各デッキ1行、20枚横スクロール） */}
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <h2 className="text-2xl font-bold text-slate-800">
                {categories.find((cat) => cat.id === selectedCategory)?.title || "みんなのデッキ"}
              </h2>
            </div>
            {renderDeckList()}
          </div>
        </main>
      </div>
      <Footer />
      {showLoginPrompt && <LoginPromptModal onClose={() => setShowLoginPrompt(false)} showGuestButton={false} />}
    </div>
  )
}
