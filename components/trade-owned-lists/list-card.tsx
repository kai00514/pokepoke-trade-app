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
import { Edit, Trash2, Calendar, Package } from "lucide-react"
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
  const [isEditorOpen, setIsEditorOpen] = useState(false)
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

  // 削除処理
  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteTradeOwnedList(list.id, userId)

    if (result.success) {
      onDelete(list.id)
      setIsDeleteDialogOpen(false)
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsDeleting(false)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{list.list_name}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(list.updated_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{list.card_ids.length}枚</span>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)} className="p-2">
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* カード枚数バッジ */}
          <div className="flex justify-between items-center">
            <Badge
              variant={list.card_ids.length === 0 ? "secondary" : "default"}
              className={list.card_ids.length === 0 ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-800"}
            >
              {list.card_ids.length === 0 ? "カードなし" : `${list.card_ids.length}枚登録済み`}
            </Badge>

            {list.card_ids.length >= 35 && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                上限達成
              </Badge>
            )}
          </div>

          {/* 作成日時（更新日時と異なる場合のみ表示） */}
          {list.created_at !== list.updated_at && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">作成日: {formatDate(list.created_at)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 編集モーダル */}
      <ListEditorModal
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        list={list}
        userId={userId}
        onSave={onUpdate}
      />

      {/* 削除確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>リストを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{list.list_name}」を削除します。この操作は取り消せません。
              {list.card_ids.length > 0 && (
                <span className="block mt-2 text-orange-600">
                  登録されている{list.card_ids.length}枚のカード情報も削除されます。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
