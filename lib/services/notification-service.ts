import { createClient } from "@/lib/supabase/client"

type NotificationType = "comment" | "reply" | "match" | "match_request" | "match_accepted" | "match_rejected"

interface Notification {
  id: string
  user_id: string
  type: string
  content: string
  related_id?: string
  is_read: boolean
  created_at: string
}

type NotificationContent = {
  matchId?: string
  chatRoomId?: string
  responderId?: string
  initiatorId?: string
  message?: string
}

/**
 * 通知設定が有効かどうかを確認する
 */
export async function isNotificationTypeEnabled(userId: string, type: NotificationType): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("user_notification_settings").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("通知設定取得エラー:", error)
      return true // デフォルトでは通知を有効とする
    }

    if (!data) {
      // 設定がない場合はデフォルトで有効
      return true
    }

    // 通知タイプに応じた設定を返す
    switch (type) {
      case "comment":
        return data.comments_enabled
      case "reply":
        return data.replies_enabled
      case "match":
        return data.matches_enabled
      case "match_request":
        return data.match_requests_enabled
      case "match_accepted":
        return data.match_accepted_enabled
      case "match_rejected":
        return data.match_rejected_enabled
      default:
        return true
    }
  } catch (error) {
    console.error("通知設定確認エラー:", error)
    return true // エラーの場���はデフォルトで有効
  }
}

/**
 * コメント通知を処理する
 */
export async function handleCommentNotification(comment: any, postOwnerId: string): Promise<void> {
  try {
    const supabase = createClient()
    console.log("コメント通知処理開始:", comment, "投稿者ID:", postOwnerId)

    // コメント投稿者名のフォールバック
    const userName = comment.user_name || "ゲスト"

    // 投稿者への通知（自分自身のコメントには通知しない）
    if (comment.user_id !== postOwnerId) {
      const isEnabled = await isNotificationTypeEnabled(postOwnerId, "comment")
      if (isEnabled) {
        console.log("投稿者への通知を作成:", postOwnerId)
        const { data, error } = await supabase
          .from("trade_notifications")
          .insert({
            user_id: postOwnerId,
            type: "comment",
            content: `あなたの投稿に${userName}さんからコメントがありました`,
            related_id: comment.post_id,
          })
          .select()

        if (error) {
          console.error("投稿者への通知作成エラー:", error)
        } else {
          console.log("投稿者への通知作成成功:", data)
        }
      }
    }

    // 返信の場合、親コメントの投稿者にも通知
    if (comment.parent_id) {
      // 親コメントの投稿者IDを取得
      const { data: parentComment, error: parentError } = await supabase
        .from("trade_comments")
        .select("user_id, user_name")
        .eq("id", comment.parent_id)
        .single()

      if (parentError) {
        console.error("親コメント取得エラー:", parentError)
        return
      }

      if (parentComment && parentComment.user_id !== comment.user_id && parentComment.user_id !== postOwnerId) {
        const isReplyEnabled = await isNotificationTypeEnabled(parentComment.user_id, "reply")
        if (isReplyEnabled) {
          console.log("親コメント投稿者への通知を作成:", parentComment.user_id)
          const { data, error } = await supabase
            .from("trade_notifications")
            .insert({
              user_id: parentComment.user_id,
              type: "reply",
              content: `あなたのコメントに${userName}さんから返信がありました`,
              related_id: comment.post_id,
            })
            .select()

          if (error) {
            console.error("親コメント投稿者への通知作成エラー:", error)
          } else {
            console.log("親コメント投稿者への通知作成成功:", data)
          }
        }
      }
    }

    // 同じ投稿にコメントしたユーザーにも通知（投稿者と自分自身を除く）
    await notifyOtherCommenters(comment)
    console.log("コメント通知処理完了")
  } catch (error) {
    console.error("通知送信エラー:", error)
  }
}

/**
 * 同じ投稿にコメントした他のユーザーに通知する
 */
async function notifyOtherCommenters(comment: any): Promise<void> {
  try {
    const supabase = createClient()
    console.log("他のコメンターへの通知処理開始")

    // 同じ投稿にコメントしたユーザーのIDを取得（重複を除く）
    const { data: commenters, error: commentersError } = await supabase
      .from("trade_comments")
      .select("user_id")
      .eq("post_id", comment.post_id)
      .neq("user_id", comment.user_id) // 自分自身を除外
      .is("is_deleted", false) // 削除されていないコメントのみ

    if (commentersError) {
      console.error("コメントユーザー取得エラー:", commentersError)
      return
    }

    if (!commenters || commenters.length === 0) {
      console.log("他のコメンターが見つかりません")
      return
    }

    console.log("他のコメンター:", commenters)

    // 重複を除去
    const uniqueCommenterIds = [...new Set(commenters.map((c) => c.user_id))]
    console.log("重複除去後のコメンターID:", uniqueCommenterIds)

    // 投稿の所有者IDを取得
    const { data: post, error: postError } = await supabase
      .from("trade_posts")
      .select("owner_id")
      .eq("id", comment.post_id)
      .single()

    if (postError) {
      console.error("投稿取得エラー:", postError)
      return
    }

    // 投稿者を除外
    const commenterIdsToNotify = uniqueCommenterIds.filter((id) => id !== post.owner_id)
    console.log("通知対象のコメンターID:", commenterIdsToNotify)

    // コメント投稿者名のフォールバック
    const userName = comment.user_name || "ゲスト"

    // 各コメンターに通知
    for (const userId of commenterIdsToNotify) {
      const isEnabled = await isNotificationTypeEnabled(userId, "comment")
      if (isEnabled) {
        console.log("コメンターへの通知を作成:", userId)
        const { data, error } = await supabase
          .from("trade_notifications")
          .insert({
            user_id: userId,
            type: "comment_on_post",
            content: `あなたがコメントした投稿に${userName}さんが新しいコメントを追加しました`,
            related_id: comment.post_id,
          })
          .select()

        if (error) {
          console.error("コメンターへの通知作成エラー:", error)
        } else {
          console.log("コメンターへの通知作成成功:", data)
        }
      }
    }

    console.log("他のコメンターへの通知処理完了")
  } catch (error) {
    console.error("コメンター通知エラー:", error)
  }
}

/**
 * マッチング通知を処理する
 */
export async function handleMatchNotification(
  matchId: string,
  requesterId: string,
  receiverId: string,
  type: "match_request" | "match_accepted" | "match_rejected",
): Promise<void> {
  try {
    const supabase = createClient()

    // 通知を受け取るユーザーID
    const targetUserId = type === "match_request" ? receiverId : requesterId
    // 通知を送信するユーザーID
    const sourceUserId = type === "match_request" ? requesterId : receiverId

    // ユーザー名を取得
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", sourceUserId)
      .single()

    if (userError) {
      console.error("ユーザー情報取得エラー:", userError)
      return
    }

    const userName = userData?.name || "ユーザー"

    // 通知タイプに応じたメッセージを設定
    let content = ""
    switch (type) {
      case "match_request":
        content = `${userName}さんからマッチングリクエストが届きました`
        break
      case "match_accepted":
        content = `${userName}さんがあなたのマッチングリクエストを承認しました`
        break
      case "match_rejected":
        content = `${userName}さんがあなたのマッチングリクエストを拒否しました`
        break
    }

    // 通知設定を確認
    const isEnabled = await isNotificationTypeEnabled(targetUserId, type)
    if (isEnabled) {
      // 通知を作成
      const { data, error } = await supabase
        .from("trade_notifications")
        .insert({
          user_id: targetUserId,
          type,
          content,
          related_id: matchId,
        })
        .select()

      if (error) {
        console.error("マッチング通知作成エラー:", error)
      } else {
        console.log("マッチング通知作成成功:", data)
      }
    }
  } catch (error) {
    console.error("マッチング通知送信エラー:", error)
  }
}

/**
 * 通知タイプに基づいてリダイレクト先を決定する
 */
export function getNotificationRedirectPath(notification: any): string {
  if (!notification.related_id) {
    return "/"
  }

  switch (notification.type) {
    case "trade":
    case "trade_comment":
    case "trade_request":
    case "comment":
    case "reply":
    case "comment_on_post":
      return `/trades/${notification.related_id}`
    case "deck":
    case "deck_comment":
    case "deck_like":
      return `/decks/${notification.related_id}`
    default:
      return "/"
  }
}

/**
 * 通知を作成する
 * 以前のバージョンとの互換性のために残しています
 */
export async function createNotification(options: {
  userId: string
  type: string
  content: NotificationContent
  relatedId: string
}): Promise<Notification | null> {
  try {
    const supabase = createClient()
    console.log("通知作成開始:", options)

    // 通知タイプに応じたメッセージを作成
    let message = ""
    switch (options.type) {
      case "match_request":
        message = "あなたのマッチングに応答がありました。承認してチャットを開始しましょう。"
        break
      case "match_approved":
        message = "マッチングが承認されました。チャットルームが作成されました。"
        break
      case "match_approval_pending":
        message = "相手がマッチングを承認しました。あなたの承認が必要です。"
        break
      case "match_rejected":
        message = "マッチングが拒否されました。"
        break
      case "trade_completion_request":
        message = "トレード完了リクエストが届いています。承認してください。"
        break
      case "trade_completed":
        message = "トレードが完了しました！"
        break
      default:
        message = options.content.message || "新しい通知があります。"
    }

    const { data, error } = await supabase
      .from("trade_notifications")
      .insert({
        user_id: options.userId,
        type: options.type,
        content: message,
        related_id: options.relatedId,
      })
      .select()
      .single()

    if (error) {
      console.error("通知作成エラー:", error)
      return null
    }

    console.log("通知作成成功:", data)
    return data
  } catch (error) {
    console.error("通知作成エラー:", error)
    return null
  }
}

interface NotificationResult {
  success: boolean
  notifications?: any[]
  error?: string
}

/**
 * 通知を取得する
 */
export async function getNotifications(userId: string): Promise<NotificationResult> {
  try {
    const supabase = createClient()

    // trade_notificationsとdeck_notificationsの両方から取得
    const [tradeResult, deckResult] = await Promise.all([
      supabase
        .from("trade_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("deck_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25),
    ])

    if (tradeResult.error) {
      console.error("Error fetching trade notifications:", tradeResult.error)
    }

    if (deckResult.error) {
      console.error("Error fetching deck notifications:", deckResult.error)
    }

    // 両方の結果を結合
    const allNotifications = [...(tradeResult.data || []), ...(deckResult.data || [])]

    // 作成日時でソート
    allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      success: true,
      notifications: allNotifications.slice(0, 50), // 最大50件
    }
  } catch (error) {
    console.error("Error in getNotifications:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

interface MarkAsReadResult {
  success: boolean
  error?: string
}

/**
 * 通知を既読にする
 */
export async function markNotificationAsRead(notificationId: string): Promise<MarkAsReadResult> {
  try {
    const supabase = createClient()

    // まずtrade_notificationsで試す
    const tradeResult = await supabase.from("trade_notifications").update({ is_read: true }).eq("id", notificationId)

    // trade_notificationsで見つからない場合はdeck_notificationsで試す
    if (tradeResult.error || (tradeResult.data && tradeResult.data.length === 0)) {
      const deckResult = await supabase.from("deck_notifications").update({ is_read: true }).eq("id", notificationId)

      if (deckResult.error) {
        console.error("Error marking deck notification as read:", deckResult.error)
        return { success: false, error: deckResult.error.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark notification as read",
    }
  }
}

/**
 * すべての通知を既読にする
 */
export async function markAllNotificationsAsRead(userId: string): Promise<MarkAsReadResult> {
  try {
    const supabase = createClient()

    // 両方のテーブルで未読通知を既読にする
    const [tradeResult, deckResult] = await Promise.all([
      supabase.from("trade_notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false),
      supabase.from("deck_notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false),
    ])

    if (tradeResult.error) {
      console.error("Error marking trade notifications as read:", tradeResult.error)
    }

    if (deckResult.error) {
      console.error("Error marking deck notifications as read:", deckResult.error)
    }

    return { success: true }
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark all notifications as read",
    }
  }
}

/**
 * 通知を削除する
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("trade_notifications").delete().eq("id", notificationId)

    if (error) {
      console.error("通知削除エラー:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("通知削除処理エラー:", error)
    return false
  }
}

/**
 * すべての通知を削除する
 */
export async function deleteAllNotifications(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("trade_notifications").delete().eq("user_id", userId)

    if (error) {
      console.error("全通知削除エラー:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("全通知削除処理エラー:", error)
    return false
  }
}

// 通知を作成するテスト関数（デバッグ用）
export async function createTestNotification(userId: string): Promise<any> {
  try {
    const supabase = createClient()
    const timestamp = new Date().toISOString()
    console.log("テスト通知作成開始:", userId)

    const { data, error } = await supabase
      .from("trade_notifications")
      .insert({
        user_id: userId,
        type: "test",
        content: `これはテスト通知です (${timestamp})`,
        related_id: "00000000-0000-0000-0000-000000000000",
      })
      .select()

    if (error) {
      console.error("テスト通知作成エラー:", error)
      return { success: false, error: error.message }
    }

    console.log("テスト通知作成成功:", data)
    return { success: true, data }
  } catch (error) {
    console.error("テスト通知作成エラー:", error)
    return { success: false, error: "テスト通知の作成に失敗しました" }
  }
}

/**
 * コメント通知を作成する
 * 特定のコメントに対する通知を作成します
 */
export async function markCommentAsRead(userId: string, commentId: string, postId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // 既に既読かどうかを確認
    const { data: existingData, error: checkError } = await supabase
      .from("comment_read_status")
      .select("id")
      .eq("user_id", userId)
      .eq("comment_id", commentId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116はデータが見つからないエラー
      console.error("既読状態確認エラー:", checkError)
      return false
    }

    // 既に既読の場合は何もしない
    if (existingData) {
      return true
    }

    // 既読状態を記録
    const { error: insertError } = await supabase.from("comment_read_status").insert({
      user_id: userId,
      comment_id: commentId,
      post_id: postId,
    })

    if (insertError) {
      console.error("既読状態記録エラー:", insertError)
      return false
    }

    return true
  } catch (error) {
    console.error("コメント既読化エラー:", error)
    return false
  }
}
