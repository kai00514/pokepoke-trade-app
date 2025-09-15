"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { getTradeOwnedLists, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ListsPage() {
  const [user, setUser] = useState<any>(null)
  const [lists, setLists] = useState<TradeOwnedList[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
  }

  // 新しいリスト作成ボタンのクリック
  const handleCreateNewList = () => {
    // 新しいリスト作成ページに遷移
    router.push("/lists/create")
  }

  // カードクリック時の詳細ページ遷移
  const handleCardClick = (listId: number) => {
    router.push(`/lists/${listId}`)
  }

  // 未認証ユーザー
  if (!user && !isLoading) {
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
              <LoginPromptModal message="カードリストを作成・管理するにはログインが必要です。" />
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
            <div className="flex flex-col space-y-4 mb-8 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <h1 className="text-2xl font-bold text-gray-900">カードリスト</h1>
              <Button
                onClick={handleCreateNewList}
                disabled={lists.length >= 10}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
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
                  <div
                    key={list.id}
                    onClick={() => handleCardClick(list.id)}
                    className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                          {list.list_name || "無題のリスト"}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{list.description || "説明なし"}</p>
                      </div>
                      <div className="ml-3 p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg
                            className="h-4 w-4 mr-1 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9H5a1 1 0 110-2h3z"
                            />
                          </svg>
                          <span className="font-medium text-blue-600">
                            {list.card_ids ? list.card_ids.length : 0}枚
                          </span>
                        </div>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 110 2h-1v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9H5a1 1 0 110-2h3z"
                            />
                          </svg>
                          <span>{new Date(list.updated_at || list.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
                        <span className="text-sm font-medium mr-1">詳細</span>
                        <svg
                          className="h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-200 p-12">
                  <div className="text-blue-300 mb-6">
                    <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">リストがありません</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    最初のカードリストを作成して、トレードで譲れるカードを管理しましょう。
                  </p>
                  <Button
                    onClick={handleCreateNewList}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    新しいリストを作成
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
