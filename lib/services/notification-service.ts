import { createClient } from "@/lib/supabase/client"

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

export async function getNotifications(
  userId: string,
): Promise<{ success: boolean; notifications?: Notification[]; error?: string }> {
  try {
    const supabase = createClient()

    // まず基本的な通知データを取得
    const { data: notifications, error: notificationsError } = await supabase
      .from("deck_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (notificationsError) {
      console.error("Error fetching notifications:", notificationsError)
      return { success: false, error: notificationsError.message }
    }

    if (!notifications || notifications.length === 0) {
      return { success: true, notifications: [] }
    }

    // 各通知に対して関連情報を取得
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let senderName = "不明なユーザー"
        let contentTitle = "詳細不明"

        try {
          // related_idがある場合、関連するトレードまたはデッキの情報を取得
          if (notification.related_id) {
            if (notification.type.includes("trade")) {
              // トレード関連の通知
              const { data: tradeData } = await supabase
                .from("trade_posts")
                .select("title, creator_id")
                .eq("id", notification.related_id)
                .single()

              if (tradeData) {
                contentTitle = tradeData.title || "トレード投稿"

                // 作成者の情報を取得
                const { data: userData } = await supabase
                  .from("users")
                  .select("display_name")
                  .eq("id", tradeData.creator_id)
                  .single()

                if (userData?.display_name) {
                  senderName = userData.display_name
                }
              }
            } else if (notification.type.includes("deck")) {
              // デッキ関連の通知
              const { data: deckData } = await supabase
                .from("deck_posts")
                .select("title, creator_id")
                .eq("id", notification.related_id)
                .single()

              if (deckData) {
                contentTitle = deckData.title || "デッキ投稿"

                // 作成者の情報を取得
                const { data: userData } = await supabase
                  .from("users")
                  .select("display_name")
                  .eq("id", deckData.creator_id)
                  .single()

                if (userData?.display_name) {
                  senderName = userData.display_name
                }
              }
            }
          }

          // メッセージからも情報を抽出（フォールバック）
          if (notification.message) {
            const userNameMatch = notification.message.match(/^(.+?)さんが/)
            if (userNameMatch && senderName === "不明なユーザー") {
              senderName = userNameMatch[1]
            }

            const titleMatch = notification.message.match(/「(.+?)」/)
            if (titleMatch && contentTitle === "詳細不明") {
              contentTitle = titleMatch[1]
            }
          }
        } catch (error) {
          console.error("Error enriching notification:", error)
        }

        return {
          ...notification,
          sender_name: senderName,
          trade_title: notification.type.includes("trade") ? contentTitle : undefined,
          deck_title: notification.type.includes("deck") ? contentTitle : undefined,
        }
      }),
    )

    return { success: true, notifications: enrichedNotifications }
  } catch (error) {
    console.error("Error in getNotifications:", error)
    return { success: false, error: "通知の取得に失敗しました" }
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("deck_notifications").update({ is_read: true }).eq("id", notificationId)

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

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("deck_notifications")
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
