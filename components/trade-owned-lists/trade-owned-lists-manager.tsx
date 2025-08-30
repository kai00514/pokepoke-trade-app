"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Calendar, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createTradeOwnedList, deleteTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import ListEditorModal from "./list-editor-modal"
import CreateListModal from "./create-list-modal"
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

interface TradeOwnedListsManagerProps {
  initialLists: TradeOwnedList[]
  userId: string
}

export default function TradeOwnedListsManager({ initialLists, userId }: TradeOwnedListsManagerProps) {
  const [lists, setLists] = useState<TradeOwnedList[]>(initialLists)
  const [editingList, setEditingList] = useState<TradeOwnedList | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deletingListId, setDeletingListId] = useState<number | null>(null)
  const { toast } = useToast()

  const handleCreateList = async (listName: string) => {
    const result = await createTradeOwnedList(userId, listName)

    if (result.success) {
      setLists((prev) => [result.list, ...prev])
      setIsCreateModalOpen(false)
      toast({
        title: "成功",
        description: "新しいリストを作成しました。",
      })
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleEditList = (list: TradeOwnedList) => {
    setEditingList(list)
  }

  const handleSaveList = (updatedList: TradeOwnedList) => {
    setLists((prev) => prev.map((list) => (list.id === updatedList.id ? updatedList : list)))
    setEditingList(null)
    toast({
      title: "成功",
      description: "リストを更新しました。",
    })
  }

  const handleDeleteList = async (listId: number) => {
    const result = await deleteTradeOwnedList(listId, userId)

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
    setDeletingListId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">譲れるカードリスト</h1>
            <p className="text-gray-600 mt-2">トレードで譲れるカードのリストを管理できます</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
            <Plus className="h-4 w-4 mr-2" />
            新しいリストを作成
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-[#3B82F6]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総リスト数</p>
                  <p className="text-2xl font-bold text-gray-900">{lists.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-[#10B981]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総カード数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {lists.reduce((total, list) => total + (list.card_ids?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Edit className="h-8 w-8 text-[#F59E0B]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">最終更新</p>
                  <p className="text-sm font-bold text-gray-900">
                    {lists.length > 0 ? formatDate(lists[0].updated_at) : "なし"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lists */}
        {lists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <Card key={list.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">{list.list_name}</CardTitle>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      {list.card_ids?.length || 0}枚
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>更新: {formatDate(list.updated_at)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditList(list)} className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        編集
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>リストを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              「{list.list_name}」を削除します。この操作は取り消せません。
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
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">リストがありません</h3>
              <p className="text-gray-600 mb-6">最初のリストを作成して、譲れるカードを管理しましょう</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
                <Plus className="h-4 w-4 mr-2" />
                新しいリストを作成
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <CreateListModal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} onCreateList={handleCreateList} />

      {editingList && (
        <ListEditorModal
          isOpen={true}
          onOpenChange={(open) => !open && setEditingList(null)}
          list={editingList}
          userId={userId}
          onSave={handleSaveList}
        />
      )}
    </>
  )
}
