import type { ReactNode } from "react"
import { AuthHeader } from "@/components/auth-header"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-blue-50">
      {/* ヘッダーは透明背景。下地の薄い青がそのまま出ます */}
      <AuthHeader />
      <main>{children}</main>
    </div>
  )
}
