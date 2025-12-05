"use client"

import { useState, useEffect, useCallback } from "react"
import type React from "react"
import { useRouter } from "@/lib/i18n-navigation"
import Image from "next/image"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Send, UserCircle, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Card as CardInfo } from "@/components/detailed-search-modal"
import { addCommentToTradePost, updateTradePostStatus, getTradePostCommentsOnly } from "@/lib/actions/trade-actions"
import { supabase } from "@/lib/supabase/client"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import { useAuth } from "@/contexts/auth-context"
import ShareModal from "@/components/share-modal"
import { event as gtagEvent } from "@/lib/analytics/gtag"
import { useTranslations } from "next-intl"

export interface Comment {
  id: string
  author: string
  avatar?: string | null
  text: string
  timestamp: string
}

export interface Author {
  username: string
  avatarUrl: string | null
  userId?: string
  isOwner?: boolean
}

export interface TradePostDetails {
  id: string
  title: string
  status: string
  wantedCards: CardInfo[]
  offeredCards: CardInfo[]
  description: string
  authorNotes?: string
  originalPostId: string
  comments: Comment[]
  author: Author
  createdAt: string
}

const OwnerActionButtons = ({ post, currentUserId }: { post: TradePostDetails; currentUserId: string | null }) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const tStatus = useTranslations("status")
  const tMessages = useTranslations("messages")
  const tCommon = useTranslations("common")

  if (!currentUserId || !post.author?.isOwner || post.author.userId !== currentUserId) return null
  if (post.status === tStatus("canceled") || post.status === tStatus("completed")) return null

  const handleStatusUpdate = async (status: "CANCELED" | "COMPLETED") => {
    if (isUpdating) return
    const action = status === "CANCELED" ? tStatus("canceled") : tStatus("completed")
    if (!confirm(tMessages("confirmAction", { action }))) return
    setIsUpdating(true)
    try {
      const result = await updateTradePostStatus(post.id, status)
      if (result.success) {
        toast({
          title: tMessages("actionCompleted", { action }),
          description: tMessages("statusChanged", { action })
        })
        window.location.reload()
      } else {
        toast({
          title: tMessages("actionFailed", { action }),
          description: result.error || tMessages("unexpected"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Error updating status to ${status}:`, error)
      toast({
        title: tMessages("title"),
        description: tMessages("actionError", { action }),
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
      <h3 className="text-sm font-medium text-slate-700 mb-3">{tMessages("ownerActions")}</h3>
      <div className="flex gap-3">
        <Button
          onClick={() => handleStatusUpdate("CANCELED")}
          disabled={isUpdating}
          variant="destructive"
          className="flex-1"
        >
          {isUpdating ? tMessages("processing") : tMessages("cancel")}
        </Button>
        <Button
          onClick={() => handleStatusUpdate("COMPLETED")}
          disabled={isUpdating}
          className="flex-1 bg-green-500 hover:bg-green-600"
        >
          {isUpdating ? tMessages("processing") : tMessages("complete")}
        </Button>
      </div>
    </div>
  )
}

interface TradeDetailClientProps {
  initialPost: TradePostDetails
  postId: string
}

export default function TradeDetailClient({ initialPost, postId }: TradeDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const t = useTranslations("comments")
  const tCommon = useTranslations("common")
  const tTrades = useTranslations("trades")
  const tStatus = useTranslations("status")
  const tMessages = useTranslations("messages")
  const [post, setPost] = useState<TradePostDetails>(initialPost)
  const [newComment, setNewComment] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const handleCopyToClipboard = useCallback(() => {
    if (post?.originalPostId) {
      navigator.clipboard.writeText(post.originalPostId)
      toast({
        title: tMessages("success.copied"),
        description: tMessages("idCopied", { id: post.originalPostId })
      })
    }
  }, [post?.originalPostId, toast, t])

  const handleShare = useCallback(() => {
    setIsShareModalOpen(true)
  }, [])

  const generateOptimisticComment = useCallback((user: any, isAuthenticated: boolean | null) => {
    const displayName = user?.user_metadata?.display_name || user?.email || tCommon("labels.user")
    const avatarUrl = user?.user_metadata?.avatar_url
    return (commentText: string) => ({
      id: `temp-${Date.now()}`,
      author: isAuthenticated ? displayName : t("guest"),
      avatar: isAuthenticated ? avatarUrl : null,
      text: commentText,
      timestamp: t("justNow"),
    })
  }, [t])

  const handleCommentSubmit = useCallback(async () => {
    if (!newComment.trim()) {
      toast({
        title: t("inputError"),
        description: t("pleaseEnter"),
        variant: "destructive"
      })
      return
    }
    const commentText = newComment.trim()
    const optimisticComment = generateOptimisticComment(user, isAuthenticated)(commentText)
    setPost((prev) => ({ ...prev, comments: [...prev.comments, optimisticComment] }))
    setNewComment("")
    try {
      const result = await addCommentToTradePost(
        postId,
        commentText,
        isAuthenticated ? user?.id : null,
        !isAuthenticated ? t("guest") : undefined,
        !!isAuthenticated,
      )
      if (result.success) {
        toast({
          title: t("posted"),
          description: t("postedSuccess"),
          duration: 2000
        })
      } else {
        throw new Error(result.error || t("postError"))
      }
    } catch (error) {
      setPost((prev) => ({ ...prev, comments: prev.comments.filter((comment) => comment.id !== optimisticComment.id) }))
      setNewComment(commentText)
      console.error("Error adding comment:", error)
      toast({
        title: t("postErrorTitle"),
        description: t("postErrorRetry"),
        variant: "destructive",
      })
    }
  }, [newComment, isAuthenticated, user, postId, toast, generateOptimisticComment, t])

  const handleCommentSubmitClick = useCallback(() => {
    if (!newComment.trim()) {
      toast({
        title: t("inputError"),
        description: t("pleaseEnter"),
        variant: "destructive"
      })
      return
    }
    if (!isAuthenticated) setShowLoginPrompt(true)
    else handleCommentSubmit()
  }, [newComment, isAuthenticated, handleCommentSubmit, toast, t])

  const handleContinueAsGuest = useCallback(() => {
    setShowLoginPrompt(false)
    handleCommentSubmit()
  }, [handleCommentSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleCommentSubmitClick()
      }
    },
    [handleCommentSubmitClick],
  )

  const handleBackToTimeline = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()

      const currentScrollY = window.scrollY
      sessionStorage.setItem("trade-list-scroll-position", currentScrollY.toString())

      if (window.history.length > 1) {
        window.history.back()
      } else {
        router.push("/")
      }
    },
    [router],
  )

  useEffect(() => {
    if (postId && post) {
      gtagEvent("trade_post_viewed", {
        category: "engagement",
        label: "trade_detail",
        post_id: postId,
        post_title: post.title,
        status: post.status,
      })
    }
  }, [postId, post])

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)
    }
    checkAuth()
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const fetchComments = async () => {
      const commentsResult = await getTradePostCommentsOnly(postId)
      if (commentsResult.success) {
        setPost((prev) => ({ ...prev, comments: commentsResult.comments }))
        console.log(`[TradeDetailClient] Comments loaded for post ${postId}`)
      } else {
        console.error("Failed to load comments:", commentsResult.error)
      }
    }
    fetchComments()
  }, [postId])

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem("trade-list-scroll-position", window.scrollY.toString())
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const renderCardList = (cards: CardInfo[], title: string) => (
    <div>
      <h2 className="text-lg font-semibold text-slate-700 mb-3">{title}</h2>
      {cards.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {cards.map((card) => (
            <div key={card.id} className="flex flex-col items-center">
              <Image
                src={card.imageUrl || "/placeholder.svg?width=80&height=112"}
                alt={card.name}
                width={80}
                height={112}
                className="rounded-md object-contain border border-slate-200 bg-slate-50 shadow-sm"
              />
              <p className="text-xs font-medium text-slate-600 mt-1 text-center max-w-[80px] truncate">{card.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{tTrades("notApplicable")}</p>
      )}
    </div>
  )

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/trades/${post.id}`

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <button
          onClick={handleBackToTimeline}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-6 group cursor-pointer border-none bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
          {tCommon("navigation.backToTimeline")}
        </button>
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{post.title}</h1>
              <div className="flex items-center mt-2 text-sm text-slate-500">
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl || "/placeholder.svg"}
                    alt={post.author.username}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                ) : (
                  <UserCircle className="h-6 w-6 text-slate-400 mr-2" />
                )}
                <span>{post.author.username}</span>
                <span className="mx-2">•</span>
                <span>{post.createdAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                {tCommon("buttons.share")}
              </Button>
              <Badge
                variant="outline"
                className={`whitespace-nowrap ${
                  post.status === tStatus("recruiting")
                    ? "bg-green-100 text-green-700 border-green-300"
                    : post.status === tStatus("inProgress")
                      ? "bg-amber-100 text-amber-700 border-amber-300"
                      : post.status === tStatus("completedShort")
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                {post.status}
              </Badge>
            </div>
          </div>
          <div className="space-y-6 mb-6">
            {renderCardList(post.wantedCards, tTrades("wantedCards"))}
            {renderCardList(post.offeredCards, tTrades("offeredCards"))}
          </div>
          {post.authorNotes && (
            <div className="bg-slate-100 p-4 rounded-md mb-6">
              <h3 className="font-semibold text-slate-800 mb-2">{tTrades("authorComment")}</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.authorNotes}</p>
            </div>
          )}
          <div className="flex justify-between items-center bg-slate-100 p-3 rounded-md">
            <p className="text-sm text-slate-600">ID : {post.originalPostId}</p>
            <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="text-xs bg-transparent">
              <Copy className="mr-1.5 h-3 w-3" />
              {tTrades("copy")}
            </Button>
          </div>
          <OwnerActionButtons post={post} currentUserId={user?.id || null} />
        </div>
        <div className="bg-white rounded-lg shadow-xl">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h2 className="text-xl font-semibold">{tMessages("title")}</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  {comment.avatar ? (
                    <Image
                      src={comment.avatar || "/placeholder.svg"}
                      alt={comment.author}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <UserCircle className="h-9 w-9 text-slate-400 flex-shrink-0" />
                  )}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{comment.author}</span>
                      <span className="text-xs text-slate-400">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">{t("noComments")}</p>
            )}
          </div>
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 rounded-b-lg">
            <div className="space-y-3">
              <Textarea
                placeholder={t("placeholder")}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] bg-white resize-none"
                onKeyDown={handleKeyDown}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">{t("shortcutHint")}</p>
                <Button
                  type="button"
                  onClick={handleCommentSubmitClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t("post")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} onContinueAsGuest={handleContinueAsGuest} />
      )}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareUrl}
        title={post.title}
      />
    </div>
  )
}
