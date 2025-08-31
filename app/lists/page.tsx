"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Header } from "@/components/header"
import { LoginPrompt } from "@/components/login-prompt"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ListCreationModal } from "@/components/trade-owned-lists/list-creation-modal"
import { ListCard } from "@/components/trade-owned-lists/list-card"
import { getUserOwnedLists } from "@/lib/actions/trade-owned-lists"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface OwnedList {
  id: number
  list_name: string
  card_ids: number[]
  created_at: string
  updated_at: string
}

export default function ListsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lists, setLists] = useState<OwnedList[]>([])
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [supabase.auth])

  useEffect(() => {
    if (user) {
      loadLists()
    }
  }, [user])

  const loadLists = async () => {
    if (!user) return

    try {
      const userLists = await getUserOwnedLists(user.id)
      setLists(userLists)
    } catch (error) {
      console.error("Error loading lists:", error)
    }
  }

  const handleListCreated = () => {
    loadLists()
    setIsCreationModalOpen(false)
  }

  const handleListDeleted = () => {
    loadLists()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoginPrompt
            title="カードリストを管理するにはログインが必要です"
            description="ログインして、あなたの譲れるカードリストを作成・管理しましょう。"
          />
        </div>
      </div>
    )
  }

  const canCreateNewList = lists.length < 10

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">カードリスト</h1>
            <Button
              onClick={() => setIsCreationModalOpen(true)}
              disabled={!canCreateNewList}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              新しいリストを作成
            </Button>
          </div>

          {!canCreateNewList && (
            <Alert>
              <AlertDescription>
                リストは最大10個まで作成できます。新しいリストを作成するには、既存のリストを削除してください。
              </AlertDescription>
            </Alert>
          )}

          {lists.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">まだリストがありません</p>
                <p className="text-sm">「新しいリストを作成」ボタンから最初のリストを作成しましょう</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} onDeleted={handleListDeleted} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ListCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onCreated={handleListCreated}
      />
    </div>
  )
}
