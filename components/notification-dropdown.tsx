"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Package, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationRedirectPath,
} from "@/lib/services/notification-service"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "@/lib/i18n-navigation"
import { event as gtagEvent } from "@/lib/analytics/gtag"

interface Notification {
  id: string
  user_id: string
  type: string
  content: string
  related_id?: string
  is_read: boolean
  created_at: string
}

export function NotificationDropdown() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const result = await getNotifications(user.id)
      if (result.success && result.notifications) {
        setNotifications(result.notifications)
        const unread = result.notifications.filter((n) => !n.is_read).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return

    try {
      const result = await markAllNotificationsAsRead(user.id)
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    gtagEvent("notification_clicked", {
      category: "engagement",
      notification_type: notification.type,
      notification_id: notification.id,
    })

    // 未読の場合は既読にする
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id)
    }

    // ドロップダウンを閉じる
    setIsOpen(false)

    // 適切なページに遷移
    const redirectPath = getNotificationRedirectPath(notification)
    if (redirectPath && redirectPath !== "/") {
      router.push(redirectPath)
    }
  }

  const getNotificationTypeInfo = (type: string) => {
    switch (type) {
      case "trade":
      case "trade_comment":
      case "trade_request":
      case "comment":
      case "reply":
      case "comment_on_post":
        return {
          label: "トレード",
          color: "bg-blue-500",
          icon: <Users className="h-3 w-3" />,
        }
      case "deck":
      case "deck_comment":
      case "deck_like":
        return {
          label: "デッキ",
          color: "bg-green-500",
          icon: <Package className="h-3 w-3" />,
        }
      default:
        return {
          label: "その他",
          color: "bg-gray-500",
          icon: <Bell className="h-3 w-3" />,
        }
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? "今" : `${diffInMinutes}分前`
    } else if (diffInHours < 24) {
      return `${diffInHours}時間前`
    } else {
      return date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  const parseNotificationContent = (content: string) => {
    // contentから情報を抽出
    let senderName = "不明なユーザー"
    let contentTitle = "詳細不明"

    // "○○さんが「××」にコメントしました" のようなパターンを解析
    const userNameMatch = content.match(/^(.+?)さんが/)
    if (userNameMatch) {
      senderName = userNameMatch[1]
    }

    // 「」で囲まれたタイトルを抽出
    const titleMatch = content.match(/「(.+?)」/)
    if (titleMatch) {
      contentTitle = titleMatch[1]
    }

    return { senderName, contentTitle }
  }

  if (!user) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/20 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200"
          aria-label={`通知 ${unreadCount > 0 ? `(${unreadCount}件の未読)` : ""}`}
        >
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold border-2 border-violet-500"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        alignOffset={-8}
        avoidCollisions={true}
        collisionPadding={16}
        className="w-72 sm:w-80 max-w-[calc(100vw-2rem)] shadow-lg border bg-white rounded-lg overflow-hidden"
        style={{
          maxHeight: "min(400px, 50vh)",
          height: "auto",
        }}
      >
        {/* ヘッダー - 固定高さ */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50/50 flex-shrink-0">
          <h3 className="font-semibold text-sm text-gray-900">通知</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-6 px-2 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">全て既読</span>
              <span className="sm:hidden">既読</span>
            </Button>
          )}
        </div>

        {/* 通知リスト - スクロール可能エリア */}
        <div
          className="overflow-y-auto flex-1"
          style={{
            maxHeight: "320px",
            minHeight: "120px",
          }}
        >
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">通知はありません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const typeInfo = getNotificationTypeInfo(notification.type)
                const { senderName, contentTitle } = parseNotificationContent(notification.content)

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 focus:bg-gray-50 ${
                      !notification.is_read ? "bg-blue-50/50 border-l-4 border-blue-500" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`${typeInfo.color} text-white rounded-full p-1.5 flex items-center justify-center shadow-sm`}
                        >
                          {typeInfo.icon}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={`${typeInfo.color} text-white text-xs px-2 py-0.5 font-medium`}
                          >
                            {typeInfo.label}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-gray-400 truncate">{formatDateTime(notification.created_at)}</p>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {senderName !== "不明なユーザー" && contentTitle !== "詳細不明" && (
                          <p className="text-xs text-gray-600 font-medium line-clamp-1">
                            {senderName}さんから「{contentTitle}」について
                          </p>
                        )}

                        <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">{notification.content}</p>

                        {!notification.is_read && (
                          <div className="flex justify-end pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-blue-200 rounded-full transition-colors opacity-70 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                              aria-label="既読にする"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </div>

        {/* フッター - 固定高さ */}
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-gray-50/30 flex-shrink-0">
            <p className="text-xs text-center text-gray-500">
              {notifications.length >= 50 ? "最新50件を表示" : `${notifications.length}件の通知`}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
