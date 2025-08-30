"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X, List, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import DetailedSearchModal from "@/components/detailed-search-modal"
import ListSelectorModal from "@/components/trade-owned-lists/list-selector-modal"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import { getCardsByIds } from "@/lib/card-api"
import { createTradePost } from "@/lib/actions/trade-actions"

interface CardInfo {
  id: number
  name: string
  image_url: string
}

export default function CreateTradePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [offeredCards, setOfferedCards] = useState<CardInfo[]>([])
  const [wantedCards, setWantedCards] = useState<CardInfo[]>([])

  // Modal states
  const [isOfferedSearchOpen, setIsOfferedSearchOpen] = useState(false)
  const [isWantedSearchOpen, setIsWantedSearchOpen] = useState(false)
  const [isListSelectorOpen, setIsListSelectorOpen] = useState(false)

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCards, setIsLoadingCards] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/auth/login")
      return
    }
  }, [user, loading, router])

  const handleAddOfferedCards = (selectedCards: SelectedCardType[]) => {
    const existingIds = new Set(offeredCards.map((card) => card.id))

    const newCards = selectedCards
      .filter((card) => !existingIds.has(Number.parseInt(card.id)))
      .map((card) => ({
        id: Number.parseInt(card.id),
        name: card.name,
        image_url: card.imageUrl || `/placeholder.svg?height=100&width=70&text=${card.name}`,
      }))

    const totalCards = offeredCards.length + newCards.length
    if (totalCards > 20) {
      toast({
        title: "エラー",
        description: `譲れるカードは最大20枚まで登録できます。（現在: ${offeredCards.length}枚）`,
        variant: "destructive",
      })
      return
    }

    setOfferedCards((prev) => [...prev, ...newCards])
    setIsOfferedSearchOpen(false)

    if (newCards.length > 0) {
      toast({
        title: "成功",
        description: `${newCards.length}枚のカードを追加しました。`,
      })
    }
  }

  const handleAddWantedCards = (selectedCards: SelectedCardType[]) => {
    const existingIds = new Set(wantedCards.map((card) => card.id))

    const newCards = selectedCards
      .filter((card) => !existingIds.has(Number.parseInt(card.id)))
      .map((card) => ({
        id: Number.parseInt(card.id),
        name: card.name,
        image_url: card.imageUrl || `/placeholder.svg?height=100&width=70&text=${card.name}`,
      }))

    const totalCards = wantedCards.length + newCards.length
    if (totalCards > 20) {
      toast({
        title: "エラー",
        description: `欲しいカードは最大20枚まで登録できます。（現在: ${wantedCards.length}枚）`,
        variant: "destructive",
      })
      return
    }

    setWantedCards((prev) => [...prev, ...newCards])
    setIsWantedSearchOpen(false)

    if (newCards.length > 0) {
      toast({
        title: "成功",
        description: `${newCards.length}枚のカードを追加しました。`,
      })
    }
  }

  const handleListSelected = async (cardIds: number[]) => {
    if (cardIds.length === 0) {
      setIsListSelectorOpen(false)
      return
    }

    setIsLoadingCards(true)
    try {
      const cardData = await getCardsByIds(cardIds)
      const existingIds = new Set(offeredCards.map((card) => card.id))

      const newCards = cardData
        .filter((card) => !existingIds.has(card.id))
        .map((card) => ({
          id: card.id,
          name: card.name,
          image_url: card.image_url || card.game8_image_url || `/placeholder.svg?height=100&width=70&text=${card.name}`,
        }))

      const totalCards = offeredCards.length + newCards.length
      if (totalCards > 20) {
        toast({
          title: "エラー",
          description: `譲れるカードは最大20枚まで登録できます。（現在: ${offeredCards.length}枚）`,
          variant: "destructive",
        })
        setIsListSelectorOpen(false)
        return
      }

      setOfferedCards((prev) => [...prev, ...newCards])
      setIsListSelectorOpen(false)

      if (newCards.length > 0) {
        toast({
          title: "成功",
          description: `リストから${newCards.length}枚のカードを追加しました。`,
        })
      } else {
        toast({
          title: "情報",
          description: "すべてのカードが既に追加されています。",
        })
      }
    } catch (error) {
      console.error("Error loading cards from list:", error)
      toast({
        title: "エラー",
        description: "カード情報の読み込みに失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCards(false)
    }
  }

  const handleRemoveOfferedCard = (cardId: number) => {
    setOfferedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleRemoveWantedCard = (cardId: number) => {
    setWantedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "エラー",
        description: "タイトルを入力してください。",
        variant: "destructive",
      })
      return
    }

    if (offeredCards.length === 0) {
      toast({
        title: "エラー",
        description: "譲れるカードを最低1枚選択してください。",
        variant: "destructive",
      })
      return
    }

    if (wantedCards.length === 0) {
      toast({
        title: "エラー",
        description: "欲しいカードを最低1枚選択してください。",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createTradePost({
        title: title.trim(),
        description: description.trim(),
        offeredCardIds: offeredCards.map((card) => card.id),
        wantedCardIds: wantedCards.map((card) => card.id),
      })

      if (result.success) {
        toast({
          title: "成功",
          description: "トレード投稿を作成しました。",
        })
        router.push(`/trades/${result.tradePost.id}`)
      } else {
        toast({
          title: "エラー",
          description: result.error || "トレード投稿の作成に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">トレード投稿を作成</h1>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">タイトル</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="トレードのタイトルを入力"
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">説明（任意）</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="トレードの詳細や条件を入力"
                    className="mt-1"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Offered Cards */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-blue-700">譲れるカード</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">あなたが譲ることができるカードを選択してください</p>
                  </div>
                  <Badge variant="secondary">{offeredCards.length}/20枚</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* List Selection Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <List className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">リストから選択</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsListSelectorOpen(true)}
                      disabled={offeredCards.length >= 20 || isSubmitting || isLoadingCards}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      {isLoadingCards ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          読み込み中...
                        </>
                      ) : (
                        <>
                          <List className="h-4 w-4 mr-2" />
                          リストから選択
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-blue-600">
                    事前に作成したカードリストから一括でカードを追加できます。重複は自動的に除去されます。
                  </p>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-slate-700">個別にカードを追加</span>
                  <Button
                    variant="outline"
                    onClick={() => setIsOfferedSearchOpen(true)}
                    disabled={offeredCards.length >= 20 || isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    カードを追加
                  </Button>
                </div>

                {offeredCards.length > 0 ? (
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                    {offeredCards.map((card) => (
                      <div key={card.id} className="relative group">
                        <div className="aspect-[7/10] bg-gray-100 rounded-md overflow-hidden border">
                          <img
                            src={card.image_url || "/placeholder.svg"}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveOfferedCard(card.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-center mt-1 truncate text-slate-600">{card.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                    <p>譲れるカードが選択されていません</p>
                    <p className="text-sm mt-1">上記のボタンからカードを追加してください</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wanted Cards */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-green-700">欲しいカード</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">あなたが欲しいカードを選択してください</p>
                  </div>
                  <Badge variant="secondary">{wantedCards.length}/20枚</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-slate-700">カードを選択</span>
                  <Button
                    variant="outline"
                    onClick={() => setIsWantedSearchOpen(true)}
                    disabled={wantedCards.length >= 20 || isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    カードを追加
                  </Button>
                </div>

                {wantedCards.length > 0 ? (
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                    {wantedCards.map((card) => (
                      <div key={card.id} className="relative group">
                        <div className="aspect-[7/10] bg-gray-100 rounded-md overflow-hidden border">
                          <img
                            src={card.image_url || "/placeholder.svg"}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveWantedCard(card.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-center mt-1 truncate text-slate-600">{card.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                    <p>欲しいカードが選択されていません</p>
                    <p className="text-sm mt-1">「カードを追加」ボタンから追加してください</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || offeredCards.length === 0 || wantedCards.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    作成中...
                  </>
                ) : (
                  "トレード投稿を作成"
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Modals */}
      <DetailedSearchModal
        isOpen={isOfferedSearchOpen}
        onOpenChange={setIsOfferedSearchOpen}
        onSelectionComplete={handleAddOfferedCards}
        modalTitle="譲れるカードを選択"
        allowMultipleSelection={true}
      />

      <DetailedSearchModal
        isOpen={isWantedSearchOpen}
        onOpenChange={setIsWantedSearchOpen}
        onSelectionComplete={handleAddWantedCards}
        modalTitle="欲しいカードを選択"
        allowMultipleSelection={true}
      />

      <ListSelectorModal
        isOpen={isListSelectorOpen}
        onClose={() => setIsListSelectorOpen(false)}
        onSelect={handleListSelected}
        userId={user.id}
      />
    </div>
  )
}
