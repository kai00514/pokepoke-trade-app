"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { updateUserProfile } from "@/lib/services/user-service"
import { MessageCircle } from "lucide-react"

export default function Header() {
  const { user, userProfile, loading, signOut, displayName } = useAuth()
  const router = useRouter()

  // モーダルの表示状態を管理するstate
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {}
  }

  // ポケポケID登録のハンドラ
  const handlePokepokeIdRegistration = () => {
    setIsPokepokeIdModalOpen(true)
  }

  // ユーザー名登録のハンドラ
  const handleUsernameRegistration = () => {
    setIsUsernameModalOpen(true)
  }

  // お問い合わせのハンドラ
  const handleContactClick = () => {
    router.push("/contact")
  }

  // ポケポケID保存のハンドラ
  const handleSavePokepokeId = async (pokepokeId: string) => {
    if (!user) {
      throw new Error("ユーザーが認証されていません。")
    }
    try {
      await updateUserProfile(user.id, { pokepoke_id: pokepokeId })
    } catch (error) {
      throw error
    }
  }

  // ユーザー名保存のハンドラ
  const handleSaveUsername = async (username: string) => {
    if (!user) {
      throw new Error("ユーザーが認証されていません。")
    }
    try {
      await updateUserProfile(user.id, { display_name: username })
    } catch (error) {
      throw error
    }
  }

  return (
    <header className="relative overflow-hidden text-white shadow-md border-b border-white/10 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/pokelink-logo.png" alt="PokeLink ロゴ" width={192} height={48} className="object-contain h-12" />
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePokepokeIdRegistration}>ポケポケID登録</DropdownMenuItem>
                <DropdownMenuItem onClick={handleUsernameRegistration}>ユーザー名登録</DropdownMenuItem>
                <DropdownMenuItem onClick={handleContactClick}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  お問い合わせ
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>ログアウト</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth/signup">
                <Button
                  variant="default"
                  className="bg-white text-[#1D4ED8] hover:bg-[#DBEAFE] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  新規登録
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="bg-white text-[#1D4ED8] border-[#1D4ED8] hover:bg-[#DBEAFE] hover:text-[#1E40AF] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
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
