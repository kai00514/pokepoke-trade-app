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
  const { user, session, userProfile, signOut, refreshSession, loading } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const router = useRouter()

  // アカウント名の表示優先順位
  const accountName =
    userProfile?.display_name ||
    userProfile?.name ||
    userProfile?.pokepoke_id ||
    user?.email?.split("@")[0] ||
    "ユーザー"

  // デバッグログ追加
  console.log("🔍 [Header] Render state:", {
    hasUser: !!user,
    hasUserProfile: !!userProfile,
    userProfileData: userProfile,
    accountName,
    loading,
    timestamp: new Date().toISOString(),
  })

  // 未読通知数を取得
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) {
        setUnreadCount(0)
        return
      }

      try {
        const result = await getNotifications(user.id)
        if (result.success && result.notifications) {
          const unread = result.notifications.filter((n) => !n.is_read).length
          setUnreadCount(unread)
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
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("❌ [Header] Sign out error:", error)
      router.push("/")
    }
  }

  const handleNotificationClick = () => {
    window.location.href = "/notifications"
  }

  const handlePokepokeIdRegistration = () => {
    setIsPokepokeIdModalOpen(true)
  }

  const handleUsernameRegistration = () => {
    setIsUsernameModalOpen(true)
  }

  const handlePokepokeIdSave = async (pokepokeId: string) => {
    console.log("🚀 [Header] Saving PokepokeID:", pokepokeId)

    if (!user) {
      throw new Error("ユーザーが認証されていません")
    }

    try {
      const updatedProfile = await updateUserProfile(user.id, {
        pokepoke_id: pokepokeId,
      })

      console.log("✅ [Header] PokepokeID saved:", updatedProfile)

      // AuthContextのセッションを更新
      await refreshSession()
      console.log("✅ [Header] Session refreshed")
    } catch (error) {
      console.error("❌ [Header] Failed to save PokepokeID:", error)
      throw error
    }
  }

  const handleUsernameSave = async (username: string) => {
    console.log("🚀 [Header] Saving username:", username)

    if (!user) {
      throw new Error("ユーザーが認証されていません")
    }

    try {
      const updatedProfile = await updateUserProfile(user.id, {
        display_name: username,
      })

      console.log("✅ [Header] Username saved:", updatedProfile)

      // AuthContextのセッションを更新
      await refreshSession()
      console.log("✅ [Header] Session refreshed")
    } catch (error) {
      console.error("❌ [Header] Failed to save username:", error)
      throw error
    }
  }

  // ローディング中は何も表示しない
  if (loading) {
    return (
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
            <div className="w-20 h-8 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    )
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

export default Header
export { Header }
