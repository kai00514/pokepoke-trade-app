"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { getTradeOwnedLists, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import ListCreationModal from "@/components/trade-owned-lists/list-creation-modal"
import ListCard from "@/components/trade-owned-lists/list-card"
import LoginPrompt from "@/components/login-prompt"

export default function ListsPage() {
  const [user, setUser] = useState<any>(null)
  const [lists, setLists] = useState<TradeOwnedList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // ユーザー認証状態を確認
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) {
        console.error("認証エラー:", error)
        setIsLoading(false)
        return
      }
      setUser(user)

      if (user) {
        await fetchLists(user.id)
      }
      setIsLoading(false)
    }

    checkUser()
  }, [])

  // リスト一覧を取得
  const fetchLists = async (userId: string) => {
    setIsLoading(true)
    const result = await getTradeOwnedLists(userId)

    if (result.success) {
      setLists(result.lists)
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  // リスト作成成功時のコールバック
  const handleListCreated = (newList: TradeOwnedList) => {
    setLists((prev) => [newList, ...prev])
    setIsCreationModalOpen(false)
    toast({
      title: "成功",
      description: "新しいリストを作成しました。",
    })
  }

  // リスト更新時のコールバック
  const handleListUpdated = (updatedList: TradeOwnedList) => {
    setLists((prev) => prev.map((list) => (list.id === updatedList.id ? updatedList : list)))
    toast({
      title: "成功",
      description: "リストを更新しました。",
    })
  }

  // リスト削除時のコールバック
  const handleListDeleted = (deletedListId: number) => {
    setLists((prev) => prev.filter((list) => list.id !== deletedListId))
    toast({
      title: "成功",
      description: "リストを削除しました。",
    })
  }

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  // 未認証ユーザー
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">カードリスト</h1>
          <LoginPrompt message="カードリストを作成・管理するにはログインが必要です。" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">カードリスト</h1>
          <Button
            onClick={() => setIsCreationModalOpen(true)}
            disabled={lists.length >= 10}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            新しいリストを作成
          </Button>
        </div>

        {/* リスト上限の警告 */}
        {lists.length >= 10 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              リストは最大10個まで作成できます。新しいリストを作成するには、既存のリストを削除してください。
            </p>
          </div>
        )}

        {/* リスト一覧 */}
        {lists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                userId={user.id}
                onUpdate={handleListUpdated}
                onDelete={handleListDeleted}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-gray-400 mb-4">
                <Plus className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">リストがありません</h3>
              <p className="text-gray-500 mb-6">最初のカードリストを作成してみましょう。</p>
              <Button onClick={() => setIsCreationModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                新しいリストを作成
              </Button>
            </div>
          </div>
        )}

        {/* リスト作成モーダル */}
        <ListCreationModal
          isOpen={isCreationModalOpen}
          onOpenChange={setIsCreationModalOpen}
          userId={user.id}
          onSuccess={handleListCreated}
        />
      </div>
    </div>
  )
}
