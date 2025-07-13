import type React from "react"
import { Suspense } from "react"
import { AuthHeader } from "@/components/auth-header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-violet-500">
      <AuthHeader />
      <Suspense fallback={<div>認証コンテンツを読み込み中...</div>}>{children}</Suspense>
    </div>
  )
}
