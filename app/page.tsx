"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Noto_Sans_JP } from "next/font/google"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import TradePostCard from "@/components/trade-post-card"
import AdPlaceholder from "@/components/ad-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, Loader2, List } from "lucide-react"
import DetailedSearchModal from "@/components/detailed-search-modal"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import { useAuth } from "@/contexts/auth-context"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import { getTradePostsWithCards } from "@/lib/actions/trade-actions"
import { useToast } from "@/components/ui/use-toast"

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

export default function TradeBoardPage() {
  const [isDetailedSearchOpen, setIsDetailedSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tradePosts, setTradePosts] = useState<any[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // URLパラメータのクリーンアップ
  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      const url = new URL(window.location.href)
      url.searchParams.delete("code")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  const fetchTradePosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getTradePostsWithCards(20, 0)
      if (result.success) {
        setTradePosts(result.posts)
      } else {
        toast({
          title: "データ取得エラー",
          description: result.error || "投稿の取得に失敗しました。",
          variant: "destructive",
        })
        setTradePosts([])
      }
    } catch {
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
      setTradePosts([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTradePosts()
  }, [fetchTradePosts])

  const handleDetailedSearchSelectionComplete = (selectedCards: SelectedCardType[]) => {
    // ここで選択カードを使った検索やフィルタに接続可能
    setIsDetailedSearchOpen(false)
  }

  const handleManageListsClick = () => {
    if (!user) {
      setShowLoginPrompt(true)
    } else {
      router.push("/lists")
    }
  }

  const filteredPosts = tradePosts.filter((post) => {
    if (!searchKeyword.trim()) return true
    const keyword = searchKeyword.toLowerCase()
    const titleMatch = post.title?.toLowerCase().includes(keyword)
    const wantedCardNameMatch = post.wantedCard?.name?.toLowerCase().includes(keyword)
    const offeredCardNameMatch = post.offeredCard?.name?.toLowerCase().includes(keyword)
    return titleMatch || wantedCardNameMatch || offeredCardNameMatch
  })

  const handleCreatePostClick = () => {
    router.push("/trades/create")
  }

  return (
    <div className={`flex min-h-screen flex-col ${notoSansJP.className}`}>
      <Header />

      {/* Soft blue-to-white gradient banner area */}
      <div
        className="w-full"
        style={{
          background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)",
        }}
      >
        <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-10">
          <section className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-[#3B82F6] via-[#1D4ED8] to-[#6366F1] text-white px-8 py-3 text-2xl sm:text-3xl font-bold mb-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm animate-float">
              <span className="relative z-10">PokeLink トレード掲示板</span>
            </div>
            <p className="mt-2 text-sm sm:text-base text-[#6B7280]">
              欲しいカードと譲れるカードをスムーズに交換しよう！
            </p>
          </section>

          {/* Action Bar */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <Button
              variant="default"
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-md shadow-sm"
              style={{ padding: "0.625rem 1.25rem" }}
              onClick={handleCreatePostClick}
            >
              <div className="flex items-center justify-center">
                <PlusCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">トレード希望投稿を作成</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-md shadow-sm bg-transparent"
              style={{ padding: "0.5rem 1rem" }}
              onClick={handleManageListsClick}
            >
              <div className="flex items-center justify-center">
                <List className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">譲れるカードのリストを作成/編集</span>
              </div>
            </Button>
          </div>

          {/* Search */}
          <div className="mb-2 rounded-xl border border-[#4169e1] bg-white/90 shadow-sm backdrop-blur-sm">
            <div className="p-1">
              <div className="flex gap-1">
                <Input
                  type="text"
                  placeholder="キーワードで検索"
                  className="flex-1 min-w-0 rounded-lg border-[#E5E7EB] text-[#111827] placeholder:text-[#9CA3AF] focus-visible:ring-[#3B82F6] focus-visible:ring-2"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <Button
                  variant="outline"
                  className="border-[#CBD5E1] text-[#111827] bg-white hover:bg-[#F8FAFC] whitespace-nowrap flex-shrink-0 rounded-lg"
                  onClick={() => setIsDetailedSearchOpen(true)}
                >
                  詳細
                </Button>
                <Button
                  variant="default"
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white whitespace-nowrap flex-shrink-0 rounded-lg px-2"
                >
                  <Search className="mr-1 h-4 w-4" /> 検索
                </Button>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Ads */}
            <aside className="w-full lg:w-1/5 space-y-6 hidden lg:block">
              <AdPlaceholder title="広告スペース" className="h-64 border border-[#E5E7EB] bg-white rounded-xl" />
              <AdPlaceholder title="自己紹介バナー" className="h-48 border border-[#E5E7EB] bg-white rounded-xl" />
            </aside>

            {/* Posts */}
            <section className="w-full lg:flex-grow">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-[#3B82F6]" />
                </div>
              ) : filteredPosts.length > 0 ? (
                <div className="space-y-6">
                  {filteredPosts.map((post) => (
                    <TradePostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-[#6B7280]">該当する投稿が見つかりませんでした。</div>
              )}
            </section>

            {/* Right Ads */}
            <aside className="w-full lg:w-1/5 space-y-6 hidden lg:block">
              <AdPlaceholder title="広告スペース" className="h-64 border border-[#E5E7EB] bg-white rounded-xl" />
              <AdPlaceholder title="広告スペース" className="h-40 border border-[#E5E7EB] bg-white rounded-xl" />
            </aside>
          </div>
        </main>
      </div>

      <Footer />
      <DetailedSearchModal
        isOpen={isDetailedSearchOpen}
        onOpenChange={setIsDetailedSearchOpen}
        onSelectionComplete={handleDetailedSearchSelectionComplete}
        modalTitle="カード詳細検索"
      />
      {showLoginPrompt && <LoginPromptModal onClose={() => setShowLoginPrompt(false)} showGuestButton={false} />}
    </div>
  )
}
