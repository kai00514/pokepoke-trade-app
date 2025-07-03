"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, User, LogOut, Settings, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { updateUserProfile } from "@/lib/services/user-service_ver2"

function Header() {
  const { user, userProfile, signOut, refreshSession } = useAuth()
  const router = useRouter()
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)

  console.log("🔍 Layout Header component - Auth state:", {
    user,
    userProfile,
    accountName: user?.email?.split("@")[0] || "Unknown",
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleUsernameRegistration = () => {
    console.log("🎯 [handleUsernameRegistration] Opening Username modal")
    setIsUsernameModalOpen(true)
  }

  const handlePokepokeIdRegistration = () => {
    console.log("🎯 [handlePokepokeIdRegistration] Opening PokepokeID modal")
    setIsPokepokeIdModalOpen(true)
  }

  const handleUsernameSave = async (username: string) => {
    console.log("🚀 [handleUsernameSave] ===== START =====")
    console.log("🚀 [handleUsernameSave] Input username:", username)

    if (!user) {
      console.error("❌ [handleUsernameSave] No user found")
      throw new Error("ユーザーが見つかりません")
    }

    try {
      console.log("🔄 [handleUsernameSave] Calling updateUserProfile...")
      const result = await updateUserProfile(user.id, {
        display_name: username,
      })

      console.log("✅ [handleUsernameSave] Update successful:", result)

      // セッション情報を更新
      console.log("🔄 [handleUsernameSave] Refreshing session...")
      await refreshSession()

      console.log("🚀 [handleUsernameSave] ===== COMPLETE =====")
    } catch (error) {
      console.error("❌ [handleUsernameSave] Error:", error)
      throw error
    }
  }

  const handlePokepokeIdSave = async (pokepokeId: string) => {
    console.log("🚀 [handlePokepokeIdSave] ===== START =====")
    console.log("🚀 [handlePokepokeIdSave] Input pokepokeId:", pokepokeId)

    if (!user) {
      console.error("❌ [handlePokepokeIdSave] No user found")
      throw new Error("ユーザーが見つかりません")
    }

    try {
      console.log("🔄 [handlePokepokeIdSave] Calling updateUserProfile...")
      const result = await updateUserProfile(user.id, {
        pokepoke_id: pokepokeId,
      })

      console.log("✅ [handlePokepokeIdSave] Update successful:", result)

      // セッション情報を更新
      console.log("🔄 [handlePokepokeIdSave] Refreshing session...")
      await refreshSession()

      console.log("🚀 [handlePokepokeIdSave] ===== COMPLETE =====")
    } catch (error) {
      console.error("❌ [handlePokepokeIdSave] Error:", error)
      throw error
    }
  }

  if (!user) {
    return (
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              PokeLink
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">ログイン</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>新規登録</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  const accountName = user.email?.split("@")[0] || "Unknown"
  const displayName = userProfile?.display_name || accountName
  const avatarUrl = userProfile?.avatar_url

  return (
    <>
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              PokeLink
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/decks" className="text-gray-600 hover:text-gray-900">
                デッキ
              </Link>
              <Link href="/trades" className="text-gray-600 hover:text-gray-900">
                トレード
              </Link>
              <Link href="/matching" className="text-gray-600 hover:text-gray-900">
                マッチング
              </Link>
              <Link href="/info" className="text-gray-600 hover:text-gray-900">
                情報
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <NotificationDropdown />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={displayName} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{displayName}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleUsernameRegistration}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>ユーザー名登録</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePokepokeIdRegistration}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>ポケポケID登録</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ログアウト</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <UsernameRegistrationModal
        isOpen={isUsernameModalOpen}
        onOpenChange={setIsUsernameModalOpen}
        currentUsername={userProfile?.display_name}
        onSave={handleUsernameSave}
      />

      <PokepokeIdRegistrationModal
        isOpen={isPokepokeIdModalOpen}
        onOpenChange={setIsPokepokeIdModalOpen}
        currentPokepokeId={userProfile?.pokepoke_id}
        onSave={handlePokepokeIdSave}
      />
    </>
  )
}

// Named export
export { Header }

// Default export for compatibility
export default Header
