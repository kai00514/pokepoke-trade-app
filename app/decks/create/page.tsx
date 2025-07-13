"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, Search, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { createDeck } from "@/lib/actions/deck-posts"
import { searchCards } from "@/lib/card-api"
import CardDisplay from "@/components/card-display"
import Header from "@/components/layout/header"
import { FooterNavigation } from "@/components/layout/footer-navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import type { CardData } from "@/lib/card-utils"

interface DeckCard {
  card_id: number
  quantity: number
  cardData?: CardData
}

export default function CreateDeckPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deckCards, setDeckCards] = useState<DeckCard[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CardData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await searchCards(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "エラー",
        description: "カード検索に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const addCardToDeck = (card: CardData) => {
    const existingCard = deckCards.find((dc) => dc.card_id === card.id)
    if (existingCard) {
      if (existingCard.quantity < 2) {
        setDeckCards(deckCards.map((dc) => (dc.card_id === card.id ? { ...dc, quantity: dc.quantity + 1 } : dc)))
      } else {
        toast({
          title: "制限に達しました",
          description: "同じカードは2枚まで追加できます",
          variant: "destructive",
        })
      }
    } else {
      setDeckCards([...deckCards, { card_id: card.id, quantity: 1, cardData: card }])
    }
  }

  const removeCardFromDeck = (cardId: number) => {
    const existingCard = deckCards.find((dc) => dc.card_id === cardId)
    if (existingCard && existingCard.quantity > 1) {
      setDeckCards(deckCards.map((dc) => (dc.card_id === cardId ? { ...dc, quantity: dc.quantity - 1 } : dc)))
    } else {
      setDeckCards(deckCards.filter((dc) => dc.card_id !== cardId))
    }
  }

  const deleteCardFromDeck = (cardId: number) => {
    setDeckCards(deckCards.filter((dc) => dc.card_id !== cardId))
  }

  const getTotalCards = () => {
    return deckCards.reduce((total, card) => total + card.quantity, 0)
  }

  const handleCreateDeck = async () => {
    if (!title.trim()) {
      toast({
        title: "エラー",
        description: "デッキ名を入力してください",
        variant: "destructive",
      })
      return
    }

    if (deckCards.length === 0) {
      toast({
        title: "エラー",
        description: "カードを追加してください",
        variant: "destructive",
      })
      return
    }

    const totalCards = getTotalCards()
    if (totalCards !== 20) {
      toast({
        title: "エラー",
        description: "デッキはちょうど20枚で構成してください",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const { data, error } = await createDeck({
        title: title.trim(),
        description: description.trim(),
        user_id: user?.id,
        is_authenticated: !!user,
        is_public: true,
        deck_cards: deckCards.map((dc) => ({
          card_id: dc.card_id,
          quantity: dc.quantity,
        })),
        thumbnail_card_id: deckCards[0]?.card_id,
      })

      if (error) {
        toast({
          title: "エラー",
          description: error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "成功",
        description: "デッキが作成されました",
      })

      router.push(`/decks/${data.id}`)
    } catch (error) {
      console.error("Create deck error:", error)
      toast({
        title: "エラー",
        description: "デッキの作成に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (authLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-[#6246ea] mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">読み込み中...</p>
                </div>
              </div>
            </main>
            <FooterNavigation />
          </div>
        </AuthProvider>
      </ThemeProvider>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-6 pb-24">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">デッキ作成</h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* デッキ情報入力 */}
                <Card>
                  <CardHeader>
                    <CardTitle>デッキ情報</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">デッキ名 *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="デッキ名を入力"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">説明</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="デッキの説明を入力&#10;改行も可能です"
                        rows={4}
                        maxLength={500}
                      />
                    </div>
                    <div className="text-sm text-gray-600">カード枚数: {getTotalCards()}/20 (ちょうど20枚)</div>
                  </CardContent>
                </Card>

                {/* カード検索 */}
                <Card>
                  <CardHeader>
                    <CardTitle>カード検索</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="カード名で検索"
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      />
                      <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {searchResults.map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => addCardToDeck(card)}
                        >
                          <div className="w-12 h-16 flex-shrink-0">
                            <CardDisplay cardId={card.id} useThumb={true} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{card.name}</p>
                            <p className="text-xs text-gray-500">{card.type_code}</p>
                          </div>
                          <Plus className="h-4 w-4 text-green-600" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* デッキリスト */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>デッキリスト ({getTotalCards()}枚)</CardTitle>
                </CardHeader>
                <CardContent>
                  {deckCards.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">カードを検索して追加してください</p>
                  ) : (
                    <div className="space-y-2">
                      {deckCards.map((deckCard) => (
                        <div key={deckCard.card_id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-12 h-16 flex-shrink-0">
                            <CardDisplay cardId={deckCard.card_id} useThumb={true} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {deckCard.cardData?.name || `Card ${deckCard.card_id}`}
                            </p>
                            <p className="text-xs text-gray-500">{deckCard.cardData?.type_code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => removeCardFromDeck(deckCard.card_id)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Badge variant="secondary">{deckCard.quantity}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addCardToDeck(deckCard.cardData!)}
                              disabled={deckCard.quantity >= 2}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteCardFromDeck(deckCard.card_id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 作成ボタン */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleCreateDeck}
                  disabled={isCreating || !title.trim() || deckCards.length === 0}
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      作成中...
                    </>
                  ) : (
                    "デッキを作成"
                  )}
                </Button>
              </div>
            </div>
          </main>
          <FooterNavigation />
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}
