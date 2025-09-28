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
import NotificationModal from "@/components/ui/notification-modal"
import { deleteTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { ListEditorModal } from "./list-editor-modal"

interface ListCardProps {
  list: TradeOwnedList
  userId: string
  onUpdate: (list: TradeOwnedList) => void
  onDelete: (listId: number) => void
}

export default function ListCard({ list, userId, onUpdate, onDelete }: ListCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  })

  // 削除処理
  const handleDelete = async () => {
    setIsDeleting(true)

    const result = await deleteTradeOwnedList(list.id, userId)

    if (result.success) {
      onDelete(list.id)
    } else {
      showNotification("error", "エラー", result.error)
    }

    setIsDeleting(false)
    setIsDeleteDialogOpen(false)
  }

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const showNotification = (type: "success" | "error" | "warning" | "info", title: string, message: string) => {
    setNotificationModal({
      isOpen: true,
      type,
      title,
      message,
    })
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 truncate">{list.list_name}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(list.updated_at)}
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="text-gray-600 hover:text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-gray-600 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* カード枚数 */}
          <div className="flex justify-between items-center">
            <Badge variant={list.card_ids.length >= 35 ? "destructive" : "secondary"} className="text-sm">
              {list.card_ids.length}枚
            </Badge>
            {list.card_ids.length >= 35 && <span className="text-xs text-orange-600 font-medium">上限達成</span>}
          </div>
        </CardContent>
      </Card>

      {/* 編集モーダル */}
      <ListEditorModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
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
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 通知モーダル */}
      <NotificationModal
        isOpen={notificationModal.isOpen}
        onOpenChange={(open) => setNotificationModal((prev) => ({ ...prev, isOpen: open }))}
        type={notificationModal.type}
        title={notificationModal.title}
        message={notificationModal.message}
      />
    </>
  )
}
