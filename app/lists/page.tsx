"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, ArrowLeft, Plus, Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getUserOwnedLists, deleteOwnedList } from "@/lib/actions/trade-owned-lists"
import { supabase } from "@/lib/supabase/client"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import ListCard from "@/components/trade-owned-lists/list-card"
import ListCreationModal from "@/components/trade-owned-lists/list-creation-modal"
import ListEditorModal from "@/components/trade-owned-lists/list-editor-modal"

interface OwnedList {
  id: number
  list_name: string
  card_ids: number[]
  created_at: string
  updated_at: string
}

export default function ListsPage() {
  const [lists, setLists] = useState<OwnedList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showCreationModal, setShowCreationModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingList, setEditingList] = useState<OwnedList | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const isAuth = !!data.session
        const userId = data.session?.user?.id || null
        setIsAuthenticated(isAuth)
        setCurrentUserId(userId)

        if (isAuth && userId) {
          await loadLists(userId)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsAuthenticated(false)
        setCurrentUserId(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isAuth = !!session
      const userId = session?.user?.id || null
      setIsAuthenticated(isAuth)
      setCurrentUserId(userId)

      if (isAuth && userId) {
        await loadLists(userId)
      } else {
        setLists([])
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const loadLists = async (userId: string) => {
    try {
      const result = await getUserOwnedLists(userId)
      if (result.success && result.lists) {
        setLists(result.lists)
      } else {
        console.error("Failed to load lists:", result.error)
        toast({
          title: "エラー",
          description: "リストの読み込みに失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading lists:", error)
      toast({
        title: "エラー",
        description: "リストの読み込み中にエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  const handleCreateList = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }

    if (lists.length >= 10) {
      toast({
        title: "リスト上限",
        description: "リストは最大10個まで作成できます。",
        variant: "destructive",
      })
      return
    }

    setShowCreationModal(true)
  }

  const handleEditList = (list: OwnedList) => {
    setEditingList(list)
    setShowEditModal(true)
  }

  const handleDeleteList = async (listId: number) => {
    if (!currentUserId) return

    try {
      const result = await deleteOwnedList(listId, currentUserId)
      if (result.success) {
        setLists((prev) => prev.filter((list) => list.id !== listId))
        toast({
          title: "削除完了",
          description: "リストが削除されました。",
        })
      } else {
        toast({
          title: "削除エラー",
          description: result.error || "リストの削除に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting list:", error)
      toast({
        title: "エラー",
        description: "リストの削除中にエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  const handleListCreated = () => {
    if (currentUserId) {
      loadLists(currentUserId)
    }
    setShowCreationModal(false)
  }

  const handleListUpdated = () => {
    if (currentUserId) {
      loadLists(currentUserId)
    }
    setShowEditModal(false)
    setEditingList(null)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />
            タイムラインに戻る
          </Link>

          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">カードリスト</h1>

            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <InfoIcon className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-700 font-semibold">ログインが必要です</AlertTitle>
              <AlertDescription className="text-blue-600 text-sm">
                カードリストを作成・管理するにはログインが必要です。
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button onClick={() => setShowLoginPrompt(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                ログインする
              </Button>
            </div>
          </div>
        </main>
        <Footer />
        {showLoginPrompt && (
          <LoginPromptModal
            onClose={() => setShowLoginPrompt(false)}
            onContinueAsGuest={() => setShowLoginPrompt(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          タイムラインに戻る
        </Link>

        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">カードリスト</h1>

          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <InfoIcon className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-700 font-semibold">お知らせ</AlertTitle>
            <AlertDescription className="text-blue-600 text-sm">
              ここで作成したリストは、トレード投稿時に「譲れるカード」として簡単に選択できます。
              最大10個のリストを作成でき、各リストには35枚までのカードを登録できます。
            </AlertDescription>
          </Alert>

          {lists.length >= 10 && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-700 font-semibold">リスト上限に達しました</AlertTitle>
              <AlertDescription className="text-amber-600 text-sm">
                リストは最大10個まで作成できます。新しいリストを作成するには、既存のリストを削除してください。
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-6">
            <Button
              onClick={handleCreateList}
              disabled={lists.length >= 10}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
            >
              <Plus className="h-4 w-4 mr-2" />
              新しいリストを作成
            </Button>
          </div>

          {lists.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">リストがありません</h3>
                <p className="text-gray-500 text-sm mb-4">最初のカードリストを作成して、トレードを始めましょう！</p>
                <Button onClick={handleCreateList} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  リストを作成
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  onEdit={() => handleEditList(list)}
                  onDelete={() => handleDeleteList(list.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <ListCreationModal
        isOpen={showCreationModal}
        onOpenChange={setShowCreationModal}
        userId={currentUserId || ""}
        onSuccess={handleListCreated}
      />

      {editingList && (
        <ListEditorModal
          isOpen={showEditModal}
          onOpenChange={setShowEditModal}
          userId={currentUserId || ""}
          listId={editingList.id}
          initialListName={editingList.list_name}
          initialCardIds={editingList.card_ids}
          onSave={handleListUpdated}
        />
      )}

      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          onContinueAsGuest={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  )
}
