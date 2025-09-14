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
import Link from "next/link"

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
      <div className="min-h-screen bg-blue-50">
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
      <div className="min-h-screen bg-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* 戻るボタン */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              タイムラインに戻る
            </Link>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">カードリスト</h1>
              <LoginPrompt message="カードリストを作成・管理するにはログインが必要です。" />
            </div>
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
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            タイムラインに戻る
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* メインコンテンツ */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
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

            {/* 説明文をコールアウトで表示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    カードリストを作成して、トレードで譲れるカードを管理しましょう。最大10個のリストを作成でき、各リストには35枚までのカードを登録できます。
                  </p>
                </div>
              </div>
            </div>

            {/* リスト上限の警告 */}
            {lists.length >= 10 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      リストは最大10個まで作成できます。新しいリストを作成するには、既存のリストを削除してください。
                    </p>
                  </div>
                </div>
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
                <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8">
                  <div className="text-gray-400 mb-4">
                    <Plus className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">リストがありません</h3>
                  <p className="text-gray-500 mb-6">最初のカードリストを作成してみましょう。</p>
                  <Button
                    onClick={() => setIsCreationModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新しいリストを作成
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

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
