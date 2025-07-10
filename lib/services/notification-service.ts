import { supabase } from "@/lib/supabase/client"

export interface NotificationResult {
  success: boolean
  notifications?: any[]
  error?: string
}

export interface MarkReadResult {
  success: boolean
  error?: string
}

export async function getNotifications(userId: string): Promise<NotificationResult> {
  try {
    // 通知データを取得し、関連するユーザー情報も一緒に取得
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        sender:sender_id(display_name),
        trade:related_id(title, creator_id),
        deck:related_id(title, creator_id)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching notifications:", error)
      return { success: false, error: error.message }
    }

    // データを整形してユーザー名とタイトルを含める
    const formattedNotifications =
      data?.map((notification) => ({
        ...notification,
        sender_name: notification.sender?.display_name,
        trade_title: notification.trade?.title,
        deck_title: notification.deck?.title,
      })) || []

    return { success: true, notifications: formattedNotifications }
  } catch (error) {
    console.error("Error in getNotifications:", error)
    return { success: false, error: "通知の取得に失敗しました" }
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<MarkReadResult> {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

    if (error) {
      console.error("Error marking notification as read:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error)
    return { success: false, error: "通知の既読処理に失敗しました" }
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<MarkReadResult> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error)
    return { success: false, error: "全通知の既読処理に失敗しました" }
  }
}
