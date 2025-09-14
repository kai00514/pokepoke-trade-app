"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Check } from "lucide-react"
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

  const handleCardSelect = (card: any) => {
    setSelectedCards((prev) => {
      const exists = prev.find((c) => c.id === card.id)
      if (exists) {
        return prev.filter((c) => c.id !== card.id)
      } else {
        return [...prev, card]
      }
    })
  }

  const handleCreateList = async () => {
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
        description: "少なくとも1枚のカードを選択してください",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const cardIds = selectedCards.map((card) => card.id)
      const result = await createTradeOwnedList(userId, listName.trim(), cardIds)

      if (result.success) {
        toast({
          title: "成功",
          description: "リストが作成されました",
        })
        router.push("/lists")
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

        {/* Main Content */}
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
                className="w-full"
              />
            </div>

            {/* Card Search */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>カード選択</Label>
                <Button onClick={() => setIsSearchModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  カードを検索
                </Button>
              </div>

              {/* Selected Cards */}
              {selectedCards.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{selectedCards.length}枚のカードが選択されています</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {selectedCards.map((card) => (
                      <div key={card.id} className="relative">
                        <CardDisplay cardId={card.id.toString()} />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => handleCardSelect(card)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>カードが選択されていません</p>
                  <p className="text-sm">「カードを検索」ボタンからカードを選択してください</p>
                </div>
              )}
            </div>

            {/* Create Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleCreateList}
                disabled={isCreating || !listName.trim() || selectedCards.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-4 w-4 mr-2" />
                {isCreating ? "作成中..." : "リストを作成"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Modal */}
        <DetailedSearchModal
          isOpen={isSearchModalOpen}
          onOpenChange={setIsSearchModalOpen}
          onCardSelect={handleCardSelect}
          selectedCards={selectedCards}
        />
      </div>
    </div>
  )
}
