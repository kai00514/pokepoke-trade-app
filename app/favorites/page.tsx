"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import DeckCardItem from "@/components/deck-card-item"
import type { DeckPost } from "@/types/deck"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftIcon, Loader2, Lock, Star } from "lucide-react"
import LoginPromptModal from "@/components/ui/login-prompt-modal"

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [favoriteDecks, setFavoriteDecks] = useState<DeckPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    const fetchFavoriteDecks = async () => {
      setLoading(true)
      setError(null)

      if (authLoading) return // Wait for auth state to be loaded

      if (!user) {
        setLoading(false)
        setShowLoginPrompt(true)
        return
      }

      const supabase = createClient()
      try {
        const { data, error } = await supabase.from("favorite_decks").select("deck_posts(*)").eq("user_id", user.id)

        if (error) throw error

        const decks = data ? data.map((fav: any) => fav.deck_posts) : []
        setFavoriteDecks(decks)
      } catch (err: any) {
        console.error("Error fetching favorite decks:", err)
        setError(`お気に入りデッキの取得に失敗しました: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchFavoriteDecks()
  }, [user, authLoading])

  const handleContinueAsGuest = () => {
    setShowLoginPrompt(false)
    window.location.href = "/decks" // または適切なゲストアクセス可能なページへ
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        <Card className="w-full max-w-sm bg-white/80 backdrop-blur-sm shadow-lg text-center">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
            <p className="text-xl font-semibold text-purple-700">読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center">
        <Card className="w-full max-w-lg bg-white/80 backdrop-blur-sm shadow-lg p-6">
          <CardTitle className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</CardTitle>
          <CardDescription className="text-gray-700 mb-6">{error}</CardDescription>
          <Button onClick={() => window.location.reload()} className="bg-red-500 hover:bg-red-600 text-white">
            再試行
          </Button>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        <LoginPromptModal
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          title="お気に入り機能のご利用にはログインが必要です"
          description="アカウントを作成してポケモンカードの取引を始めましょう。"
          onContinueAsGuest={handleContinueAsGuest}
        />
        <div className="flex flex-col items-center justify-center text-center max-w-2xl px-4 py-12">
          <Lock className="h-24 w-24 text-purple-500 mb-6" />
          <h2 className="text-4xl font-extrabold text-purple-800 mb-4">ログインしてください</h2>
          <p className="text-lg text-gray-700 mb-8">
            お気に入りデッキを管理するには、アカウントにログインするか、新規登録が必要です。
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeftIcon className="h-5 w-5 text-purple-700 hover:text-purple-900" />
              <span className="sr-only">戻る</span>
            </Button>
            <h1 className="text-3xl font-extrabold text-purple-800">お気に入りデッキ</h1>
            <Badge className="text-lg px-4 py-2 rounded-full bg-purple-200 text-purple-800 font-semibold">
              {favoriteDecks.length}件
            </Badge>
          </div>
        </div>

        {favoriteDecks.length === 0 ? (
          <Card className="w-full bg-white/80 backdrop-blur-sm shadow-lg p-8 text-center mt-12">
            <CardContent className="flex flex-col items-center justify-center">
              <Star className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
              <p className="text-2xl font-semibold text-gray-700 mb-4">お気に入りデッキがありません。</p>
              <p className="text-lg text-gray-600 mb-8">
                まだお気に入り登録されたデッキはありません。気になるデッキを見つけてお気に入りに追加しましょう！
              </p>
              <Link href="/decks">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                  デッキを探す
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteDecks.map((deck) => (
              <DeckCardItem key={deck.id} deck={deck} isFavorite={true} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
