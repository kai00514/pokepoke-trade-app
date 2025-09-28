"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Bell, User, Settings, Edit3, LogOut, MessageCircle } from "lucide-react"
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

  // お問い合わせのハンドラ
  const handleContactClick = () => {
    window.location.href = "/contact"
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
                className="w-72 bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden backdrop-blur-sm"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                }}
              >
                {/* ヘッダー部分 */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative flex items-center space-x-3">
                    <div className="relative">
                      {userProfile?.avatar_url ? (
                        <Image
                          src={userProfile.avatar_url || "/placeholder.svg"}
                          alt="ユーザーアバター"
                          width={48}
                          height={48}
                          className="rounded-full object-cover w-12 h-12 ring-3 ring-white/30"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ring-3 ring-white/30">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-white truncate">{displayName}</p>
                      <p className="text-sm text-white/80">オンライン</p>
                    </div>
                  </div>
                </div>

                {/* メニュー項目 */}
                <div className="p-2">
                  <DropdownMenuItem
                    onClick={handlePokepokeIdRegistration}
                    className="cursor-pointer rounded-xl px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200 flex items-center group border-0 focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700">ポケポケID登録</p>
                      <p className="text-xs text-gray-500 group-hover:text-blue-600">あなた専用のIDを設定</p>
                    </div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleUsernameRegistration}
                    className="cursor-pointer rounded-xl px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:text-emerald-700 transition-all duration-200 flex items-center group border-0 focus:bg-gradient-to-r focus:from-emerald-50 focus:to-green-50"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                      <Edit3 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-700">ユーザー名登録</p>
                      <p className="text-xs text-gray-500 group-hover:text-emerald-600">表示名をカスタマイズ</p>
                    </div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleContactClick}
                    className="cursor-pointer rounded-xl px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-orange-700 transition-all duration-200 flex items-center group border-0 focus:bg-gradient-to-r focus:from-orange-50 focus:to-amber-50"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-orange-700">お問い合わせ</p>
                      <p className="text-xs text-gray-500 group-hover:text-orange-600">
                        ご質問やご要望をお聞かせください
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </DropdownMenuItem>

                  {/* 区切り線 */}
                  <div className="my-2 mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-xl px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-200 flex items-center group border-0 focus:bg-gradient-to-r focus:from-red-50 focus:to-rose-50"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-rose-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                      <LogOut className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-red-700">ログアウト</p>
                      <p className="text-xs text-gray-500 group-hover:text-red-600">アカウントから安全に退出</p>
                    </div>
                    <div className="w-2 h-2 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </DropdownMenuItem>
                </div>

                {/* フッター */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">PokeLink v2.0</p>
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
