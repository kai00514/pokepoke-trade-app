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
import { Edit, Trash2, Calendar, Package, Sparkles } from "lucide-react"
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
      <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white border-0 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="p-0 relative">
          {/* カードヘッダー */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate mb-2">{list.list_name}</h3>
                  <div className="flex items-center gap-1 text-blue-100">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm">コレクション</span>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditorOpen(true)}
                    className="p-2 text-white hover:bg-white/20 rounded-full"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="p-2 text-white hover:bg-red-500/20 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* カード情報 */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">カード枚数</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{list.card_ids.length}</p>
                <p className="text-xs text-blue-600">/ 35枚</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">更新日</span>
                </div>
                <p className="text-lg font-bold text-purple-600">{formatDate(list.updated_at)}</p>
              </div>
            </div>

            {/* ステータスバッジ */}
            <div className="flex justify-between items-center">
              <Badge
                variant={list.card_ids.length === 0 ? "secondary" : "default"}
                className={
                  list.card_ids.length === 0
                    ? "bg-gray-100 text-gray-600 px-3 py-1"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1"
                }
              >
                {list.card_ids.length === 0 ? "カードなし" : `${list.card_ids.length}枚登録済み`}
              </Badge>

              {list.card_ids.length >= 35 && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1">上限達成</Badge>
              )}
            </div>

            {/* プログレスバー */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>進捗</span>
                <span>{Math.round((list.card_ids.length / 35) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((list.card_ids.length / 35) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* 作成日時（更新日時と異なる場合のみ表示） */}
            {list.created_at !== list.updated_at && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  作成日: {formatDate(list.created_at)}
                </p>
              </div>
            )}
          </div>
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
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">リストを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              「{list.list_name}」を削除します。この操作は取り消せません。
              {list.card_ids.length > 0 && (
                <span className="block mt-3 p-3 bg-orange-50 rounded-lg text-orange-700 border border-orange-200">
                  <Package className="h-4 w-4 inline mr-1" />
                  登録されている{list.card_ids.length}枚のカード情報も削除されます。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-full">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full"
            >
              {isDeleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
