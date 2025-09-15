"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, X, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { createTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { DetailedSearchModal } from "@/components/detailed-search-modal"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Card {
  id: string
  name: string
  imageUrl: string
  packName?: string
  type?: string
  rarity?: string
}

export default function CreateListPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [listName, setListName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  // ユーザー認証状態を確認
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) {
        console.error("認証エラー:", error)
        router.push("/auth/login")
        return
      }
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
      setIsLoading(false)
    }

    checkUser()
  }, [router])

  // カード選択処理
  const handleCardSelect = (cards: Card[]) => {
    setSelectedCards(cards)
    setIsSearchModalOpen(false)
  }

  // カード削除処理
  const handleRemoveCard = (cardId: string) => {
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId))
  }

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!listName.trim()) {
      toast({
        title: "エラー",
        description: "リスト名を入力してください",
        variant: "destructive",
      })
      return
    }

    if (selectedCards.length === 0) {
      toast({
        title: "エラー",
        description: "少なくとも1枚のカードを選択してください",
        variant: "destructive",
      })
      return
    }

    if (selectedCards.length > 35) {
      toast({
        title: "エラー",
        description: "カードは最大35枚まで選択できます",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const cardIds = selectedCards.map((card) => Number.parseInt(card.id))

      const result = await createTradeOwnedList({
        userId: user.id,
        listName: listName.trim(),
        description: description.trim(),
        cardIds,
      })

      if (result.success) {
        // 成功ポップアップを表示
        setShowSuccessPopup(true)

        // 3秒後にポップアップを非表示にしてリダイレクト
        setTimeout(() => {
          setShowSuccessPopup(false)
          router.push("/lists")
        }, 3000)
      } else {
        toast({
          title: "エラー",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("リスト作成エラー:", error)
      toast({
        title: "エラー",
        description: "リストの作成に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* 戻るボタン */}
        <div className="mb-6">
          <Link href="/lists" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            リスト一覧に戻る
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">新しいカードリストを作成</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* リスト名 */}
              <div className="space-y-2">
                <Label htmlFor="listName" className="text-sm font-medium text-gray-700">
                  リスト名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="listName"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="例: 交換用レアカード"
                  maxLength={50}
                  className="bg-white"
                />
              </div>

              {/* 説明 */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  説明（任意）
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="このリストについての説明を入力してください"
                  maxLength={200}
                  rows={3}
                  className="bg-white"
                />
              </div>

              {/* カード選択 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    カード選択 <span className="text-red-500">*</span>
                    <span className="text-gray-500 text-xs ml-2">({selectedCards.length}/35枚)</span>
                  </Label>
                  <Button
                    type="button"
                    onClick={() => setIsSearchModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    カードを検索
                  </Button>
                </div>

                {/* 選択されたカード一覧 */}
                {selectedCards.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {selectedCards.map((card) => (
                      <div key={card.id} className="relative group">
                        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="aspect-[3/4] mb-2">
                            <img
                              src={card.imageUrl || "/placeholder.svg"}
                              alt={card.name}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <p className="text-xs text-gray-900 font-medium truncate">{card.name}</p>
                          {card.packName && <p className="text-xs text-gray-500 truncate">{card.packName}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCard(card.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <Plus className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 mb-4">カードが選択されていません</p>
                    <Button
                      type="button"
                      onClick={() => setIsSearchModalOpen(true)}
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      カードを検索して追加
                    </Button>
                  </div>
                )}
              </div>

              {/* 送信ボタン */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/lists">
                  <Button type="button" variant="outline" className="px-8 bg-transparent">
                    キャンセル
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedCards.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {isSubmitting ? "作成中..." : "リストを作成"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* カード検索モーダル */}
        {isSearchModalOpen && (
          <DetailedSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            onCardSelect={handleCardSelect}
            selectedCards={selectedCards}
            maxSelection={35}
          />
        )}

        {/* 成功ポップアップ */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-8 max-w-md mx-4 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">リストを作成しました！</h3>
                <p className="text-gray-600 mb-4">
                  「{listName}」が正常に作成されました。
                  <br />
                  リスト一覧ページに移動します...
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
