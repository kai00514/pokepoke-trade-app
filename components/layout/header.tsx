"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Bell, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { getNotifications } from "@/lib/services/notification-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { updateUserProfile } from "@/lib/services/user-service_ver2"

function Header() {
  const { user, session, userProfile, signOut, refreshSession } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const router = useRouter()

  // アカウント名の表示優先順位: name > display_name > pokepoke_id > email
  const accountName =
    userProfile?.name ||
    userProfile?.display_name ||
    userProfile?.pokepoke_id ||
    user?.email?.split("@")[0] ||
    "ユーザー"

  // ヘッダーレンダリング時の認証状態ログ
  console.log("🔍 [Header] Component render - Auth state:", {
    timestamp: new Date().toISOString(),
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role || "NO_ROLE",
    hasSession: !!session,
    sessionUserId: session?.user?.id,
    sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : "NO_EXPIRY",
    sessionExpired: session?.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : "UNKNOWN",
    hasUserProfile: !!userProfile,
    userProfileId: userProfile?.id,
    userProfilePokepokeId: userProfile?.pokepoke_id,
    userProfileDisplayName: userProfile?.display_name,
    accountName,
    userSessionMatch: user?.id === session?.user?.id,
    userProfileMatch: user?.id === userProfile?.id,
  })

  // 未読通知数を取得
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) {
        setUnreadCount(0)
        return
      }

      try {
        console.log("📡 [Header] Fetching notifications for unread count:", user.id)
        const result = await getNotifications(user.id)
        if (result.success && result.notifications) {
          const unread = result.notifications.filter((n) => !n.is_read).length
          setUnreadCount(unread)
          console.log(`📊 [Header] Unread notifications count: ${unread}`)
        }
      } catch (error) {
        console.error("❌ [Header] Error fetching unread count:", error)
        setUnreadCount(0)
      }
    }

    if (user) {
      fetchUnreadCount()
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      console.log("🚪 [Header] Starting sign out...")
      console.log("🚪 [Header] Pre-signout auth state:", {
        hasUser: !!user,
        hasSession: !!session,
        hasUserProfile: !!userProfile,
      })
      await signOut()
      console.log("✅ [Header] Sign out completed, redirecting to home")
      router.push("/")
    } catch (error) {
      console.error("❌ [Header] Sign out error:", error)
      // エラーが発生してもホームページにリダイレクト
      router.push("/")
    }
  }

  const handleNotificationClick = () => {
    console.log("🔔 [Header] Notification icon clicked - redirecting to /notifications")
    window.location.href = "/notifications"
  }

  const handlePokepokeIdRegistration = () => {
    console.log("🎯 [Header] Opening PokepokeID modal")
    console.log("🎯 [Header] Current auth state before modal:", {
      hasUser: !!user,
      userId: user?.id,
      hasUserProfile: !!userProfile,
      currentPokepokeId: userProfile?.pokepoke_id,
    })
    setIsPokepokeIdModalOpen(true)
  }

  const handleUsernameRegistration = () => {
    console.log("🎯 [Header] Opening Username modal")
    console.log("🎯 [Header] Current auth state before modal:", {
      hasUser: !!user,
      userId: user?.id,
      hasUserProfile: !!userProfile,
      currentDisplayName: userProfile?.display_name,
    })
    setIsUsernameModalOpen(true)
  }

  const handlePokepokeIdSave = async (pokepokeId: string) => {
    console.log("🚀 [Header] ===== handlePokepokeIdSave START =====")
    console.log("🚀 [Header] Input pokepokeId:", pokepokeId)
    console.log("🚀 [Header] Timestamp:", new Date().toISOString())

    if (!user) {
      console.error("❌ [Header] User not found")
      throw new Error("ユーザーが認証されていません")
    }

    // ヘッダーレベルでの詳細認証状態デバッグ
    console.log("🔍 [Header] Pre-save auth context state:", {
      hasUser: !!user,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role || "NO_ROLE",
      userAud: user.aud || "NO_AUD",
      userCreatedAt: user.created_at,
      userUpdatedAt: user.updated_at,
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionExpiry: session?.expires_at,
      sessionExpired: session?.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : "UNKNOWN",
      hasUserProfile: !!userProfile,
      userProfileId: userProfile?.id,
      userProfileCreatedAt: userProfile?.created_at,
      userProfileUpdatedAt: userProfile?.updated_at,
      currentPokepokeId: userProfile?.pokepoke_id,
      currentDisplayName: userProfile?.display_name,
      userSessionMatch: user.id === session?.user?.id,
      userProfileMatch: user.id === userProfile?.id,
    })

    try {
      console.log("🔄 [Header] Calling updateUserProfile...")
      const updateStartTime = Date.now()
      const updatedProfile = await updateUserProfile(user.id, {
        pokepoke_id: pokepokeId,
      })
      const updateEndTime = Date.now()

      console.log("🔄 [Header] updateUserProfile completed:", {
        duration: `${updateEndTime - updateStartTime}ms`,
        result: updatedProfile,
      })

      if (updatedProfile) {
        console.log("✅ [Header] PokepokeID saved successfully:", updatedProfile)

        // セッション更新前の状態
        console.log("🔍 [Header] Pre-refresh auth context:", {
          contextUserId: user.id,
          contextUserProfileId: userProfile?.id,
          contextPokepokeId: userProfile?.pokepoke_id,
          updatedProfileId: updatedProfile.id,
          updatedPokepokeId: updatedProfile.pokepoke_id,
          profilesMatch: userProfile?.id === updatedProfile.id,
        })

        console.log("🔄 [Header] Calling refreshSession...")
        const refreshStartTime = Date.now()
        await refreshSession()
        const refreshEndTime = Date.now()

        console.log("🔄 [Header] refreshSession completed:", {
          duration: `${refreshEndTime - refreshStartTime}ms`,
        })

        // セッション更新後の状態確認は次のレンダリングで行われる
        console.log("✅ [Header] Process completed successfully")
      } else {
        console.error("❌ [Header] Failed to save PokepokeID - updatedProfile is null/undefined")
        throw new Error("ポケポケIDの保存に失敗しました")
      }
    } catch (error) {
      console.error("❌ [Header] CATCH ERROR - Exception occurred:", error)
      console.error("❌ [Header] Error details:", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : "No stack trace",
        currentAuthState: {
          hasUser: !!user,
          hasSession: !!session,
          hasUserProfile: !!userProfile,
        },
      })
      throw error // モーダルでエラーハンドリングするために再スロー
    }

    console.log("🚀 [Header] ===== handlePokepokeIdSave END =====")
  }

  const handleUsernameSave = async (username: string) => {
    console.log("🚀 [Header] ===== handleUsernameSave START =====")
    console.log("🚀 [Header] Input username:", username)
    console.log("🚀 [Header] Timestamp:", new Date().toISOString())

    if (!user) {
      console.error("❌ [Header] User not found")
      throw new Error("ユーザーが認証されていません")
    }

    // ヘッダーレベルでの詳細認証状態デバッグ
    console.log("🔍 [Header] Pre-save auth context state:", {
      hasUser: !!user,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role || "NO_ROLE",
      userAud: user.aud || "NO_AUD",
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionExpiry: session?.expires_at,
      sessionExpired: session?.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : "UNKNOWN",
      hasUserProfile: !!userProfile,
      userProfileId: userProfile?.id,
      currentDisplayName: userProfile?.display_name,
      currentPokepokeId: userProfile?.pokepoke_id,
      userSessionMatch: user.id === session?.user?.id,
      userProfileMatch: user.id === userProfile?.id,
    })

    try {
      console.log("🔄 [Header] Calling updateUserProfile...")
      const updateStartTime = Date.now()
      const updatedProfile = await updateUserProfile(user.id, {
        display_name: username,
      })
      const updateEndTime = Date.now()

      console.log("🔄 [Header] updateUserProfile completed:", {
        duration: `${updateEndTime - updateStartTime}ms`,
        result: updatedProfile,
      })

      if (updatedProfile) {
        console.log("✅ [Header] Username saved successfully:", updatedProfile)

        // セッション更新前の状態
        console.log("🔍 [Header] Pre-refresh auth context:", {
          contextUserId: user.id,
          contextUserProfileId: userProfile?.id,
          contextDisplayName: userProfile?.display_name,
          updatedProfileId: updatedProfile.id,
          updatedDisplayName: updatedProfile.display_name,
          profilesMatch: userProfile?.id === updatedProfile.id,
        })

        console.log("🔄 [Header] Calling refreshSession...")
        const refreshStartTime = Date.now()
        await refreshSession()
        const refreshEndTime = Date.now()

        console.log("🔄 [Header] refreshSession completed:", {
          duration: `${refreshEndTime - refreshStartTime}ms`,
        })

        console.log("✅ [Header] Process completed successfully")
      } else {
        console.error("❌ [Header] Failed to save username - updatedProfile is null/undefined")
        throw new Error("ユーザー名の保存に失敗しました")
      }
    } catch (error) {
      console.error("❌ [Header] CATCH ERROR - Exception occurred:", error)
      console.error("❌ [Header] Error details:", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : "No stack trace",
        currentAuthState: {
          hasUser: !!user,
          hasSession: !!session,
          hasUserProfile: !!userProfile,
        },
      })
      throw error // モーダルでエラーハンドリングするために再スロー
    }

    console.log("🚀 [Header] ===== handleUsernameSave END =====")
  }

  return (
    <>
      <header className="bg-violet-500 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/pokelink-logo.png"
              alt="PokeLink ロゴ"
              width={160}
              height={40}
              className="object-contain h-10"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white text-violet-600 hover:bg-violet-100 rounded-full h-9 w-9 sm:h-10 sm:w-10"
              aria-label="新規投稿作成"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="sr-only">新規投稿作成</span>
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/20 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200"
                onClick={handleNotificationClick}
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
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors duration-200 cursor-pointer"
                    aria-label="ユーザーメニューを開く"
                  >
                    <div className="relative w-6 h-6 sm:w-8 sm:h-8">
                      {userProfile?.avatar_url ? (
                        <Image
                          src={userProfile.avatar_url || "/placeholder.svg"}
                          alt="ユーザーアバター"
                          width={32}
                          height={32}
                          className="rounded-full object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-white text-sm font-medium hidden sm:inline">{accountName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handlePokepokeIdRegistration} className="cursor-pointer">
                    ポケポケID登録
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleUsernameRegistration} className="cursor-pointer">
                    ユーザー名登録
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button
                    variant="default"
                    className="bg-white text-violet-600 hover:bg-violet-100 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                  >
                    新規登録
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="bg-white text-violet-600 border-violet-600 hover:bg-violet-100 hover:text-violet-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                  >
                    ログイン
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* モーダル */}
      <PokepokeIdRegistrationModal
        isOpen={isPokepokeIdModalOpen}
        onOpenChange={setIsPokepokeIdModalOpen}
        currentPokepokeId={userProfile?.pokepoke_id}
        onSave={handlePokepokeIdSave}
      />

      <UsernameRegistrationModal
        isOpen={isUsernameModalOpen}
        onOpenChange={setIsUsernameModalOpen}
        currentUsername={userProfile?.display_name}
        onSave={handleUsernameSave}
      />
    </>
  )
}

// Named export
export { Header }

// Default export for compatibility
export default Header
