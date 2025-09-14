"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { createTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import DetailedSearchModal from "@/components/detailed-search-modal"

export default function CreateListPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [listName, setListName] = useState("")
  const [selectedCards, setSelectedCards] = useState<number[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCardSelect = (cardId: number) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter((id) => id !== cardId))
    } else if (selectedCards.length < 35) {
      setSelectedCards([...selectedCards, cardId])
    } else {
      toast({
        title: "制限に達しました",
        description: "1つのリストには最大35枚までのカードを登録できます。",
        variant: "destructive",
      })
    }
  }

  const handleCreateList = async () => {
    if (!listName.trim()) {
      toast({
        title: "エラー",
        description: "リスト名を入力してください。",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const result = await createTradeOwnedList(user.id, listName.trim())

      if (result.success) {
        toast({
          title: "成功",
          description: "新しいリストを作成しました。",
        })
        router.push("/lists")
      } else {
        toast({
          title: "エラー",
          description: result.error || "リストの作成に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating list:", error)
      toast({
        title: "エラー",
        description: "リストの作成に失敗しました。",
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Title Input */}
          <div className="mb-6">
            <Label htmlFor="listName" className="text-base font-medium text-gray-900 mb-2 block">
              リスト名
            </Label>
            <Input
              id="listName"
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="リスト名を入力してください"
              className="w-full"
              maxLength={50}
            />
          </div>

          {/* Card Search */}
          <div className="mb-8">
            <Button onClick={() => setIsSearchModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Search className="h-4 w-4 mr-2" />
              カードを検索
            </Button>
            {selectedCards.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">{selectedCards.length}枚のカードが選択されています</p>
            )}
          </div>

          {/* Complete Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleCreateList}
              disabled={!listName.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {isCreating ? "作成中..." : "選択完了"}
            </Button>
          </div>
        </div>

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
