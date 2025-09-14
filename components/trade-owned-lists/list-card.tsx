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
      <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white hover:scale-[1.02] group">
        <CardContent className="p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 truncate mb-3 group-hover:text-blue-600 transition-colors">
                {list.list_name}
              </h3>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 rounded-full p-1">
                    <Calendar className="h-3 w-3" />
                  </div>
                  <span className="font-medium">{formatDate(list.updated_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 rounded-full p-1">
                    <Package className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="font-medium">{list.card_ids.length}枚</span>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditorOpen(true)}
                className="p-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* カード枚数とステータス */}
          <div className="flex justify-between items-center mb-4">
            <Badge
              variant={list.card_ids.length === 0 ? "secondary" : "default"}
              className={`px-3 py-1 text-sm font-medium ${
                list.card_ids.length === 0
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              } transition-colors`}
            >
              {list.card_ids.length === 0 ? "カードなし" : `${list.card_ids.length}枚登録済み`}
            </Badge>

            {list.card_ids.length >= 35 && (
              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 px-3 py-1">
                上限達成
              </Badge>
            )}
          </div>

          {/* プログレスバー */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-500">登録状況</span>
              <span className="text-xs font-medium text-gray-500">{list.card_ids.length}/35</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  list.card_ids.length === 0
                    ? "bg-gray-300"
                    : list.card_ids.length >= 35
                      ? "bg-orange-500"
                      : "bg-blue-500"
                }`}
                style={{ width: `${Math.min((list.card_ids.length / 35) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* 作成日時（更新日時と異なる場合のみ表示） */}
          {list.created_at !== list.updated_at && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                作成日: {formatDate(list.created_at)}
              </p>
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
