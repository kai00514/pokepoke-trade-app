"use client"

import { useState, useEffect } from "react"
import { DeckCard, type Deck } from "@/components/deck-card"
import { unfavoriteDeck, getFavoriteDecks } from "@/lib/services/deck-service"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Star, PlusCircle, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LoginPrompt } from "@/components/login-prompt"

export default function FavoritesPage() {
  const [favoriteDecks, setFavoriteDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchDecks = async () => {
      // 認証状態のロードが完了するまで待つ
      if (authLoading) return

      // ゲストユーザーの場合はログインプロンプトを表示
      if (!user) {
        setShowLoginPrompt(true)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getFavoriteDecks()
        if (error) {
          console.error("Error fetching favorite decks:", error)
          setError("お気に入りデッキの取得に失敗しました。")
          setFavoriteDecks([])
        } else {
          setFavoriteDecks(data)
        }
      } catch (err) {
        console.error("Exception fetching favorite decks:", err)
        setError("お気に入りデッキの取得中に予期せぬエラーが発生しました。")
        setFavoriteDecks([])
      } finally {
        setLoading(false)
      }
    }

    fetchDecks()
  }, [user, authLoading])

  const handleRemoveFavorite = async (deckId: string) => {
    if (!user) {
      toast({
        title: "エラー",
        description: "ログインしてお気に入りを解除してください。",
        variant: "destructive",
      })
      return
    }

    const { error } = await unfavoriteDeck(deckId)

    if (error) {
      toast({
        title: "エラー",
        description: `お気に入りの解除に失敗しました: ${error}`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "成功",
        description: "お気に入りを解除しました。",
      })
      setFavoriteDecks((prevDecks) => prevDecks.filter((deck) => deck.id !== deckId))
    }
  }

  const handleContinueAsGuest = () => {
    setShowLoginPrompt(false)
    router.push("/decks")
  }

  // 認証状態のローディング中のみ表示
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="text-purple-700 hover:text-purple-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-extrabold text-purple-800">お気に入りデッキ</h1>
          </div>
          <Card className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-8">
            <CardContent className="flex flex-col items-center justify-center h-48">
              <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
              <p className="text-lg text-slate-600 font-medium">認証状態を確認中...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ゲストユーザーの場合はログインプロンプトモーダルを表示
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col py-12 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="text-purple-700 hover:text-purple-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-extrabold text-purple-800">お気に入りデッキ</h1>
          </div>

          <Card className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-8 text-center">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-3">お気に入りデッキを確認</h3>
              <p className="text-lg text-gray-600 mb-8">お気に入りのデッキを保存・管理するにはログインが必要です。</p>
            </CardContent>
          </Card>
        </div>

        <LoginPrompt
          open={showLoginPrompt}
          setOpen={setShowLoginPrompt}
          title="お気に入りデッキを表示するにはログインが必要です"
          description="お気に入りのデッキを保存して、いつでも簡単にアクセスできるようにしましょう。"
          onContinueAsGuest={handleContinueAsGuest}
        />
      </div>
    )
  }

  // データ取得中のローディング
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col py-12 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="text-purple-700 hover:text-purple-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-extrabold text-purple-800">お気に入りデッキ</h1>
          </div>
          <Card className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-8">
            <CardContent className="flex flex-col items-center justify-center h-48">
              <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
              <p className="text-lg text-slate-600 font-medium">お気に入りデッキを読み込み中...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // エラーの場合
  if (error) {
    return (
      <div className="min-h-screen flex flex-col py-12 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="text-purple-700 hover:text-purple-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-extrabold text-purple-800">お気に入りデッキ</h1>
          </div>
          <Card className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-8">
            <CardContent className="flex flex-col items-center justify-center h-48">
              <p className="text-red-500 text-lg font-medium mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700 text-white">
                再試行
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // お気に入りデッキが0件の場合
  if (favoriteDecks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col py-12 bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="text-purple-700 hover:text-purple-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-extrabold text-purple-800">お気に入りデッキ</h1>
            <Badge
              variant="secondary"
              className="text-lg px-4 py-2 rounded-full bg-purple-200 text-purple-800 font-semibold"
            >
              0件
            </Badge>
          </div>
          <Card className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-8 text-center">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-16 w-16 text-yellow-400 mx-auto mb-6 animate-bounce" />
              <h3 className="text-2xl font-bold text-gray-800 mb-3">お気に入りデッキがありません</h3>
              <p className="text-lg text-gray-600 mb-8">気になるデッキを見つけてお気に入りに追加しましょう！</p>
              <Button
                asChild
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                <Link href="/decks">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  デッキを探す
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // お気に入りデッキがある場合
  return (
    <div className="min-h-screen flex flex-col py-12 bg-gradient-to-br from-purple-50 to-purple-100">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-purple-700 hover:text-purple-900">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-extrabold text-purple-800">お気に入りデッキ</h1>
          <Badge
            variant="secondary"
            className="text-lg px-4 py-2 rounded-full bg-purple-200 text-purple-800 font-semibold"
          >
            {favoriteDecks.length}件
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteDecks.map((deck) => (
            <div key={deck.id} className="relative">
              <DeckCard
                deck={deck}
                currentCategory={deck.category || "favorites"}
                onRemoveFavorite={handleRemoveFavorite}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
