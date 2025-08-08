import type { ReactNode } from "react"
import AuthHeader from "@/components/auth-header"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white">
      <AuthHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
