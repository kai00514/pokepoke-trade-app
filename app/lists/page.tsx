"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Noto_Sans_JP } from "next/font/google"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PlusCircle, Edit, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import ListEditorModal from "@/components/trade-owned-lists/list-editor-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  getTradeOwnedLists,
  createTradeOwnedList,
  deleteTradeOwnedList,
  type TradeOwnedList,
} from "@/lib/actions/trade-owned-lists"

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

export default function ListsPage() {
  const [lists, setLists] = useState<TradeOwnedList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingList, setEditingList] = useState<TradeOwnedList | null>(null)
  const [newListName, setNewListName] = useState("")
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  // リスト取得
  useEffect(() => {
    const fetchLists = async () => {
      if (!user?.id) {
        router.push("/")
        return
      }

      setIsLoading(true)
      const result = await getTradeOwnedLists(user.id)

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

    fetchLists()
  }, [user, router, toast])

  const handleCreateList = async () => {
    if (!user?.id) return

    if (!newListName.trim()) {
      toast({
        title: "エラー",
        description: "リスト名を入力してください。",
        variant: "destructive",
      })
      return
    }

    // 重複チェック
    const isDuplicate = lists.some((list) => list.list_name === newListName.trim())
    if (isDuplicate) {
      setDuplicateWarning(newListName.trim())
      return
    }

    // 上限チェック
    if (lists.length >= 10) {
      toast({
        title: "エラー",
        description: "リストは最大10個まで作成できます。",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    const result = await createTradeOwnedList(user.id, newListName.trim())

    if (result.success) {
      setLists((prev) => [result.list, ...prev])
      setNewListName("")
      setIsCreateModalOpen(false)
      toast({
        title: "成功",
        description: "リストを作成しました。",
      })
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsCreating(false)
  }

  const handleCreateWithDuplicate = async () => {
    if (!duplicateWarning || !user?.id) return

    setIsCreating(true)
    const result = await createTradeOwnedList(user.id, duplicateWarning)

    if (result.success) {
      setLists((prev) => [result.list, ...prev])
      setNewListName("")
      setDuplicateWarning(null)
      setIsCreateModalOpen(false)
      toast({
        title: "成功",
        description: "リストを作成しました。",
      })
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsCreating(false)
  }

  const handleEditList = (list: TradeOwnedList) => {
    setEditingList(list)
    setIsEditModalOpen(true)
  }

  const handleDeleteList = async (listId: number) => {
    if (!user?.id) return

    const result = await deleteTradeOwnedList(listId, user.id)

    if (result.success) {
      setLists((prev) => prev.filter((list) => list.id !== listId))
      toast({
        title: "成功",
        description: "リストを削除しました。",
      })
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 認証チェック
  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col ${notoSansJP.className}`}>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-[#6B7280] mb-4">ログインが必要です</p>
            <Button onClick={() => router.push("/")} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              ホームに戻る
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col ${notoSansJP.className}`}>
      <Header />

      <div className="flex-1 w-full bg-gradient-to-b from-[#DBEAFE] to-white">
        <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="text-[#6B7280] hover:text-[#111827]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <h1 className="text-2xl font-bold text-[#111827]">カードリスト管理</h1>
          </div>

          {/* Callout */}
          <Alert className="mb-6 border-[#3B82F6] bg-[#EFF6FF]">
            <Info className="h-4 w-4 text-[#3B82F6]" />
            <AlertDescription className="text-[#1E40AF]">
              <strong>スムーズなトレード体験</strong>
              <br />
              よく使うカードをリスト保存し、トレード作成や参加時に譲渡・希望カードを選べます。
              <br />
              <span className="text-sm text-[#6B7280]">
                <br />
                ※最大10リスト作成可能
                <br />
              </span>
              <span className="text-sm text-[#6B7280]">※1リスト最大35枚まで登録可能</span>
            </AlertDescription>
          </Alert>

          {/* Create Button */}
          <div className="mb-6">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                  disabled={lists.length >= 10}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  新しいリストを作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新しいリストを作成</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#374151]">リスト名</label>
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="例: ♢3用カード"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateModalOpen(false)
                        setNewListName("")
                        setDuplicateWarning(null)
                      }}
                      disabled={isCreating}
                    >
                      キャンセル
                    </Button>
                    <Button onClick={handleCreateList} disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          作成中...
                        </>
                      ) : (
                        "作成"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {lists.length >= 10 && (
              <p className="text-sm text-[#6B7280] mt-2">リストは最大10個まで作成できます。（{lists.length}/10）</p>
            )}
          </div>

          {/* Duplicate Warning Dialog */}
          {duplicateWarning && (
            <AlertDialog open={!!duplicateWarning} onOpenChange={() => setDuplicateWarning(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>重複するリスト名</AlertDialogTitle>
                  <AlertDialogDescription>
                    「{duplicateWarning}」という名前のリストが既に存在します。 同じ名前で作成を続行しますか？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDuplicateWarning(null)}>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCreateWithDuplicate}>続行</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Lists */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#3B82F6]" />
            </div>
          ) : lists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lists.map((list) => (
                <Card key={list.id} className="border border-[#E5E7EB] hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-[#111827]">{list.list_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-[#6B7280]">
                        <p>カード数: {list.card_ids.length}/35枚</p>
                        <p>更新日時: {formatDate(list.updated_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditList(list)} className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          編集
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>リストを削除</AlertDialogTitle>
                              <AlertDialogDescription>
                                「{list.list_name}」を削除しますか？この操作は取り消せません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteList(list.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-[#6B7280]">
              <p className="text-lg mb-4">まだリストが作成されていません</p>
              <p className="text-sm">「新しいリストを作成」ボタンから始めましょう</p>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Edit Modal */}
      {editingList && user && (
        <ListEditorModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          list={editingList}
          userId={user.id}
          onSave={(updatedList) => {
            setLists((prev) => prev.map((list) => (list.id === updatedList.id ? updatedList : list)))
            setIsEditModalOpen(false)
            setEditingList(null)
            toast({
              title: "成功",
              description: "リストを更新しました。",
            })
          }}
        />
      )}
    </div>
  )
}
