"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Package, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { getTradeOwnedLists, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import ListCreationModal from "@/components/trade-owned-lists/list-creation-modal"
import ListCard from "@/components/trade-owned-lists/list-card"
import LoginPrompt from "@/components/login-prompt"
import Header from "@/components/layout/header"

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">リストを読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 未認証ユーザー
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              カードリスト
            </h1>
            <p className="text-gray-600 text-lg">あなたの大切なカードコレクションを管理しましょう</p>
          </div>
          <LoginPrompt message="カードリストを作成・管理するにはログインが必要です。" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダーセクション */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            カードリスト
          </h1>
          <p className="text-gray-600 text-lg mb-8">あなたの大切なカードコレクションを管理しましょう</p>

          <div className="flex justify-center">
            <Button
              onClick={() => setIsCreationModalOpen(true)}
              disabled={lists.length >= 10}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              新しいリストを作成
            </Button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">作成済みリスト</p>
                <p className="text-3xl font-bold text-blue-600">{lists.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総カード数</p>
                <p className="text-3xl font-bold text-purple-600">
                  {lists.reduce((total, list) => total + list.card_ids.length, 0)}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">利用可能枠</p>
                <p className="text-3xl font-bold text-green-600">{10 - lists.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* リスト上限の警告 */}
        {lists.length >= 10 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 rounded-full p-2">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">リスト上限に達しました</h3>
                <p className="text-amber-700 text-sm">
                  リストは最大10個まで作成できます。新しいリストを作成するには、既存のリストを削除してください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* リスト一覧 */}
        {lists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                <Package className="h-12 w-12 text-blue-600 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">リストがありません</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                最初のカードリストを作成して、
                <br />
                あなたのコレクションを整理しましょう
              </p>
              <Button
                onClick={() => setIsCreationModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                最初のリストを作成
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
