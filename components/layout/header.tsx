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
import { updateUserProfile } from "@/lib/services/user-service"

function Header() {
  const { user, userProfile, signOut, refreshProfile } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const router = useRouter()

  console.log("🎯 Header レンダリング:", {
    user: !!user,
    userProfile: !!userProfile,
    displayName: userProfile?.display_name || userProfile?.pokepoke_id || user?.email?.split("@")[0],
  })

  const displayName =
    userProfile?.display_name ||
    userProfile?.name ||
    userProfile?.pokepoke_id ||
    user?.email?.split("@")[0] ||
    "ユーザー"

  const avatarUrl = userProfile?.avatar_url

  useEffect(() => {
    console.log("🔔 Header 通知取得開始:", { user: !!user })
    if (user) {
      getNotifications(user.id)
        .then((result) => {
          if (result.success && result.notifications) {
            const unread = result.notifications.filter((n) => !n.is_read).length
            setUnreadCount(unread)
            console.log("📬 通知取得完了:", { unread })
          }
        })
        .catch((error) => {
          console.error("❌ 通知取得エラー:", error)
          setUnreadCount(0)
        })
    } else {
      setUnreadCount(0)
    }
  }, [user])

  const handleSignOut = async () => {
    console.log("🚪 Header ログアウトボタンクリック")
    try {
      await signOut()
      console.log("✅ Header ログアウト処理完了")
    } catch (error) {
      console.error("❌ Header ログアウト処理エラー:", error)
    }
  }

  const handlePokepokeIdSave = async (pokepokeId: string) => {
    if (!user) return
    console.log("💾 ポケポケID保存開始:", pokepokeId)
    try {
      await updateUserProfile(user.id, { pokepoke_id: pokepokeId })
      await refreshProfile()
      setIsPokepokeIdModalOpen(false)
      console.log("✅ ポケポケID保存完了")
    } catch (error) {
      console.error("❌ ポケポケIDの保存に失敗しました:", error)
    }
  }

  const handleUsernameSave = async (username: string) => {
    if (!user) return
    console.log("💾 ユーザー名保存開始:", username)
    try {
      await updateUserProfile(user.id, { display_name: username })
      await refreshProfile()
      setIsUsernameModalOpen(false)
      console.log("✅ ユーザー名保存完了")
    } catch (error) {
      console.error("❌ ユーザー名の保存に失敗しました:", error)
    }
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
            </Button>

            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-white hover:bg-white/20 rounded-full h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => router.push("/notifications")}
                  aria-label="通知"
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20"
                    >
                      <div className="relative w-6 h-6 sm:w-8 sm:h-8">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl || "/placeholder.svg"}
                            alt="アバター"
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
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsPokepokeIdModalOpen(true)}>ポケポケID登録</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsUsernameModalOpen(true)}>ユーザー名登録</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>ログアウト</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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

      <PokepokeIdRegistrationModal
        isOpen={isPokepokeIdModalOpen}
        onOpenChange={setIsPokepokeIdModalOpen}
        currentPokepokeId={userProfile?.pokepoke_id || undefined}
        onSave={handlePokepokeIdSave}
      />

      <UsernameRegistrationModal
        isOpen={isUsernameModalOpen}
        onOpenChange={setIsUsernameModalOpen}
        currentUsername={userProfile?.display_name || undefined}
        onSave={handleUsernameSave}
      />
    </>
  )
}

export default Header
