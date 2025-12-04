"use client"

import { Link } from "@/lib/i18n-navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Bell, User, Settings, Edit3, LogOut, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect, memo } from "react"
import { getNotifications } from "@/lib/services/notification-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslations } from "next-intl"

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
            alt={t('common.header.userAvatar')}
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
  const t = useTranslations()
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
          <Image src="/pokelink-logo.png" alt={t('common.header.logoAlt')} width={160} height={40} className="object-contain h-10" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white text-violet-600 hover:bg-violet-100 rounded-full h-9 w-9 sm:h-10 sm:w-10"
            aria-label={t('common.buttons.createPost')}
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="sr-only">{t('common.buttons.createPost')}</span>
          </Button>

          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white hover:bg-white/20 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200"
              onClick={handleNotificationClick}
              aria-label={`${t('common.header.notifications')} ${unreadCount > 0 ? `(${unreadCount}${t('common.header.unread')})` : ""}`}
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
                <Button variant="ghost" className="p-0 h-auto" aria-label={t('common.header.openUserMenu')}>
                  <UserAvatar userProfile={userProfile} displayName={displayName} isLoading={isLoading} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden backdrop-blur-sm"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  boxShadow: "0 32px 64px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* ヘッダー部分 */}
                <div className="relative px-8 py-6 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                  <div className="relative flex items-center space-x-4">
                    <div className="relative">
                      {userProfile?.avatar_url ? (
                        <Image
                          src={userProfile.avatar_url || "/placeholder.svg"}
                          alt={t('common.header.userAvatar')}
                          width={56}
                          height={56}
                          className="rounded-full object-cover w-14 h-14 ring-4 ring-white/30 shadow-lg"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30 shadow-lg backdrop-blur-sm">
                          <User className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-white truncate drop-shadow-sm">{displayName}</p>
                      <p className="text-sm text-white/90 font-medium">{t('common.user.online')}</p>
                    </div>
                  </div>
                </div>

                {/* メニュー項目 */}
                <div className="p-3">
                  <DropdownMenuItem
                    onClick={handlePokepokeIdRegistration}
                    className="cursor-pointer rounded-2xl px-5 py-4 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-300 flex items-center group border-0 focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                        {t('common.user.pokepokeIdRegistration')}
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors duration-200">
                        {t('common.user.setYourId')}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"></div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleUsernameRegistration}
                    className="cursor-pointer rounded-2xl px-5 py-4 text-sm hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:text-emerald-700 transition-all duration-300 flex items-center group border-0 focus:bg-gradient-to-r focus:from-emerald-50 focus:to-green-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <Edit3 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200">
                        {t('common.user.usernameRegistration')}
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-emerald-600 transition-colors duration-200">
                        {t('common.user.customizeDisplayName')}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"></div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleContactClick}
                    className="cursor-pointer rounded-2xl px-5 py-4 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-orange-700 transition-all duration-300 flex items-center group border-0 focus:bg-gradient-to-r focus:from-orange-50 focus:to-amber-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-orange-700 transition-colors duration-200">
                        {t('common.contact.title')}
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-orange-600 transition-colors duration-200">
                        {t('common.contact.prompt')}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"></div>
                  </DropdownMenuItem>

                  {/* 区切り線 */}
                  <div className="my-4 mx-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-2xl px-5 py-4 text-sm hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-300 flex items-center group border-0 focus:bg-gradient-to-r focus:from-red-50 focus:to-rose-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <LogOut className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-red-700 transition-colors duration-200">
                        {t('auth.logout.title')}
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-red-600 transition-colors duration-200">
                        {t('common.auth.safeLogout')}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"></div>
                  </DropdownMenuItem>
                </div>

                {/* フッター */}
                <div className="px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center font-medium">PokeLink v2.0</p>
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
                  {t('auth.signup.title')}
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="bg-white text-violet-600 border-violet-600 hover:bg-violet-100 hover:text-violet-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  {t('auth.login.title')}
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
