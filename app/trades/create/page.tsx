"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Search, List, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import DetailedSearchModal from "@/components/detailed-search-modal"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import ListSelectorModal from "@/components/trade-owned-lists/list-selector-modal"
import { createTradePost } from "@/lib/actions/trade-actions"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import Image from "next/image"

const MAX_CARDS = 20

export default function CreateTradePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [title, setTitle] = useState("")
  const [wantedCards, setWantedCards] = useState<SelectedCardType[]>([])
  const [offeredCards, setOfferedCards] = useState<SelectedCardType[]>([])
  const [appId, setAppId] = useState("")
  const [comment, setComment] = useState("")
  const [guestName, setGuestName] = useState("")

  // Modal states
  const [isWantedSearchOpen, setIsWantedSearchOpen] = useState(false)
  const [isOfferedSearchOpen, setIsOfferedSearchOpen] = useState(false)
  const [isListSelectorOpen, setIsListSelectorOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      setShowLoginPrompt(true)
    }
  }, [user, loading])

  const handleWantedCardSelection = (selectedCards: SelectedCardType[]) => {
    if (selectedCards.length > 0) {
      setWantedCards([selectedCards[0]]) // 1枚のみ選択
    }
    setIsWantedSearchOpen(false)
  }

  const handleOfferedCardSelection = (selectedCards: SelectedCardType[]) => {
    const newCards = selectedCards.filter(
      (newCard) => !offeredCards.some((existingCard) => existingCard.id === newCard.id),
    )

    if (offeredCards.length + newCards.length > MAX_CARDS) {
      toast({
        title: "選択制限",
        description: `譲れるカードは最大${MAX_CARDS}枚まで選択できます。`,
        variant: "destructive",
      })
      return
    }

    setOfferedCards([...offeredCards, ...newCards])
    setIsOfferedSearchOpen(false)
  }

  const handleListSelection = (listCards: SelectedCardType[]) => {
    const newCards = listCards.filter((newCard) => !offeredCards.some((existingCard) => existingCard.id === newCard.id))

    if (offeredCards.length + newCards.length > MAX_CARDS) {
      const availableSlots = MAX_CARDS - offeredCards.length
      const cardsToAdd = newCards.slice(0, availableSlots)
      setOfferedCards([...offeredCards, ...cardsToAdd])

      toast({
        title: "一部のカードを追加",
        description: `制限により${cardsToAdd.length}枚のカードを追加しました。（${newCards.length - cardsToAdd.length}枚は除外）`,
      })
    } else {
      setOfferedCards([...offeredCards, ...newCards])
      toast({
        title: "リストから追加完了",
        description: `${newCards.length}枚のカードを追加しました。${listCards.length - newCards.length > 0 ? `（${listCards.length - newCards.length}枚は重複のため除外）` : ""}`,
      })
    }

    setIsListSelectorOpen(false)
  }

  const removeWantedCard = (cardId: string) => {
    setWantedCards(wantedCards.filter((card) => card.id !== cardId))
  }

  const removeOfferedCard = (cardId: string) => {
    setOfferedCards(offeredCards.filter((card) => card.id !== cardId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "入力エラー",
        description: "タイトルを入力してください。",
        variant: "destructive",
      })
      return
    }

    if (wantedCards.length === 0 && offeredCards.length === 0) {
      toast({
        title: "入力エラー",
        description: "求めるカードまたは譲れるカードを最低1枚選択してください。",
        variant: "destructive",
      })
      return
    }

    if (!user && !guestName.trim()) {
      toast({
        title: "入力エラー",
        description: "ゲスト名を入力してください。",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createTradePost({
        title: title.trim(),
        wantedCards,
        offeredCards,
        appId: appId.trim() || undefined,
        comment: comment.trim() || undefined,
        guestName: !user ? guestName.trim() : undefined,
        userId: user?.id,
      })

      if (result.success) {
        toast({
          title: "投稿完了",
          description: "トレード投稿を作成しました！",
        })
        router.push("/")
      } else {
        toast({
          title: "投稿エラー",
          description: result.error || "投稿の作成に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinueAsGuest = () => {
    setShowLoginPrompt(false)
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">トレード投稿を作成</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                    タイトル *
                  </label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: ピカチュウVMAXを求めています"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="appId" className="block text-sm font-medium text-slate-700 mb-2">
                    アプリID（任意）
                  </label>
                  <Input
                    id="appId"
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="例: ABCD1234"
                    className="w-full"
                  />
                </div>

                {!user && (
                  <div>
                    <label htmlFor="guestName" className="block text-sm font-medium text-slate-700 mb-2">
                      ゲスト名 *
                    </label>
                    <Input
                      id="guestName"
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="例: ポケモントレーナー"
                      className="w-full"
                      required
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-2">
                    コメント（任意）
                  </label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="トレードに関する詳細や条件があれば記入してください"
                    className="w-full"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Wanted Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-blue-600">求めるカード</span>
                  <Badge variant="secondary" className="ml-2">
                    {wantedCards.length}/1
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsWantedSearchOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    カードを検索して追加
                  </Button>

                  {wantedCards.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {wantedCards.map((card) => (
                        <div key={card.id} className="relative group">
                          <div className="aspect-[3/4] relative bg-slate-100 rounded-lg overflow-hidden">
                            <Image
                              src={card.imageUrl || "/placeholder.svg?width=120&height=160"}
                              alt={card.name}
                              fill
                              className="object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => removeWantedCard(card.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs font-medium text-slate-700 mt-1 text-center truncate">{card.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Offered Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-cyan-600">譲れるカード</span>
                  <Badge variant="secondary" className="ml-2">
                    {offeredCards.length}/{MAX_CARDS}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* List Selection Area */}
                  {user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-blue-900 mb-1">リストから一括追加</h3>
                          <p className="text-sm text-blue-700">
                            事前に作成したカードリストから複数のカードを一度に追加できます
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsListSelectorOpen(true)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100 whitespace-nowrap"
                        >
                          <List className="h-4 w-4 mr-2" />
                          リストを選択
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Individual Card Selection */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOfferedSearchOpen(true)}
                      className="flex-1"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      カードを検索して追加
                    </Button>
                    {!user && (
                      <Button type="button" variant="outline" onClick={() => router.push("/lists")} className="flex-1">
                        <List className="h-4 w-4 mr-2" />
                        リストを作成
                      </Button>
                    )}
                  </div>

                  {offeredCards.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {offeredCards.map((card) => (
                        <div key={card.id} className="relative group">
                          <div className="aspect-[3/4] relative bg-slate-100 rounded-lg overflow-hidden">
                            <Image
                              src={card.imageUrl || "/placeholder.svg?width=120&height=160"}
                              alt={card.name}
                              fill
                              className="object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => removeOfferedCard(card.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs font-medium text-slate-700 mt-1 text-center truncate">{card.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {offeredCards.length >= MAX_CARDS && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">最大{MAX_CARDS}枚まで選択できます</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 px-8">
                {isSubmitting ? "投稿中..." : "投稿する"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />

      {/* Modals */}
      <DetailedSearchModal
        isOpen={isWantedSearchOpen}
        onOpenChange={setIsWantedSearchOpen}
        onSelectionComplete={handleWantedCardSelection}
        modalTitle="求めるカードを選択"
        maxSelection={1}
      />

      <DetailedSearchModal
        isOpen={isOfferedSearchOpen}
        onOpenChange={setIsOfferedSearchOpen}
        onSelectionComplete={handleOfferedCardSelection}
        modalTitle="譲れるカードを選択"
        maxSelection={MAX_CARDS - offeredCards.length}
      />

      {user && (
        <ListSelectorModal
          isOpen={isListSelectorOpen}
          onClose={() => setIsListSelectorOpen(false)}
          onSelectList={handleListSelection}
        />
      )}

      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} onContinueAsGuest={handleContinueAsGuest} />
      )}
    </div>
  )
}
