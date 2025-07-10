"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Package, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/services/notification-service"
import { useAuth } from "@/contexts/auth-context"

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  related_id?: string
  sender_name?: string
  trade_title?: string
  deck_title?: string
}

export function NotificationDropdown() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

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

  const getNotificationTypeInfo = (type: string) => {
    switch (type) {
      case "trade":
      case "trade_comment":
      case "trade_request":
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

  const getNotificationContent = (notification: Notification) => {
    const typeInfo = getNotificationTypeInfo(notification.type)

    // メッセージからユーザー名を抽出する処理
    let senderName = notification.sender_name || "不明なユーザー"
    let contentTitle = notification.trade_title || notification.deck_title || "詳細不明"

    // メッセージからユーザー名とタイトルを抽出
    if (notification.message) {
      // "○○さんが「××」にコメントしました" のようなパターンを解析
      const userNameMatch = notification.message.match(/^(.+?)さんが/)
      if (userNameMatch) {
        senderName = userNameMatch[1]
      }

      // 「」で囲まれたタイトルを抽出
      const titleMatch = notification.message.match(/「(.+?)」/)
      if (titleMatch) {
        contentTitle = titleMatch[1]
      }
    }

    return {
      typeInfo,
      senderName,
      contentTitle,
      description: `${senderName}さんから「${contentTitle}」について`,
    }
  }

  if (!user) return null

  return (
    <DropdownMenu>
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
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between p-3">
          <h3 className="font-semibold text-lg">通知</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
              <CheckCheck className="h-4 w-4 mr-1" />
              全て既読
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">読み込み中...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">通知はありません</div>
          ) : (
            notifications.map((notification) => {
              const { typeInfo, senderName, contentTitle, description } = getNotificationContent(notification)

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-4 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    !notification.is_read ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                  }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`${typeInfo.color} text-white rounded-full p-2 flex items-center justify-center`}>
                        {typeInfo.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={`${typeInfo.color} text-white text-xs px-2 py-1`}>
                          {typeInfo.label}
                        </Badge>
                        {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{notification.title}</h4>
                      <p className="text-xs text-gray-600 mb-1 line-clamp-1">{description}</p>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">{formatDateTime(notification.created_at)}</p>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
