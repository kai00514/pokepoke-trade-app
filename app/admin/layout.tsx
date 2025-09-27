"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Toaster } from "@/components/ui/sonner"
import { Shield } from "lucide-react"
import { checkAdminSession, type AdminSession } from "@/lib/auth/admin-session"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<AdminSession | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ログインページの場合は認証チェックをスキップ
        if (pathname === "/admin/login") {
          setIsLoading(false)
          return
        }

        const adminSession = await checkAdminSession()

        if (!adminSession) {
          console.log("No session found, redirecting to login")
          router.push("/admin/login")
          return
        }

        console.log("User is authorized admin:", adminSession.user.username)
        setSession(adminSession)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/admin/login?error=auth_failed")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  // ログインページの場合は認証チェックなしで表示
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Shield className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <p className="text-gray-600">認証確認中...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <p className="text-gray-600">認証中...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
