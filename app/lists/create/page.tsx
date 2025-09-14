"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { createTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import DetailedSearchModal from "@/components/detailed-search-modal"
import CardDisplay from "@/components/card-display"

export default function CreateListPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<any[]>([])
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

  const handleCardSelection = (cards: any[]) => {
    setSelectedCards(cards)
    setIsSearchModalOpen(false)
  }

  const handleCreateList = async () => {
    if (!userId) return

    if (!listName.trim()) {
      toast({
        title: "エラー",
        description: "リスト名を入力してください",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await createTradeOwnedList(userId, listName.trim())

      if (result.success && result.list) {
        // カードが選択されている場合は、リストを更新
        if (selectedCards.length > 0) {
          const { updateTradeOwnedList } = await import("@/lib/actions/trade-owned-lists")
          const cardIds = selectedCards.map((card) => Number.parseInt(card.id))
          const updateResult = await updateTradeOwnedList(result.list.id, userId, listName.trim(), cardIds)

          if (updateResult.success) {
            toast({
              title: "成功",
              description: "リストを作成しました",
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
            title: "成功",
            description: "リストを作成しました",
          })
          router.push("/lists")
        }
      } else {
        toast({
          title: "エラー",
          description: result.error || "リストの作成に失敗しました",
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

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/lists")}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">新しいリストを作成</h1>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>リスト作成</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* List Name Input */}
            <div className="space-y-2">
              <Label htmlFor="listName">リスト名</Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="リスト名を入力してください"
              />
            </div>

            {/* Card Search Button */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>カード選択</Label>
                <Button
                  onClick={() => setIsSearchModalOpen(true)}
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Search className="h-4 w-4 mr-2" />
                  カード詳細検索
                </Button>
              </div>

              {/* Selected Cards Display */}
              {selectedCards.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{selectedCards.length}枚のカードが選択されています</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-60 overflow-y-auto">
                    {selectedCards.map((card, index) => (
                      <div key={`${card.id}-${index}`} className="aspect-[5/7]">
                        <CardDisplay
                          cardId={card.id}
                          width={80}
                          height={112}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Create Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleCreateList}
                disabled={isCreating || !listName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
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
          initialSelectedCards={selectedCards}
          modalTitle="カード詳細検索"
        />
      </div>
    </div>
  )
}
