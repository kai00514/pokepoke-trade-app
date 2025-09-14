"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import DetailedSearchModal, { type Card as CardType } from "@/components/detailed-search-modal"
import { createTradeOwnedList, updateTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function CreateListPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<CardType[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
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

    setIsLoading(true)
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
      setIsLoading(false)
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

        {/* Combined Title and Card Selection */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">
            <div>
              <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-2">
                リスト名
              </label>
              <Input
                id="listName"
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="リスト名を入力してください"
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">カード選択</h2>
                <Button onClick={() => setIsSearchModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  カードを検索
                </Button>
              </div>

              {selectedCards.length > 0 && (
                <div className="text-sm text-gray-600 mb-2">{selectedCards.length}枚のカードが選択されています</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Complete Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleComplete}
            disabled={isLoading || !listName.trim() || selectedCards.length === 0}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            size="lg"
          >
            {isLoading ? "作成中..." : "選択完了"}
          </Button>
        </div>
      </div>

      {/* Search Modal */}
      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onSelectionComplete={handleCardSelection}
        modalTitle="カード検索"
        initialSelectedCards={selectedCards}
      />
    </div>
  )
}
