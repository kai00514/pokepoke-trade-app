"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { Loader2 } from "lucide-react"

export function Header() {
  const { user, userProfile, isLoading, updateUserProfile, signOut } = useAuth()
  const [isPokepokeIdModalOpen, setPokepokeIdModalOpen] = useState(false)
  const [isUsernameModalOpen, setUsernameModalOpen] = useState(false)

  const handlePokepokeIdSave = async (pokepokeId: string) => {
    await updateUserProfile({ pokepoke_id: pokepokeId })
  }

  const handleUsernameSave = async (username: string) => {
    await updateUserProfile({ display_name: username })
  }

  if (isLoading) {
    return (
      <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold">
            ポケポケトレード
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold">
            ポケポケトレード
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.avatar_url || "/placeholder-user.jpg"} alt="User avatar" />
                    <AvatarFallback>{userProfile?.display_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.display_name || "未設定"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setUsernameModalOpen(true)}>ユーザー名登録</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPokepokeIdModalOpen(true)}>ポケポケID登録</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>ログアウト</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button>ログイン</Button>
            </Link>
          )}
        </div>
      </header>

      <PokepokeIdRegistrationModal
        isOpen={isPokepokeIdModalOpen}
        onOpenChange={setPokepokeIdModalOpen}
        currentPokepokeId={userProfile?.pokepoke_id}
        onSave={handlePokepokeIdSave}
      />

      <UsernameRegistrationModal
        isOpen={isUsernameModalOpen}
        onOpenChange={setUsernameModalOpen}
        currentUsername={userProfile?.display_name}
        onSave={handleUsernameSave}
      />
    </>
  )
}

export default Header
