"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Calendar } from "lucide-react"
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
import { ListEditorModal } from "@/components/trade-owned-lists/list-editor-modal"
import { deleteOwnedList } from "@/lib/actions/trade-owned-lists"
import { toast } from "@/hooks/use-toast"

interface OwnedList {
  id: number
  list_name: string
  card_ids: number[]
  created_at: string
  updated_at: string
}

interface ListCardProps {
  list: OwnedList
  onDeleted: () => void
}

export function ListCard({ list, onDeleted }: ListCardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteOwnedList(list.id)
      toast({
        title: "成功",
        description: "リストが削除されました。",
      })
      onDeleted()
    } catch (error) {
      console.error("Error deleting list:", error)
      toast({
        title: "エラー",
        description: "リストの削除に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdited = () => {
    setIsEditorOpen(false)
    onDeleted() // リストを再読み込み
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg line-clamp-2">{list.list_name}</h3>
              <div className="flex gap-1 ml-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(true)} className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? "削除中..." : "削除"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>更新: {formatDate(list.updated_at)}</span>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-sm">
                {list.card_ids.length}枚のカード
              </Badge>
              {list.card_ids.length >= 35 && (
                <Badge variant="outline" className="text-xs">
                  上限達成
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ListEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onEdited={handleEdited}
        listId={list.id}
        initialListName={list.list_name}
        initialCardIds={list.card_ids}
      />
    </>
  )
}
