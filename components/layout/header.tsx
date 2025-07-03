"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Bell, User, LogOut, Settings, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"

export function Header() {
  const { user, userProfile, accountName, loading } = useAuth()
  const router = useRouter()
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)

  console.log("🔍 Layout Header component - Auth state:", { user, userProfile, accountName })

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleUsernameRegistration = () => {
    console.log("🎯 [handleUsernameRegistration] Opening Username modal")
    setIsUsernameModalOpen(true)
  }

  const handlePokepokeIdRegistration = () => {
    console.log("🎯 [handlePokepokeIdRegistration] Opening PokepokeID modal")
    setIsPokepokeIdModalOpen(true)
  }

  const handleModalSuccess = () => {
    // モーダル成功時の処理（必要に応じて認証コンテキストを更新）
    console.log("🎉 Modal operation successful")
    // 必要に応じてユーザープロファイルを再取得
    window.location.reload() // 簡単な方法として画面をリロード
  }

  if (loading) {
    return (
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              PokeLink
            </Link>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              PokeLink
            </Link>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userProfile?.avatar_url || ""} alt={accountName} />
                          <AvatarFallback>{accountName ? accountName.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{accountName}</p>
                          <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleUsernameRegistration}>
                        <User className="mr-2 h-4 w-4" />
                        <span>ユーザー名を設定</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={handlePokepokeIdRegistration}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>PokepokeIDを設定</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>設定</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>ログアウト</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link href="/auth/login">ログイン</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/signup">新規登録</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <UsernameRegistrationModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <PokepokeIdRegistrationModal
        isOpen={isPokepokeIdModalOpen}
        onClose={() => setIsPokepokeIdModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  )
}

// 既存のnamed export

// default exportを追加
export default Header
