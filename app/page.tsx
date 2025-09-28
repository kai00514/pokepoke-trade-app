"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Noto_Sans_JP } from "next/font/google"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import TradePostCard from "@/components/trade-post-card"
import AdPlaceholder from "@/components/ad-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, Loader2, List, ChevronLeft, ChevronRight } from "lucide-react"
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

const POSTS_PER_PAGE = 50
const CACHE_DURATION = 30 * 60 * 1000 // 30分に延長

export default function TradeBoardPage() {
  const [isDetailedSearchOpen, setIsDetailedSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tradePosts, setTradePosts] = useState<any[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isInitialMount = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // URLパラメータからページ番号を取得
  useEffect(() => {
    const pageParam = searchParams.get("page")
    if (pageParam) {
      const page = Number.parseInt(pageParam, 10)
      if (page > 0 && page !== currentPage) {
        setCurrentPage(page)
      }
    } else if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchParams])

  // URLパラメータのクリーンアップ
  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      const url = new URL(window.location.href)
      url.searchParams.delete("code")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  // スクロール位置の保存・復元用のuseEffect
  useEffect(() => {
    // ブラウザバック時のみスクロール位置を復元
    const isBackNavigation = sessionStorage.getItem(`trade-list-back-navigation-page-${currentPage}`)
    if (isBackNavigation) {
      const savedScrollPosition = sessionStorage.getItem(`trade-list-scroll-position-page-${currentPage}`)
      if (savedScrollPosition) {
        const scrollY = Number.parseInt(savedScrollPosition, 10)
        // データが既に表示されている場合のみスクロール位置を復元
        setTimeout(() => {
          window.scrollTo(0, scrollY)
        }, 100)
      }
      sessionStorage.removeItem(`trade-list-back-navigation-page-${currentPage}`)
    }

    // スクロール位置を定期的に保存（ページ番号付き）
    const saveScrollPosition = () => {
      sessionStorage.setItem(`trade-list-scroll-position-page-${currentPage}`, window.scrollY.toString())
    }

    window.addEventListener("scroll", saveScrollPosition)

    return () => {
      window.removeEventListener("scroll", saveScrollPosition)
    }
  }, [currentPage, isLoading])

  // ブラウザバック/フォワード時の処理
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // URLからページ番号を取得
      const url = new URL(window.location.href)
      const pageParam = url.searchParams.get("page")
      const targetPage = pageParam ? Number.parseInt(pageParam, 10) : 1

      // ブラウザバック時のフラグを設定
      sessionStorage.setItem(`trade-list-back-navigation-page-${targetPage}`, "true")
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const fetchTradePosts = useCallback(
    async (page: number) => {
      // 既存のリクエストをキャンセル
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 新しいAbortControllerを作成
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      setIsLoading(true)
      try {
        const offset = (page - 1) * POSTS_PER_PAGE
        const result = await getTradePostsWithCards(POSTS_PER_PAGE, offset)

        // リクエストがキャンセルされていないかチェック
        if (signal.aborted) {
          return
        }

        if (result.success) {
          setTradePosts(result.posts)
          setTotalCount(result.totalCount || 0)

          // データをキャッシュに保存（30分間有効）
          const cacheData = {
            posts: result.posts,
            totalCount: result.totalCount || 0,
            timestamp: Date.now(),
          }
          sessionStorage.setItem(`trade-posts-cache-page-${page}`, JSON.stringify(cacheData))
        } else {
          toast({
            title: "データ取得エラー",
            description: result.error || "投稿の取得に失敗しました。",
            variant: "destructive",
          })
          setTradePosts([])
          setTotalCount(0)
        }
      } catch (error: any) {
        // AbortErrorは無視
        if (error.name === "AbortError" || signal.aborted) {
          return
        }

        toast({
          title: "エラー",
          description: "予期しないエラーが発生しました。",
          variant: "destructive",
        })
        setTradePosts([])
        setTotalCount(0)
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [toast],
  )

  // データ取得のuseEffect - キャッシュ優先版
  useEffect(() => {
    const hasCache = sessionStorage.getItem(`trade-posts-cache-page-${currentPage}`)
    const isBackNavigation = sessionStorage.getItem(`trade-list-back-navigation-page-${currentPage}`)

    // キャッシュからデータを復元する関数
    const loadFromCache = () => {
      if (!hasCache) return false

      try {
        const cachedData = JSON.parse(hasCache)
        const cacheAge = Date.now() - (cachedData.timestamp || 0)

        // キャッシュが30分以内なら使用
        if (cacheAge < CACHE_DURATION) {
          setTradePosts(cachedData.posts)
          setTotalCount(cachedData.totalCount)
          setIsLoading(false)
          return true
        } else {
          // 期限切れキャッシュを削除
          sessionStorage.removeItem(`trade-posts-cache-page-${currentPage}`)
          return false
        }
      } catch (error) {
        console.error("Failed to parse cached data:", error)
        sessionStorage.removeItem(`trade-posts-cache-page-${currentPage}`)
        return false
      }
    }

    if (isInitialMount.current) {
      isInitialMount.current = false

      // 初回マウント時はキャッシュを優先的に使用
      if (!loadFromCache()) {
        fetchTradePosts(currentPage)
      }
    } else if (isBackNavigation) {
      // ブラウザバック時は必ずキャッシュを使用（期限切れでも一時的に使用）
      if (hasCache) {
        try {
          const cachedData = JSON.parse(hasCache)
          setTradePosts(cachedData.posts)
          setTotalCount(cachedData.totalCount)
          setIsLoading(false)

          // 期限切れの場合はバックグラウンドで更新
          const cacheAge = Date.now() - (cachedData.timestamp || 0)
          if (cacheAge >= CACHE_DURATION) {
            setTimeout(() => fetchTradePosts(currentPage), 1000)
          }
        } catch (error) {
          console.error("Failed to parse cached data:", error)
          fetchTradePosts(currentPage)
        }
      } else {
        fetchTradePosts(currentPage)
      }
    } else {
      // 通常のページ変更時
      if (!loadFromCache()) {
        fetchTradePosts(currentPage)
      }
    }

    // クリーンアップ関数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [currentPage, fetchTradePosts])

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

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return

    setCurrentPage(page)

    // URLを更新
    const url = new URL(window.location.href)
    if (page === 1) {
      url.searchParams.delete("page")
    } else {
      url.searchParams.set("page", page.toString())
    }
    window.history.pushState({}, "", url.toString())

    // ページネーション時は明示的にトップにスクロール
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="border-[#CBD5E1] text-[#111827] bg-white hover:bg-[#F8FAFC]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={isLoading}
              className="border-[#CBD5E1] text-[#111827] bg-white hover:bg-[#F8FAFC]"
            >
              1
            </Button>
            {startPage > 2 && <span className="text-[#6B7280]">...</span>}
          </>
        )}

        {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
          const page = startPage + i
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
              className={
                currentPage === page
                  ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                  : "border-[#CBD5E1] text-[#111827] bg-white hover:bg-[#F8FAFC]"
              }
            >
              {page}
            </Button>
          )
        })}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-[#6B7280]">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={isLoading}
              className="border-[#CBD5E1] text-[#111827] bg-white hover:bg-[#F8FAFC]"
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="border-[#CBD5E1] text-[#111827] bg-white hover:bg-[#F8FAFC]"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
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
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-[#3B82F6] via-[#1D4ED8] to-[#6366F1] text-white px-8 py-2 text-2xl sm:text-3xl font-bold mb-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm animate-float">
              <span className="relative z-10">PokeLink トレード掲示板</span>
            </div>
            <p className="mt-1 text-sm sm:text-base text-[#6B7280]">
              欲しいカードと譲れるカードをスムーズに交換しよう！
            </p>
          </section>

          {/* Action Bar */}
          <div className="mb-5 flex flex-col items-center gap-3">
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
          <div className="mb-2 rounded-xl border border-[#3d496e] bg-white/90 shadow-sm backdrop-blur-sm">
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

          {/* Results Info */}
          {!isLoading && (
            <div className="mb-4 text-center text-sm text-[#6B7280]">
              {totalCount > 0 ? (
                <>
                  全{totalCount}件中 {(currentPage - 1) * POSTS_PER_PAGE + 1}〜
                  {Math.min(currentPage * POSTS_PER_PAGE, totalCount)}件を表示
                  {searchKeyword && ` (「${searchKeyword}」で検索)`}
                </>
              ) : (
                "投稿がありません"
              )}
            </div>
          )}

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
                <div className="flex justify-center items-center py-5">
                  <Loader2 className="h-5 w-10 animate-spin text-[#3B82F6]" />
                </div>
              ) : filteredPosts.length > 0 ? (
                <>
                  <div className="space-y-6">
                    {filteredPosts.map((post) => (
                      <TradePostCard key={post.id} post={post} />
                    ))}
                  </div>
                  {renderPagination()}
                </>
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
