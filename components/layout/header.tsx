"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"

export default function Header() {
  const { user, userProfile, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("サインアウトエラー:", error)
    }
  }

  // アカウント名の表示優先順位: display_name > name > email
  const getAccountName = () => {
    if (userProfile?.display_name) return userProfile.display_name
    if (userProfile?.name) return userProfile.name
    if (user?.email) return user.email.split("@")[0]
    return "ユーザー"
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
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
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg"} alt={getAccountName()} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{getAccountName()}</p>
                    {userProfile?.pokepoke_id && (
                      <p className="text-xs text-muted-foreground">ID: {userProfile.pokepoke_id}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>設定</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
    </header>
  )
}
