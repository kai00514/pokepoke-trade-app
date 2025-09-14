"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { getTradeOwnedLists, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import ListCreationModal from "@/components/trade-owned-lists/list-creation-modal"
import ListCard from "@/components/trade-owned-lists/list-card"
import LoginPrompt from "@/components/login-prompt"
import { useRouter } from "next/navigation"
import { Package } from "lucide-react"
import Header from "@/components/layout/header"

export default function ListsPage() {
  const [user, setUser] = useState<any>(null)
  const [lists, setLists] = useState<TradeOwnedList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">カードリスト</h1>
          <LoginPrompt message="カードリストを作成・管理するにはログインが必要です。" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 hover:bg-white/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">カードリスト</h1>
              <p className="text-gray-700">トレード用のカードリストを作成・管理できます（最大10リスト、各35枚まで）</p>
            </div>
            <Button
              onClick={() => setIsCreationModalOpen(true)}
              disabled={lists.length >= 10}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              新しいリストを作成
            </Button>
          </div>
        </div>

        {/* リスト上限の警告 */}
        {lists.length >= 10 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">リスト上限に達しました</h3>
                <p className="text-yellow-700 text-sm">
                  リストは最大10個まで作成できます。新しいリストを作成するには、既存のリストを削除してください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* リスト一覧 */}
        {lists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-12 max-w-md mx-auto">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Plus className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">リストがありません</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                最初のカードリストを作成して、
                <br />
                トレードの準備を始めましょう。
              </p>
              <Button
                onClick={() => setIsCreationModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
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
