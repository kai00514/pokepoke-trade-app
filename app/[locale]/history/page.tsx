"use client"

import dynamic from "next/dynamic"
import { useState, useRef, useEffect, useCallback } from "react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Archive, MessageCircle, Users, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import HistoryItemCard, { type HistoryItem } from "@/components/history-item-card"
import { useSwipeable } from "react-swipeable"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import { getMyTradePosts, getCommentedTradePosts } from "@/lib/actions/trade-actions"
import { useTranslations, useLocale } from "next-intl"

type TabId = "myPosts" | "commentedPosts" | "matchingHistory"

interface TabInfo {
  id: TabId
  label: string
  icon: LucideIcon
}

const getTabs = (t: any): TabInfo[] => [
  { id: "myPosts", label: t("pages.history.myPosts"), icon: Archive },
  { id: "commentedPosts", label: t("pages.history.commentedPosts"), icon: MessageCircle },
  { id: "matchingHistory", label: t("pages.history.matchingHistory"), icon: Users },
]

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { type: "tween", ease: "easeInOut", duration: 0.3 },
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    transition: { type: "tween", ease: "easeInOut", duration: 0.3 },
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { type: "tween", ease: "easeInOut", duration: 0.3 },
  }),
}

function HistoryPageContent() {
  const t = useTranslations()
  const locale = useLocale()
  const tabs = getTabs(t)
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [myPosts, setMyPosts] = useState<HistoryItem[]>([])
  const [commentedPosts, setCommentedPosts] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const { user, loading: authLoading } = useAuth()
  const isAuthenticated = !!user

  const activeTabId = tabs[activeTabIndex].id

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return
      if (!isAuthenticated || !user?.id) {
        setShowLoginPrompt(true)
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const myPostsResult = await getMyTradePosts(user.id, locale)
        if (myPostsResult.success) setMyPosts(myPostsResult.posts)

        const commentedPostsResult = await getCommentedTradePosts(user.id, locale)
        if (commentedPostsResult.success) setCommentedPosts(commentedPostsResult.posts)
      } catch (err) {
        console.error("Error fetching history data:", err)
        setError(t("pages.history.fetchError"))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isAuthenticated, user?.id, authLoading, t])

  const changeTab = useCallback(
    (newIndex: number) => {
      if (newIndex === activeTabIndex) return
      setDirection(newIndex > activeTabIndex ? 1 : -1)
      setActiveTabIndex(newIndex)
    },
    [activeTabIndex],
  )

  useEffect(() => {
    tabButtonRefs.current[activeTabIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [activeTabIndex])

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => activeTabIndex < tabs.length - 1 && changeTab(activeTabIndex + 1),
    onSwipedRight: () => activeTabIndex > 0 && changeTab(activeTabIndex - 1),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  const renderContent = () => {
    if (authLoading) return <div className="text-center py-10 text-slate-500">{t("pages.history.authenticating")}</div>
    if (!isAuthenticated) return null // LoginPromptModalが表示される
    if (loading) return <div className="text-center py-10 text-slate-500">{t("pages.history.loading")}</div>
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>

    let items: HistoryItem[] = []
    let emptyMessage = t("pages.history.noHistory")

    switch (activeTabId) {
      case "myPosts":
        items = myPosts
        emptyMessage = t("pages.history.noMyPosts")
        break
      case "commentedPosts":
        items = commentedPosts
        emptyMessage = t("pages.history.noCommentedPosts")
        break
      case "matchingHistory":
        emptyMessage = t("pages.history.noMatchingHistory")
        break
    }

    if (items.length === 0) return <div className="text-center py-10 text-slate-500">{emptyMessage}</div>

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <HistoryItemCard key={item.id} item={item} />
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
        <main className="flex-grow container mx-auto px-0 sm:px-4 pb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center my-6 sm:my-8 px-4 sm:px-0">{t("pages.history.title")}</h1>

          {!showLoginPrompt && (
            <>
              {/* Tab Bar */}
              <div className="sticky top-0 z-10 bg-transparent backdrop-blur-sm shadow-sm">
                <div className="flex justify-center">
                  <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-200">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab.id}
                        ref={(el) => (tabButtonRefs.current[index] = el)}
                        onClick={() => changeTab(index)}
                        className={cn(
                          "flex items-center justify-center space-x-2 p-3 sm:p-4 min-h-[56px] min-w-[100px] sm:min-w-[140px] transition-colors duration-150 ease-in-out",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                          activeTabIndex === index
                            ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                            : "text-slate-500 hover:text-blue-500 hover:bg-slate-100",
                        )}
                        style={{ flexShrink: 0 }}
                      >
                        <tab.icon className="h-4 w-4 sm:h-5 w-5 flex-shrink-0" />
                        <span className="text-sm sm:text-base">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div {...swipeHandlers} className="mt-6 px-4 sm:px-0 overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={activeTabId}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="will-change-transform"
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
        </main>
      </div>
      <Footer />
      {showLoginPrompt && <LoginPromptModal onClose={() => setShowLoginPrompt(false)} showGuestButton={false} />}
    </div>
  )
}

const HistoryPage = dynamic(() => Promise.resolve(HistoryPageContent), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div
        className="w-full flex-1"
        style={{
          background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)",
        }}
      >
        <main className="flex-grow container mx-auto px-4 pb-8">
          <div className="text-center py-10 text-slate-500">Loading...</div>
        </main>
      </div>
      <Footer />
    </div>
  ),
})

export default HistoryPage
