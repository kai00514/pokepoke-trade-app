"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Calendar, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import ListEditorModal from "@/components/trade-owned-lists/list-editor-modal"
import { deleteTradeOwnedList } from "@/lib/actions/trade-owned-lists"

interface TradeOwnedList {
  id: number
  list_name: string
  card_ids: number[]
  user_id: string
  created_at: string
  updated_at: string
}

export default function ListsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [lists, setLists] = useState<TradeOwnedList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingList, setEditingList] = useState<TradeOwnedList | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchLists()
  }, [user, loading, router])

  const fetchLists = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("Fetching lists for user:", user.id)

      const { data: lists, error } = await supabase
        .from("trade_owned_list")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error fetching lists:", error)
        setError("リストの読み込みに失敗しました。再試行してください。")
        return
      }

      console.log("Fetched lists:", lists)
      setLists(lists || [])
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("予期しないエラーが発生しました。")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateList = () => {
    console.log("Creating new list")
    setEditingList(null)
    setIsEditorOpen(true)
  }

  const handleEditList = (list: TradeOwnedList) => {
    console.log("Editing list:", list)
    setEditingList(list)
    setIsEditorOpen(true)
  }

  const handleDeleteList = async (listId: number) => {
    if (!confirm("このリストを削除しますか？")) return

    try {
      const result = await deleteTradeOwnedList(listId)
      if (result.success) {
        toast({
          title: "削除完了",
          description: "リストを削除しました。",
        })
        fetchLists()
      } else {
        toast({
          title: "削除エラー",
          description: result.error || "リストの削除に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  const handleListSaved = () => {
    console.log("List saved, refreshing...")
    setIsEditorOpen(false)
    setEditingList(null)
    fetchLists()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">譲れるカードリスト</h1>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchLists}>再試行</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">譲れるカードリスト</h1>
            <Button onClick={handleCreateList} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              新しいリストを作成
            </Button>
          </div>

          {lists.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">リストがありません</h3>
                <p className="text-slate-500 mb-4">
                  譲れるカードのリストを作成して、トレード投稿で簡単に選択できるようにしましょう。
                </p>
                <Button onClick={handleCreateList} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  最初のリストを作成
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lists.map((list) => (
                <Card key={list.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-slate-800 truncate">{list.list_name}</CardTitle>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditList(list)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteList(list.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(list.updated_at)}
                      </div>
                      <Badge variant="secondary">{list.card_ids ? list.card_ids.length : 0}枚</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {isEditorOpen && (
        <ListEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleListSaved}
          editingList={editingList}
          userId={user.id}
        />
      )}
    </div>
  )
}
