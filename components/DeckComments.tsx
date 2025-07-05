"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, UserCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import LoginPromptModal from "@/components/ui/login-prompt-modal"

interface Comment {
  id: string
  author: string
  avatar?: string | null
  text: string
  timestamp: string
  isGuest?: boolean
}

interface DeckCommentsProps {
  deckId: string
  deckTitle: string
  commentType?: "deck" | "deck_page"
}

export default function DeckComments({ deckId, deckTitle, commentType = "deck" }: DeckCommentsProps) {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session?.user)
    }
    checkAuth()
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const fetchComments = useCallback(async () => {
    if (!deckId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/deck-comments?deckId=${deckId}&commentType=${commentType}`)
      const data = await response.json()
      if (data.success) {
        const transformedComments = data.comments.map((comment: any) => ({
          id: comment.id,
          author: comment.user_name || "匿名ユーザー",
          avatar: null,
          text: comment.content,
          timestamp: new Date(comment.created_at).toLocaleString("ja-JP"),
          isGuest: !comment.user_id,
        }))
        setComments(transformedComments)
      } else {
        toast({
          title: "エラー",
          description: data.error || "コメントの読み込みに失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({ title: "エラー", description: "予期しないエラーが発生しました。", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [deckId, commentType, toast])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleCommentSubmit = useCallback(
    async (isGuestSubmission = false) => {
      if (!newComment.trim()) {
        toast({ title: "入力エラー", description: "コメントを入力してください。", variant: "destructive" })
        return
      }
      const commentText = newComment.trim()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const currentUser = session?.user
      const isActualGuestUser = !currentUser || isGuestSubmission
      let userName = "ゲスト"
      if (!isActualGuestUser && currentUser) {
        userName =
          currentUser.user_metadata?.display_name ||
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.user_name ||
          currentUser.email?.split("@")[0] ||
          "匿名ユーザー"
      }
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        author: userName,
        avatar: null,
        text: commentText,
        timestamp: "たった今",
        isGuest: isActualGuestUser,
      }
      setComments((prev) => [...prev, optimisticComment])
      setNewComment("")
      try {
        const payload = {
          deckId: deckId,
          content: commentText,
          userId: isActualGuestUser ? null : currentUser?.id,
          userName: userName,
          isGuest: isActualGuestUser,
          commentType: commentType || "deck",
        }
        const response = await fetch("/api/deck-comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        const data = await response.json()
        if (data.success) {
          const actualComment: Comment = {
            id: data.comment.id,
            author: data.comment.user_name || userName,
            avatar: null,
            text: data.comment.content,
            timestamp: new Date(data.comment.created_at).toLocaleString("ja-JP"),
            isGuest: !data.comment.user_id,
          }
          setComments((prev) => prev.map((comment) => (comment.id === optimisticComment.id ? actualComment : comment)))
          toast({
            title: "投稿完了",
            description: isActualGuestUser ? "ゲストとしてコメントを投稿しました" : "コメントを投稿しました",
            duration: 2000,
          })
        } else {
          throw new Error(data.error || "コメントの投稿に失敗しました")
        }
      } catch (error) {
        setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id))
        setNewComment(commentText)
        toast({
          title: "コメント投稿エラー",
          description:
            error instanceof Error ? error.message : "コメントの投稿に失敗しました。もう一度お試しください。",
          variant: "destructive",
        })
      }
    },
    [newComment, deckId, commentType, toast],
  )

  const handleCommentSubmitClick = useCallback(async () => {
    if (!newComment.trim()) {
      toast({ title: "入力エラー", description: "コメントを入力してください。", variant: "destructive" })
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) setShowLoginPrompt(true)
    else handleCommentSubmit(false)
  }, [newComment, handleCommentSubmit, toast])

  const handleContinueAsGuest = useCallback(() => {
    setShowLoginPrompt(false)
    handleCommentSubmit(true)
  }, [handleCommentSubmit])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-xl">
        <div className="bg-purple-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-semibold">コメント</h2>
        </div>
        <div className="p-4 sm:p-6 flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl">
      <div className="bg-purple-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">コメント ({comments.length})</h2>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
            >
              <UserCircle className="h-9 w-9 text-slate-400 flex-shrink-0" />
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-700">{comment.author}</span>
                    {comment.isGuest && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">ゲスト</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{comment.timestamp}</span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">まだコメントはありません。</p>
        )}
      </div>
      <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 rounded-b-lg">
        <div className="mb-3 text-sm text-gray-600">
          {isAuthenticated ? <span>ログイン中: {user?.user_metadata?.display_name || user?.email}</span> : null}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder={
              isAuthenticated ? "コメントを入力してください..." : "ゲストとしてコメントを入力してください..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow bg-white"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleCommentSubmitClick()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleCommentSubmitClick}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!newComment.trim()}
          >
            <Send className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">投稿</span>
          </Button>
        </div>
      </div>
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} onContinueAsGuest={handleContinueAsGuest} />
      )}
    </div>
  )
}
