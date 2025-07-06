"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, UserIcon, Settings } from "lucide-react"
import { NotificationDropdown } from "./notification-dropdown"

export function AuthHeader() {
  const { session, signOut } = useAuth()

  console.log("🎯 AuthHeader レンダリング:", { session: !!session })

  const handleSignOut = async () => {
    console.log("🚪 AuthHeader ログアウトボタンクリック")
    try {
      await signOut()
      console.log("✅ AuthHeader ログアウト処理完了")
    } catch (error) {
      console.error("❌ AuthHeader ログアウト処理エラー:", error)
    }
  }

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b shrink-0 md:px-6">
      <Link className="flex items-center gap-2 text-lg font-semibold md:text-base" href="/">
        <Package2Icon className="w-6 h-6" />
        <span className="sr-only">Pokepoke Trade</span>
      </Link>
      <div className="flex items-center gap-4 md:gap-2 lg:gap-4">
        {session ? (
          <>
            <NotificationDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.user_metadata?.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback>
                      {session.user?.email?.[0]?.toUpperCase() || <UserIcon className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">ユーザーメニューを開く</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/profile" className="flex items-center w-full">
                    <UserIcon className="mr-2 h-4 w-4" />
                    プロフィール
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    設定
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button asChild>
              <Link href="/auth/login">ログイン</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  )
}

function Package2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9Z" />
      <path d="m3 9 9 6 9-6" />
      <path d="M21 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4" />
    </svg>
  )
}
