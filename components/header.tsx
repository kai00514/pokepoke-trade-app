"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Bell, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect, memo } from "react"
import { getNotifications } from "@/lib/services/notification-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// ユーザーアバター部分をメモ化
const UserAvatar = memo(function UserAvatar({
  userProfile,
  displayName,
  isLoading,
}: {
  userProfile: any
  displayName: string
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
        <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20" />
        <Skeleton className="w-16 h-4 bg-white/20 hidden sm:block" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors duration-200 cursor-pointer">
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
      <span className="text-white text-sm font-medium hidden sm:inline">{displayName}</span>
    </div>
  )
})

function Header() {
  const { user, userProfile, isLoading, signOut, displayName } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  console.log("🔍 Header component - Auth state:", {
    user: user ? { id: user.id, email: user.email } : null,
    userProfile: userProfile ? { id: userProfile.id, display_name: userProfile.display_name } : null,
    isLoading,
    displayName,
  })

  // 未読通知数を取得
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) {
        setUnreadCount(0)
        return
      }

      try {
        console.log("📡 Fetching notifications for unread count:", user.id)
        const result = await getNotifications(user.id)
        if (result.success && result.notifications) {
          const unread = result.notifications.filter((n) => !n.is_read).length
          setUnreadCount(unread)
          console.log(`📊 Unread notifications count: ${unread}`)
        }
      } catch (error) {
        console.error("❌ Error fetching unread count:", error)
        setUnreadCount(0)
      }
    }

    if (user && !isLoading) {
      fetchUnreadCount()
    }
  }, [user, isLoading])

  const handleSignOut = async () => {
    try {
      await signOut()
      console.log("✅ Signed out successfully from Header")
    } catch (error) {
      console.error("❌ Sign out error:", error)
    }
  }

  const handleNotificationClick = () => {
    console.log("🔔 Notification icon clicked - redirecting to /notifications")
    window.location.href = "/notifications"
  }

  // ポケポケID登録のハンドラ (仮)
  const handlePokepokeIdRegistration = () => {
    console.log("ポケポケID登録がクリックされました。")
    // ここにポケポケID登録ページへの遷移ロジックなどを追加
  }

  // ユーザー名登録のハンドラ (仮)
  const handleUsernameRegistration = () => {
    console.log("ユーザー名登録がクリックされました。")
    // ここにユーザー名登録ページへの遷移ロジックなどを追加
  }

  return (
    <header className="bg-violet-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/pokelink-logo.png" alt="PokeLink ロゴ" width={160} height={40} className="object-contain h-10" />
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
                <Button variant="ghost" className="p-0 h-auto" aria-label="ユーザーメニューを開く">
                  <UserAvatar userProfile={userProfile} displayName={displayName} isLoading={isLoading} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg p-2"
              >
                <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">アカウント設定</p>
                </div>
                <DropdownMenuItem
                  onClick={handlePokepokeIdRegistration}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">ポケポケID登録</p>
                    <p className="text-xs text-gray-500">IDを設定する</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleUsernameRegistration}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700 transition-colors flex items-center"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">ユーザー名登録</p>
                    <p className="text-xs text-gray-500">表示名を設定する</p>
                  </div>
                </DropdownMenuItem>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-red-50 hover:text-red-700 transition-colors flex items-center"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">ログアウト</p>
                      <p className="text-xs text-gray-500">アカウントから退出</p>
                    </div>
                  </DropdownMenuItem>
                </div>
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
  )
}

// Named export
export { Header }

// Default export for compatibility
export default Header
