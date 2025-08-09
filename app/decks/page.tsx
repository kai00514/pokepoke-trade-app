"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, ListChecks, BarChartBig, Zap, Star } from "lucide-react"
import Link from "next/link"
import type { Deck } from "@/components/deck-card"
import DeckHorizontalRow from "@/components/deck-horizontal-row"
import { getDecksList, getDeckPagesList } from "@/lib/actions/deck-posts"
import { useToast } from "@/components/ui/use-toast"

type TabId = "posted" | "tier" | "featured" | "newpack"

interface CategoryInfo {
  id: TabId
  title: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const categories: CategoryInfo[] = [
  {
    id: "tier",
    title: "Tierランキング",
    icon: ListChecks,
    description: "デッキの強さランキング",
  },
  {
    id: "featured",
    title: "注目ランキング",
    icon: BarChartBig,
    description: "話題のデッキランキング",
  },
  {
    id: "newpack",
    title: "新パックデッキランキング",
    icon: Zap,
    description: "最新パックを使ったデッキ",
  },
  {
    id: "posted",
    title: "みんなのデッキを見る",
    icon: Users,
    description: "投稿されたデッキを閲覧",
  },
]

// deck_pagesデータ用の拡張型
interface DeckPageData extends Deck {
  is_deck_page?: boolean
}

export default function DecksPage() {
  const [selectedCategory, setSelectedCategory] = useState<TabId | null>(null)
  const [decks, setDecks] = useState<DeckPageData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // みんなのデッキを取得
  const fetchPostedDecks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getDecksList({ isPublic: true, limit: 50 })
      if (result.success && result.data) {
        const decksWithFlag = result.data.map((deck) => ({
          ...deck,
          is_deck_page: false,
        }))
        setDecks(decksWithFlag)
      } else {
        setError(result.error || "デッキの取得に失敗しました")
        toast({
          title: "エラー",
          description: result.error || "デッキの取得に失敗しました",
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage = "デッキの取得中にエラーが発生しました"
      setError(errorMessage)
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // deck_pagesテーブルからデッキを取得
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

        if (result.success && result.data) {
          const formattedDecks: DeckPageData[] = result.data.map((deckPage: any) => ({
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
            // Note: deck_pages may not include deck_cards; DeckHorizontalRow will gracefully fallback
          }))
          setDecks(formattedDecks)
        } else {
          setError(result.error || "デッキの取得に失敗しました")
          toast({
            title: "エラー",
            description: result.error || "デッキの取得に失敗しました",
            variant: "destructive",
          })
        }
      } catch (err) {
        const errorMessage = "デッキの取得中にエラーが発生しました"
        setError(errorMessage)
        toast({
          title: "エラー",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  // 初期表示
  useEffect(() => {
    fetchPostedDecks()
    setSelectedCategory("posted")
  }, [fetchPostedDecks])

  const handleCategoryClick = (categoryId: TabId) => {
    setSelectedCategory(categoryId)
    if (categoryId === "posted") {
      fetchPostedDecks()
    } else if (categoryId === "tier") {
      fetchDeckPages("tier")
    } else if (categoryId === "featured") {
      fetchDeckPages("featured")
    } else if (categoryId === "newpack") {
      fetchDeckPages("newpack")
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
        style={{
          background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)",
        }}
      >
        <main className="flex-grow container mx-auto px-4 pb-8">
          {/* デッキを投稿するボタンとお気に入りボタン */}
          <div className="my-6 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-sm mx-auto">
            <Button
              asChild
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              <Link href="/decks/create">
                <PlusCircle className="mr-2 h-5 w-5" />
                デッキを投稿する
              </Link>
            </Button>

            <Button
              asChild
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-base font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              <Link href="/favorites">
                <Star className="mr-2 h-5 w-5" />
                お気に入り
              </Link>
            </Button>
          </div>

          {/* カテゴリグリッド（2x2） */}
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            {categories.map((category) => {
              const IconComponent = category.icon
              const isActive = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`group rounded-xl p-6 shadow-lg transition-all duration-300 transform hover:-translate-y-1 border ${
                    isActive
                      ? "bg-blue-100 border-blue-300 shadow-xl"
                      : "bg-white border-blue-100 hover:border-blue-200 hover:shadow-xl"
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div
                      className={`p-3 rounded-full transition-colors duration-300 ${
                        isActive ? "bg-blue-200" : "bg-blue-100 group-hover:bg-blue-200"
                      }`}
                    >
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold mb-1 ${isActive ? "text-blue-800" : "text-slate-800"}`}>
                        {category.title}
                      </h3>
                      {category.description && (
                        <p className="text-xs text-slate-500 leading-tight">{category.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* デッキリスト（行ごとの横スクロール表示） */}
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
    </div>
  )
}
