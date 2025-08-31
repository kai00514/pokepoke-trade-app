"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { deleteTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import ListEditorModal from "./list-editor-modal"

interface ListCardProps {
  list: TradeOwnedList
  userId: string
  onUpdate: (updatedList: TradeOwnedList) => void
  onDelete: (deletedListId: number) => void
}

export default function ListCard({ list, userId, onUpdate, onDelete }: ListCardProps) {
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  // リスト削除処理
  const handleDelete = async () => {
    setIsDeleting(true)

    const result = await deleteTradeOwnedList(list.id, userId)

    setIsDeleting(false)
    setIsDeleteDialogOpen(false)

    if (result.success) {
      onDelete(list.id)
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  // カード枚数のバッジ色を決定
  const getCardCountBadgeVariant = (count: number) => {
    if (count === 0) return "secondary"
    if (count >= 30) return "destructive"
    if (count >= 20) return "default"
    return "secondary"
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          {/* ヘッダー */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 truncate mb-1">{list.list_name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(list.updated_at)}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditorModalOpen(true)}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* カード枚数 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">カード枚数</span>
            <Badge variant={getCardCountBadgeVariant(list.card_ids.length)} className="font-medium">
              {list.card_ids.length}枚{list.card_ids.length >= 35 && " (上限)"}
            </Badge>
          </div>

          {/* 進捗バー */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  list.card_ids.length >= 35
                    ? "bg-red-500"
                    : list.card_ids.length >= 20
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                }`}
                style={{ width: `${Math.min((list.card_ids.length / 35) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">{list.card_ids.length}/35</p>
          </div>
        </CardContent>
      </Card>

      {/* 編集モーダル */}
      <ListEditorModal
        isOpen={isEditorModalOpen}
        onOpenChange={setIsEditorModalOpen}
        list={list}
        userId={userId}
        onSuccess={onUpdate}
      />

      {/* 削除確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>リストを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{list.list_name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
