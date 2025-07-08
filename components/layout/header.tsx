"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Bell, User, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { getNotifications } from "@/lib/services/notification-service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { updateUserProfile } from "@/lib/services/user-service"
import { Skeleton } from "@/components/ui/skeleton"

const HeaderComponent = () => {
  const { user, userProfile, isLoading, signOut, refreshProfile } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const router = useRouter()

  const displayName = useMemo(() => {
    return userProfile?.display_name || userProfile?.name || user?.email?.split("@")[0] || "ユーザー"
  }, [userProfile, user])

  const avatarUrl = userProfile?.avatar_url

  useEffect(() => {
    if (user?.id) {
      getNotifications(user.id)
        .then((result) => {
          if (result.success && result.notifications) {
            setUnreadCount(result.notifications.filter((n) => !n.is_read).length)
          }
        })
        .catch(() => setUnreadCount(0))
    } else {
      setUnreadCount(0)
    }
  }, [user?.id])

  const handleProfileUpdate = useCallback(async () => {
    await refreshProfile()
  }, [refreshProfile])

  const AuthSection = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      )
    }

    if (user && userProfile) {
      return (
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
                className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20 h-10"
              >
                <div className="relative w-8 h-8">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl || "/placeholder.svg"}
                      alt="アバター"
                      layout="fill"
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-white text-sm font-medium hidden sm:inline">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsPokepokeIdModalOpen(true)}>ポケポケID登録</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsUsernameModalOpen(true)}>ユーザー名登録</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>ログアウト</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    }

    return (
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
            </Button>
            <AuthSection />
          </div>
        </div>
      </header>

      <PokepokeIdRegistrationModal
        isOpen={isPokepokeIdModalOpen}
        onOpenChange={setIsPokepokeIdModalOpen}
        currentPokepokeId={userProfile?.pokepoke_id || undefined}
        onSave={async (id) => {
          await updateUserProfile(user!.id, { pokepoke_id: id })
          await handleProfileUpdate()
          setIsPokepokeIdModalOpen(false)
        }}
      />
      <UsernameRegistrationModal
        isOpen={isUsernameModalOpen}
        onOpenChange={setIsUsernameModalOpen}
        currentUsername={userProfile?.display_name || undefined}
        onSave={async (name) => {
          await updateUserProfile(user!.id, { display_name: name })
          await handleProfileUpdate()
          setIsUsernameModalOpen(false)
        }}
      />
    </>
  )
}

export default memo(HeaderComponent)
