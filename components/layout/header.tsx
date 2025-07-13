"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { updateUserProfile } from "@/lib/services/user-service"

export default function Header() {
  const { user, userProfile, loading, signOut, displayName } = useAuth()
  const router = useRouter()

  // モーダルの表示状態を管理するstate
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)

  console.log("🔍 Header component - Auth state:", {
    user: user ? { id: user.id, email: user.email } : null,
    userProfile,
    loading,
    displayName,
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      console.log("✅ Signed out successfully from Header")
    } catch (error) {
      console.error("❌ Sign out error:", error)
    }
  }

  // ポケポケID登録のハンドラ
  const handlePokepokeIdRegistration = () => {
    console.log("ポケポケID登録がクリックされました。")
    setIsPokepokeIdModalOpen(true)
  }

  // ユーザー名登録のハンドラ
  const handleUsernameRegistration = () => {
    console.log("ユーザー名登録がクリックされました。")
    setIsUsernameModalOpen(true)
  }

  // ポケポケID保存のハンドラ
  const handleSavePokepokeId = async (pokepokeId: string) => {
    if (!user) {
      console.error("ユーザーが認証されていません。")
      throw new Error("ユーザーが認証されていません。")
    }
    try {
      await updateUserProfile(user.id, { pokepoke_id: pokepokeId })
      console.log("ポケポケIDが正常に保存されました。")
    } catch (error) {
      console.error("ポケポケIDの保存エラー:", error)
      throw error
    }
  }

  // ユーザー名保存のハンドラ
  const handleSaveUsername = async (username: string) => {
    if (!user) {
      console.error("ユーザーが認証されていません。")
      throw new Error("ユーザーが認証されていません。")
    }
    try {
      await updateUserProfile(user.id, { display_name: username })
      console.log("ユーザー名が正常に保存されました。")
    } catch (error) {
      console.error("ユーザー名の保存エラー:", error)
      throw error
    }
  }

  return (
    <header className="bg-violet-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/pokelink-logo.png" alt="PokeLink ロゴ" width={160} height={40} className="object-contain h-10" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {user && <NotificationDropdown />}

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
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <span className="text-white text-sm font-medium hidden sm:inline">{displayName}</span>
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
      {user && (
        <>
          <PokepokeIdRegistrationModal
            isOpen={isPokepokeIdModalOpen}
            onOpenChange={setIsPokepokeIdModalOpen}
            currentPokepokeId={userProfile?.pokepoke_id || ""}
            onSave={handleSavePokepokeId}
          />
          <UsernameRegistrationModal
            isOpen={isUsernameModalOpen}
            onOpenChange={setIsUsernameModalOpen}
            currentUsername={userProfile?.display_name || ""}
            onSave={handleSaveUsername}
          />
        </>
      )}
    </header>
  )
}
