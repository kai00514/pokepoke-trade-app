"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"

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

  return null
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
