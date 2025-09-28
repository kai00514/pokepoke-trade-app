"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye } from "lucide-react"
import { deleteTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import ListEditorModal from "./list-editor-modal"
import NotificationModal from "@/components/ui/notification-modal"

interface ListCardProps {
  list: {
    id: string
    list_name: string
    description?: string
    card_ids: number[]
    created_at: string
  }
  onUpdate: () => void
}

export default function ListCard({ list, onUpdate }: ListCardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Notification modal state
  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    type: "info" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined,
    showCancel: false,
  })

  const handleDelete = async () => {
    setNotificationModal({
      isOpen: true,
      type: "warning",
      title: "削除確認",
      message: `「${list.list_name}」を削除してもよろしいですか？この操作は取り消せません。`,
      onConfirm: confirmDelete,
      showCancel: true,
    })
  }

  const confirmDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteTradeOwnedList(list.id)

      if (result.success) {
        setNotificationModal({
          isOpen: true,
          type: "success",
          title: "削除完了",
          message: "リストが正常に削除されました。",
          onConfirm: undefined,
          showCancel: false,
        })
        onUpdate()
      } else {
        setNotificationModal({
          isOpen: true,
          type: "error",
          title: "削除エラー",
          message: result.error || "リストの削除に失敗しました。",
          onConfirm: undefined,
          showCancel: false,
        })
      }
    } catch (error) {
      console.error("Error deleting list:", error)
      setNotificationModal({
        isOpen: true,
        type: "error",
        title: "システムエラー",
        message: "予期しないエラーが発生しました。もう一度お試しください。",
        onConfirm: undefined,
        showCancel: false,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleView = () => {
    window.location.href = `/lists/${list.id}`
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">{list.list_name}</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {list.card_ids.length}枚
            </Badge>
          </div>
          {list.description && <p className="text-sm text-gray-600 line-clamp-2">{list.description}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">作成日: {new Date(list.created_at).toLocaleDateString("ja-JP")}</p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-transparent"
              >
                <Eye className="w-4 h-4 mr-1" />
                表示
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditorOpen(true)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                編集
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {isDeleting ? "削除中..." : "削除"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 編集モーダル */}
      <ListEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} list={list} onUpdate={onUpdate} />

      {/* 通知モーダル */}
      <NotificationModal
        isOpen={notificationModal.isOpen}
        onOpenChange={(open) => setNotificationModal((prev) => ({ ...prev, isOpen: open }))}
        type={notificationModal.type}
        title={notificationModal.title}
        message={notificationModal.message}
        onConfirm={notificationModal.onConfirm}
        showCancel={notificationModal.showCancel}
      />
    </>
  )
}
