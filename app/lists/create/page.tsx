"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createTradeOwnedList, updateTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { createClient } from "@/lib/supabase/client"
import DetailedSearchModal, { type Card as CardType } from "@/components/detailed-search-modal"

export default function CreateListPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<CardType[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        router.push("/auth/login")
      }
    }
    getUser()
  }, [router])

  const handleCardSelection = (cards: CardType[]) => {
    setSelectedCards(cards)
    setIsSearchModalOpen(false)
  }

  const handleComplete = async () => {
    if (!userId) {
      toast({
        title: "エラー",
        description: "ログインが必要です",
        variant: "destructive",
      })
      return
    }

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
        description: "カードを選択してください",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      // まずリストを作成
      const createResult = await createTradeOwnedList(userId, listName.trim())

      if (createResult.success && createResult.list) {
        // カードIDを追加
        const cardIds = selectedCards.map((card) => Number.parseInt(card.id))
        const updateResult = await updateTradeOwnedList(createResult.list.id, userId, listName.trim(), cardIds)

        if (updateResult.success) {
          toast({
            title: "成功",
            description: "リストが作成されました",
          })
          router.push("/lists")
        } else {
          toast({
            title: "エラー",
            description: updateResult.error || "カードの追加に失敗しました",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "エラー",
          description: createResult.error || "リストの作成に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating list:", error)
      toast({
        title: "エラー",
        description: "リストの作成に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">新しいリストを作成</h1>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="listName">リスト名</Label>
                <Input
                  id="listName"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="リスト名を入力してください"
                  className="w-full"
                />
              </div>

              {/* Card Search */}
              <div className="space-y-2">
                <Label>カード選択</Label>
                <Button
                  variant="outline"
                  onClick={() => setIsSearchModalOpen(true)}
                  className="w-full justify-start text-left"
                >
                  <Search className="h-4 w-4 mr-2" />
                  カードを検索して追加
                </Button>
                {selectedCards.length > 0 && (
                  <p className="text-sm text-gray-600">{selectedCards.length}枚のカードが選択されています</p>
                )}
              </div>

              {/* Complete Button */}
              <Button
                onClick={handleComplete}
                disabled={isCreating || !listName.trim() || selectedCards.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? "作成中..." : "選択完了"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Modal */}
        <DetailedSearchModal
          isOpen={isSearchModalOpen}
          onOpenChange={setIsSearchModalOpen}
          onSelectionComplete={handleCardSelection}
          modalTitle="カード検索"
          initialSelectedCards={selectedCards}
        />
      </div>
    </div>
  )
}
