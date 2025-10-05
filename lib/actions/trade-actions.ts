"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import type { Card } from "@/components/detailed-search-modal"

// Helper function to extract username and avatar from user profile
function getUserDisplayInfo(userProfile: any) {
  const username = userProfile?.name || userProfile?.display_name || userProfile?.email?.split("@")[0] || "ユーザー"
  const avatarUrl = userProfile?.avatar_url || null
  return { username, avatarUrl }
}

export interface TradeFormData {
  title: string
  wantedCards: Card[]
  offeredCards: Card[]
  appId?: string
  comment?: string
  guestName?: string
  userId?: string
}

// Helper function to convert Card[] to JSONB format
function prepareCardsForDatabase(cards: Card[]) {
  return cards.map((card) => ({
    id: Number.parseInt(card.id),
    name: card.name,
    image_url: card.imageUrl,
    pack_name: card.packName || null,
    type: card.type || null,
    rarity: card.rarity || null,
  }))
}

// Helper function to convert JSONB data back to Card format
function parseCardsFromDatabase(jsonbData: any[]): Card[] {
  if (!Array.isArray(jsonbData)) return []

  return jsonbData.map((card) => ({
    id: card.id?.toString() || "unknown",
    name: card.name || "不明",
    imageUrl: card.image_url || "/placeholder.svg?width=80&height=112",
    packName: card.pack_name || undefined,
    type: card.type || undefined,
    rarity: card.rarity || undefined,
  }))
}

// 新しい軽量コメント取得関数
export async function getTradePostCommentsOnly(postId: string) {
  try {
    if (!postId || postId === "create" || postId.length < 8) {
      return {
        success: false,
        error: "無効な投稿IDです。",
        comments: [],
      }
    }

    const supabase = await createServerClient()

    // コメントデータのみ取得
    const { data: commentsData, error: commentsError } = await supabase
      .from("trade_comments")
      .select(`
        id, 
        user_id, 
        user_name, 
        guest_name,
        content, 
        created_at,
        is_guest
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (commentsError) {
      console.error(`Error fetching comments for post ${postId}:`, commentsError)
      return {
        success: false,
        error: `コメントの取得に失敗しました: ${commentsError.message}`,
        comments: [],
      }
    }

    if (!commentsData || commentsData.length === 0) {
      return { success: true, comments: [] }
    }

    // 認証済みコメント投稿者のユーザーIDを収集（UUIDのみ）
    const commentUserIds = new Set<string>()
    const authenticatedComments =
      commentsData.filter(
        (comment) =>
          !comment.is_guest && comment.user_id && typeof comment.user_id === "string" && comment.user_id.length === 36, // UUID length check
      ) || []
    authenticatedComments.forEach((comment) => commentUserIds.add(comment.user_id))

    // ユーザープロフィール取得
    const { data: userProfiles, error: usersError } =
      commentUserIds.size > 0
        ? await supabase
            .from("users")
            .select("id, name, display_name, email, avatar_url")
            .in("id", Array.from(commentUserIds))
        : { data: [], error: null }

    if (usersError) {
      console.error(`Error fetching user profiles for post ${postId}:`, usersError)
    }

    // コメントを整形
    const comments = commentsData.map((comment: any) => {
      const createdAt = new Date(comment.created_at)
      const diffSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000)
      let timestamp = `${createdAt.toLocaleDateString()}`
      if (diffSeconds < 60) timestamp = `${diffSeconds}秒前`
      else if (diffSeconds < 3600) timestamp = `${Math.floor(diffSeconds / 60)}分前`
      else if (diffSeconds < 86400) timestamp = `${Math.floor(diffSeconds / 3600)}時間前`
      else if (diffSeconds < 2592000) timestamp = `${Math.floor(diffSeconds / 86400)}日前`

      let commentAuthor: string
      let commentAvatar: string | null = null

      if (!comment.is_guest && comment.user_id) {
        const userProfile = userProfiles?.find((profile) => profile.id === comment.user_id)
        if (userProfile) {
          commentAuthor = userProfile.name || userProfile.display_name || "ユーザー"
          commentAvatar = userProfile.avatar_url || null
        } else {
          commentAuthor = comment.user_name || "ユーザー"
        }
      } else {
        commentAuthor = comment.guest_name || comment.user_name || "ゲスト"
      }

      return {
        id: comment.id,
        author: commentAuthor,
        avatar: commentAvatar,
        text: comment.content,
        timestamp: timestamp,
      }
    })

    return { success: true, comments }
  } catch (error) {
    console.error(`Unexpected error fetching comments for ${postId}:`, error)
    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました。"
    return { success: false, error: errorMessage, comments: [] }
  }
}

export async function createTradePost(formData: TradeFormData) {
  try {
    console.log("[createTradePost] 🚀 Starting trade post creation...")
    console.log("[createTradePost] Form data:", {
      title: formData.title,
      wantedCardsCount: formData.wantedCards.length,
      offeredCardsCount: formData.offeredCards.length,
      userId: formData.userId,
      guestName: formData.guestName,
    })

    const supabase = await createServerClient()

    // シンプルな認証判定：クライアントからuserIdが渡されていれば認証済み
    const isAuthenticated = !!formData.userId
    const finalUserId = formData.userId || null
    const guestName = formData.guestName?.trim() || "ゲスト"

    console.log("[createTradePost] Authentication decision:", {
      isAuthenticated,
      finalUserId,
      guestName: isAuthenticated ? null : guestName,
    })

    // カード配列をJSONB形式に変換
    const wantedCardsJsonb = prepareCardsForDatabase(formData.wantedCards)
    const offeredCardsJsonb = prepareCardsForDatabase(formData.offeredCards)

    // 投稿データの準備
    const postId = uuidv4()
    const insertData = {
      id: postId,
      title: formData.title.trim(),
      owner_id: isAuthenticated ? finalUserId : null,
      guest_name: isAuthenticated ? null : guestName,
      custom_id: formData.appId?.trim() || null,
      comment: formData.comment?.trim() || null,
      wanted_card_id: wantedCardsJsonb, // JSONB配列
      offered_card_id: offeredCardsJsonb, // JSONB配列
      status: "OPEN",
      is_authenticated: isAuthenticated,
      g8_flg: false, // 新しい行
    }

    console.log("[createTradePost] Insert data:", {
      ...insertData,
      wanted_card_id: `[${wantedCardsJsonb.length} cards]`,
      offered_card_id: `[${offeredCardsJsonb.length} cards]`,
    })

    // データベースに挿入
    const { data: insertResult, error: postError } = await supabase.from("trade_posts").insert(insertData).select()

    if (postError) {
      console.error("[createTradePost] Insert error:", postError)
      return {
        success: false,
        error: `投稿の作成に失敗しました: ${postError.message}`,
        details: postError,
      }
    }

    console.log("[createTradePost] ✅ Trade post inserted successfully!")

    revalidatePath("/")

    console.log("[createTradePost] 🎉 Trade post creation completed!")
    console.log("[createTradePost] Post ID:", postId)
    console.log("[createTradePost] Owner ID:", finalUserId || "GUEST")

    return { success: true, postId }
  } catch (error) {
    console.error("[createTradePost] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました。",
      details: error,
    }
  }
}

export async function getTradePostsWithCards(limit = 10, offset = 0) {
  try {
    const supabase = await createServerClient()

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from("trade_posts")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error fetching total count:", countError)
    }

    // Get posts with JSONB card data
    const { data: posts, error: postsError } = await supabase
      .from("trade_posts")
      .select(`
        id, 
        title, 
        owner_id, 
        guest_name,
        custom_id, 
        status, 
        created_at,
        is_authenticated,
        comment,
        wanted_card_id,
        offered_card_id
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error("Error fetching trade posts:", postsError)
      return { success: false, error: `投稿の取得に失敗しました: ${postsError.message}`, posts: [], totalCount: 0 }
    }

    if (!posts || posts.length === 0) {
      return { success: true, posts: [], totalCount: 0 }
    }

    // Get user profiles for authenticated posts
    const authenticatedPosts = posts.filter((post) => post.is_authenticated && post.owner_id)
    const userIds = authenticatedPosts.map((post) => post.owner_id)
    const postIds = posts.map((post) => post.id)

    // 並列クエリ実行で大幅な速度向上
    const [userProfilesResult, allCommentsResult] = await Promise.all([
      // ユーザープロフィール取得
      userIds.length > 0
        ? supabase.from("users").select("id, name, display_name, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [], error: null }),

      // コメント数取得
      supabase
        .from("trade_comments")
        .select("post_id")
        .in("post_id", postIds)
        .eq("is_deleted", false),
    ])

    const { data: userProfiles, error: usersError } = userProfilesResult
    const { data: allCommentsForPosts, error: commentFetchError } = allCommentsResult

    // ユーザープロフィールをマップ化
    const userProfilesMap = new Map()
    if (!usersError && userProfiles) {
      userProfiles.forEach((profile) => {
        const { username, avatarUrl } = getUserDisplayInfo(profile)
        userProfilesMap.set(profile.id, { username, avatarUrl })
      })
    }

    // Get comment counts
    const commentCountsMap = new Map<string, number>()
    if (!commentFetchError && allCommentsForPosts) {
      allCommentsForPosts.forEach((comment) => {
        commentCountsMap.set(comment.post_id, (commentCountsMap.get(comment.post_id) || 0) + 1)
      })
    }

    // Build posts with card data and user info
    const postsWithCards = posts.map((post: any) => {
      const createdAt = new Date(new Date(post.created_at).getTime() + 9 * 60 * 60 * 1000)
      const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(
        2,
        "0",
      )}/${String(createdAt.getDate()).padStart(2, "0")} ${String(createdAt.getHours()).padStart(
        2,
        "0",
      )}:${String(createdAt.getMinutes()).padStart(2, "0")}`

      // Get user info
      let username: string
      let avatarUrl: string | null = null

      if (post.is_authenticated && post.owner_id) {
        const userProfile = userProfilesMap.get(post.owner_id)
        if (userProfile) {
          username = userProfile.username
          avatarUrl = userProfile.avatarUrl
        } else {
          username = "ユーザー"
        }
      } else {
        username = post.guest_name || "ゲスト"
      }

      // Parse JSONB card data
      const wantedCards = parseCardsFromDatabase(post.wanted_card_id || [])
      const offeredCards = parseCardsFromDatabase(post.offered_card_id || [])

      // Get primary cards for backward compatibility
      const primaryWantedCard = wantedCards[0] || {
        id: "unknown",
        name: "不明",
        imageUrl: "/placeholder.svg?width=80&height=112",
      }
      const primaryOfferedCard = offeredCards[0] || {
        id: "unknown",
        name: "不明",
        imageUrl: "/placeholder.svg?width=80&height=112",
      }

      return {
        id: post.id,
        title: post.title,
        date: formattedDate,
        status:
          post.status === "OPEN"
            ? "募集中"
            : post.status === "MATCHED"
              ? "進行中"
              : post.status === "COMPLETED"
                ? "完了"
                : "キャンセル",
        wantedCard: {
          name: primaryWantedCard.name,
          image: primaryWantedCard.imageUrl,
        },
        offeredCard: {
          name: primaryOfferedCard.name,
          image: primaryOfferedCard.imageUrl,
        },
        comments: commentCountsMap.get(post.id) || 0,
        postId: post.custom_id || post.id.substring(0, 8),
        username,
        avatarUrl,
        authorComment: post.comment || null,
        rawData: {
          wantedCards: wantedCards,
          offeredCards: offeredCards,
          // 詳細画面用の追加データ
          fullPostData: {
            id: post.id,
            title: post.title,
            status:
              post.status === "OPEN"
                ? "募集中"
                : post.status === "MATCHED"
                  ? "進行中"
                  : post.status === "COMPLETED"
                    ? "完了"
                    : "キャンセル",
            description: post.comment || "",
            authorNotes: post.comment || "",
            originalPostId: post.custom_id || post.id.substring(0, 8),
            author: {
              username,
              avatarUrl,
              userId: post.owner_id,
              isOwner: post.is_authenticated && post.owner_id,
            },
            createdAt: formattedDate,
            wantedCards: wantedCards,
            offeredCards: offeredCards,
          },
        },
      }
    })

    return { success: true, posts: postsWithCards, totalCount: totalCount || 0 }
  } catch (error) {
    console.error("Unexpected error fetching trade posts:", error)
    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました。"
    return { success: false, error: errorMessage, posts: [], totalCount: 0 }
  }
}

export async function getTradePostDetailsById(postId: string) {
  try {
    // Validate that postId is not "create" or other invalid values
    if (!postId || postId === "create" || postId.length < 8) {
      return {
        success: false,
        error: "無効な投稿IDです。",
        post: null,
      }
    }

    const supabase = await createServerClient()

    // Get the main post data with JSONB card information
    const { data: postData, error: postError } = await supabase
      .from("trade_posts")
      .select(`
        *
      `)
      .eq("id", postId)
      .single()

    if (postError || !postData) {
      console.error(`Error fetching post details for ${postId}:`, postError)
      return {
        success: false,
        error: `投稿詳細の取得に失敗しました: ${postError?.message || "投稿が見つかりません"}`,
        post: null,
      }
    }

    // Get author info
    let authorInfo: { username: string; avatarUrl: string | null }

    if ((postData as any).is_authenticated && (postData as any).owner_id) {
      // Get user profile from users table
      const { data: userProfile, error: userError } = await supabase
        .from("users")
        .select("name, display_name, email, avatar_url")
        .eq("id", (postData as any).owner_id)
        .single()

      if (!userError && userProfile) {
        const { username, avatarUrl } = getUserDisplayInfo(userProfile)
        authorInfo = { username, avatarUrl }
      } else {
        authorInfo = { username: "ユーザー", avatarUrl: null }
      }
    } else {
      authorInfo = {
        username: (postData as any).guest_name || "ゲスト",
        avatarUrl: null,
      }
    }

    // Get comments
    const { data: commentsData, error: commentsError } = await supabase
      .from("trade_comments")
      .select(`
        id, 
        user_id, 
        user_name, 
        guest_name,
        content, 
        created_at,
        is_guest
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (commentsError) {
      console.error(`Error fetching comments for post ${postId}:`, commentsError)
    }

    // Get user profiles for authenticated commenters
    const authenticatedComments =
      commentsData?.filter(
        (comment) =>
          !comment.is_guest && comment.user_id && typeof comment.user_id === "string" && comment.user_id.length === 36, // UUID length check
      ) || []
    const commentUserIds = authenticatedComments.map((comment) => comment.user_id)

    const { data: userProfiles, error: usersError } =
      commentUserIds.length > 0
        ? await supabase.from("users").select("id, name, display_name, email, avatar_url").in("id", commentUserIds)
        : { data: [], error: null }

    if (usersError) {
      console.error(`Error fetching user profiles for post ${postId}:`, usersError)
    }

    // Parse JSONB card data
    const wantedCards = parseCardsFromDatabase(postData.wanted_card_id || [])
    const offeredCards = parseCardsFromDatabase(postData.offered_card_id || [])

    // Map comments with author info
    const comments =
      commentsData?.map((comment: any) => {
        const createdAt = new Date(comment.created_at)
        const diffSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000)
        let timestamp = `${createdAt.toLocaleDateString()}`
        if (diffSeconds < 60) timestamp = `${diffSeconds}秒前`
        else if (diffSeconds < 3600) timestamp = `${Math.floor(diffSeconds / 60)}分前`
        else if (diffSeconds < 86400) timestamp = `${Math.floor(diffSeconds / 3600)}時間前`
        else if (diffSeconds < 2592000) timestamp = `${Math.floor(diffSeconds / 86400)}日前`

        let commentAuthor: string
        let commentAvatar: string | null = null

        if (!comment.is_guest && comment.user_id) {
          const userProfile = userProfiles?.find((profile) => profile.id === comment.user_id)
          if (userProfile) {
            commentAuthor = userProfile.name || userProfile.display_name || "ユーザー"
            commentAvatar = userProfile.avatar_url || null
          } else {
            commentAuthor = comment.user_name || "ユーザー"
          }
        } else {
          commentAuthor = comment.guest_name || comment.user_name || "ゲスト"
        }

        return {
          id: comment.id,
          author: commentAuthor,
          avatar: commentAvatar,
          text: comment.content,
          timestamp: timestamp,
        }
      }) || []

    const formattedPost = {
      id: postData.id,
      title: postData.title,
      status:
        postData.status === "OPEN"
          ? "募集中"
          : postData.status === "MATCHED"
            ? "進行中"
            : postData.status === "COMPLETED"
              ? "完了"
              : "キャンセル",
      wantedCards: wantedCards,
      offeredCards: offeredCards,
      description: postData.comment || "",
      authorNotes: postData.comment || "",
      originalPostId: postData.custom_id || postData.id.substring(0, 8),
      comments,
      author: {
        ...authorInfo,
        userId: postData.owner_id,
        isOwner: postData.is_authenticated && postData.owner_id,
      },
      createdAt: new Date(postData.created_at).toLocaleDateString(),
    }

    return { success: true, post: formattedPost }
  } catch (error) {
    console.error(`Unexpected error fetching post details for ${postId}:`, error)
    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました。"
    return { success: false, error: errorMessage, post: null }
  }
}

export async function addCommentToTradePost(
  postId: string,
  content: string,
  userId: string | null,
  guestName?: string,
  isAuthenticated?: boolean,
) {
  try {
    const supabase = await createServerClient()

    if (!content.trim()) {
      return { success: false, error: "コメント内容を入力してください。" }
    }

    console.log("[addCommentToTradePost] User ID:", userId, "Is authenticated:", isAuthenticated)
    console.log("[addCommentToTradePost] Guest name:", guestName)

    const insertData: any = {
      post_id: postId,
      content: content,
      is_guest: !isAuthenticated,
      user_id: userId, // フロントエンドから渡されたuser_id
      user_name: isAuthenticated ? "ユーザー" : "ゲスト", // 仮の値、後で適切に設定
      guest_name: !isAuthenticated ? "ゲスト" : null,
    }

    console.log("[addCommentToTradePost] Insert data:", insertData)

    const { error } = await supabase.from("trade_comments").insert(insertData)

    if (error) {
      console.error("Error adding comment:", error)
      return { success: false, error: `コメントの投稿に失敗しました: ${error.message}` }
    }

    revalidatePath(`/trades/${postId}`)
    return { success: true }
  } catch (error) {
    console.error("Unexpected error adding comment:", error)
    const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました。"
    return { success: false, error: errorMessage }
  }
}

export async function updateTradePostStatus(postId: string, status: "CANCELED" | "COMPLETED") {
  try {
    const supabase = await createServerClient()

    // 現在のユーザーを取得
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return { success: false, error: "認証が必要です。" }
    }

    // 投稿の所有者確認
    const { data: post, error: postError } = await supabase
      .from("trade_posts")
      .select("owner_id, is_authenticated")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return { success: false, error: "投稿が見つかりません。" }
    }

    if (!post.is_authenticated || post.owner_id !== session.user.id) {
      return { success: false, error: "この操作を行う権限がありません。" }
    }

    // ステータス更新
    const { error: updateError } = await supabase.from("trade_posts").update({ status }).eq("id", postId)

    if (updateError) {
      console.error("Error updating trade post status:", updateError)
      return { success: false, error: `ステータスの更新に失敗しました: ${updateError.message}` }
    }

    revalidatePath("/history")
    revalidatePath(`/trades/${postId}`)

    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating trade post status:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}

export async function getMyTradePosts(userId: string) {
  try {
    const supabase = await createServerClient()

    // 自分の投稿を取得
    const { data: posts, error: postsError } = await supabase
      .from("trade_posts")
      .select(`
        id, 
        title, 
        owner_id, 
        custom_id, 
        status, 
        created_at,
        is_authenticated,
        comment,
        wanted_card_id
      `)
      .eq("owner_id", userId)
      .eq("is_authenticated", true)
      .order("created_at", { ascending: false })

    if (postsError) {
      console.error("Error fetching my trade posts:", postsError)
      return { success: false, error: `投稿の取得に失敗しました: ${postsError.message}`, posts: [] }
    }

    if (!posts || posts.length === 0) {
      return { success: true, posts: [] }
    }

    const postIds = posts.map((post) => post.id)

    // コメント数を取得
    const { data: comments, error: commentsError } = await supabase
      .from("trade_comments")
      .select("post_id")
      .in("post_id", postIds)
      .eq("is_deleted", false)

    const commentCountsMap = new Map<string, number>()
    if (!commentsError && comments) {
      comments.forEach((comment) => {
        commentCountsMap.set(comment.post_id, (commentCountsMap.get(comment.post_id) || 0) + 1)
      })
    }

    // 投稿データを整形
    const formattedPosts = posts.map((post: any) => {
      const commentCount = commentCountsMap.get(post.id) || 0

      // ステータス判定
      let displayStatus: string
      if (post.status === "CANCELED") {
        displayStatus = "canceled"
      } else if (post.status === "COMPLETED") {
        displayStatus = "completed"
      } else if (commentCount >= 1) {
        displayStatus = "in_progress"
      } else {
        displayStatus = "open"
      }

      // Parse JSONB card data
      const wantedCards = parseCardsFromDatabase(post.wanted_card_id || [])
      const primaryWantedCard = wantedCards[0] || {
        name: "不明",
        imageUrl: "/placeholder.svg?width=80&height=112",
      }

      const createdAt = new Date(post.created_at)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const postedDateRelative = diffDays === 0 ? "今日" : `${diffDays}日前`

      return {
        id: post.id,
        title: post.title,
        primaryCardName: primaryWantedCard.name,
        primaryCardImageUrl: primaryWantedCard.imageUrl,
        postedDateRelative,
        status: displayStatus,
        commentCount,
        authorComment: post.comment || null,
        postUrl: `/trades/${post.id}`,
      }
    })

    return { success: true, posts: formattedPosts }
  } catch (error) {
    console.error("Unexpected error fetching my trade posts:", error)
    return { success: false, error: "予期しないエラーが発生しました。", posts: [] }
  }
}

export async function getCommentedTradePosts(userId: string) {
  try {
    const supabase = await createServerClient()

    // 自分がコメントした投稿のIDを取得
    const { data: myComments, error: commentsError } = await supabase
      .from("trade_comments")
      .select("post_id")
      .eq("user_id", userId)
      .eq("is_deleted", false)

    if (commentsError) {
      console.error("Error fetching commented posts:", commentsError)
      return { success: false, error: `コメント履歴の取得に失敗しました: ${commentsError.message}`, posts: [] }
    }

    if (!myComments || myComments.length === 0) {
      return { success: true, posts: [] }
    }

    const commentedPostIds = [...new Set(myComments.map((c) => c.post_id))]

    // コメントした投稿の詳細を取得（自分の投稿は除外）
    const { data: posts, error: postsError } = await supabase
      .from("trade_posts")
      .select(`
        id, 
        title, 
        owner_id, 
        guest_name,
        custom_id, 
        status, 
        created_at,
        is_authenticated,
        comment,
        wanted_card_id
      `)
      .in("id", commentedPostIds)
      .or(`owner_id.is.null,owner_id.neq.${userId}`) // 自分の投稿は除外、ゲスト投稿は含める
      .order("created_at", { ascending: false })

    if (postsError) {
      console.error("Error fetching commented trade posts:", postsError)
      return { success: false, error: `投稿の取得に失敗しました: ${postsError.message}`, posts: [] }
    }

    if (!posts || posts.length === 0) {
      return { success: true, posts: [] }
    }

    const postIds = posts.map((post) => post.id)

    // コメント数を取得
    const { data: allComments, error: allCommentsError } = await supabase
      .from("trade_comments")
      .select("post_id")
      .in("post_id", postIds)
      .eq("is_deleted", false)

    const commentCountsMap = new Map<string, number>()
    if (!allCommentsError && allComments) {
      allComments.forEach((comment) => {
        commentCountsMap.set(comment.post_id, (commentCountsMap.get(comment.post_id) || 0) + 1)
      })
    }

    // 投稿データを整形
    const formattedPosts = posts.map((post: any) => {
      const commentCount = commentCountsMap.get(post.id) || 0

      // ステータス表示（投稿に設定されているステータスをそのまま表示）
      let displayStatus: string
      if (post.status === "CANCELED") {
        displayStatus = "canceled"
      } else if (post.status === "COMPLETED") {
        displayStatus = "completed"
      } else if (commentCount >= 1) {
        displayStatus = "in_progress"
      } else {
        displayStatus = "open"
      }

      // Parse JSONB card data
      const wantedCards = parseCardsFromDatabase(post.wanted_card_id || [])
      const primaryWantedCard = wantedCards[0] || {
        id: "unknown",
        name: "不明",
        imageUrl: "/placeholder.svg?width=80&height=112",
      }

      const createdAt = new Date(post.created_at)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const postedDateRelative = diffDays === 0 ? "今日" : `${diffDays}日前`

      return {
        id: post.id,
        title: post.title,
        primaryCardName: primaryWantedCard.name,
        primaryCardImageUrl: primaryWantedCard.imageUrl,
        postedDateRelative,
        status: displayStatus,
        commentCount,
        authorComment: post.comment || null,
        postUrl: `/trades/${post.id}`,
      }
    })

    return { success: true, posts: formattedPosts }
  } catch (error) {
    console.error("Unexpected error fetching commented trade posts:", error)
    return { success: false, error: "予期しないエラーが発生しました。", posts: [] }
  }
}
