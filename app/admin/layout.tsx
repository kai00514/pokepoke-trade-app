"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Toaster } from "@/components/ui/sonner"
import { supabase } from "@/lib/supabase/client"
import { Shield } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user?.email) {
          router.push("/admin/login")
          return
        }

        // 管理者権限チェック
        const { data: isAdmin, error } = await supabase.rpc("is_admin_user", { user_email: session.user.email })

        if (error || !isAdmin) {
          router.push("/admin/login?error=unauthorized")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/admin/login?error=auth_failed")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/admin/login")
      } else if (event === "SIGNED_IN" && session.user?.email) {
        // 再度管理者権限をチェック
        const { data: isAdmin } = await supabase.rpc("is_admin_user", { user_email: session.user.email })

        if (!isAdmin) {
          await supabase.auth.signOut()
          router.push("/admin/login?error=unauthorized")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

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

  if (!isAuthorized) {
    return null // リダイレクト中
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
