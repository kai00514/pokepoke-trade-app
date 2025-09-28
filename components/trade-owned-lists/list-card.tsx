"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Calendar, User } from "lucide-react"
import { deleteTradeOwnedList } from "@/lib/actions/trade-owned-lists"
import { ListEditorModal } from "./list-editor-modal"
import { NotificationModal } from "@/components/ui/notification-modal"

interface TradeOwnedList {
  id: number
  list_name: string
  description?: string
  card_ids: number[]
  created_at: string
  user_id: string
}

interface ListCardProps {
  list: TradeOwnedList
  onUpdate: () => void
  currentUserId?: string
}

export function ListCard({ list, onUpdate, currentUserId }: ListCardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [notification, setNotification] = useState<{
    isOpen: boolean
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
    showCancel?: boolean
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    showCancel: false,
  })

  const showNotification = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    showCancel = false,
    onConfirm?: () => void,
  ) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      showCancel,
      onConfirm,
    })
  }

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }))
  }

  const handleDelete = async () => {
    try {
      const result = await deleteTradeOwnedList(list.id)

      if (result.success) {
        showNotification("success", "削除完了", "リストが正常に削除されました。")
        onUpdate()
      } else {
        showNotification("error", "エラーが発生しました", result.error || "リストの削除に失敗しました。")
      }
    } catch (error) {
      console.error("List deletion error:", error)
      showNotification("error", "エラーが発生しました", "リストの削除中に予期しないエラーが発生しました。")
    }
  }

  const confirmDelete = () => {
    showNotification(
      "warning",
      "削除の確認",
      "このリストを削除してもよろしいですか？この操作は取り消せません。",
      true,
      handleDelete,
    )
  }

  const isOwner = currentUserId === list.user_id

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-2">{list.list_name}</CardTitle>
              {list.description && <CardDescription className="text-gray-600">{list.description}</CardDescription>}
            </div>
            {isOwner && (
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditorOpen(true)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={confirmDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(list.created_at).toLocaleDateString("ja-JP")}</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {list.card_ids.length}枚
              </Badge>
            </div>
            {!isOwner && (
              <div className="flex items-center gap-1 text-gray-400">
                <User className="w-4 h-4" />
                <span>他のユーザー</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 編集モーダル */}
      <ListEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} list={list} onUpdate={onUpdate} />

      {/* 通知モーダル */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        showCancel={notification.showCancel}
        onConfirm={notification.onConfirm}
        confirmText={notification.type === "warning" ? "削除する" : "OK"}
      />
    </>
  )
}
