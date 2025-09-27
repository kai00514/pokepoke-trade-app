"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Toaster } from "@/components/ui/sonner"
import { supabase } from "@/lib/supabase/client"
import { Shield } from "lucide-react"
import { getAdminSession } from "@/lib/auth/admin-session"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
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

        const session = await getAdminSession()

        if (!session) {
          console.log("No session found, redirecting to login")
          router.push("/admin/login")
          return
        }

        // 管理者権限チェック
        console.log("Checking admin permissions for:", session.user.email)
        const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin_user", {
          user_email: session.user.email,
        })

        console.log("Admin check result:", { isAdmin, adminError })

        if (adminError) {
          console.error("Admin check error:", adminError)
          router.push("/admin/login?error=auth_failed")
          return
        }

        if (!isAdmin) {
          console.log("User is not admin, redirecting to login")
          // 一般ユーザーの場合は管理者セッションをクリア
          await supabase.auth.signOut()
          router.push("/admin/login?error=unauthorized")
          return
        }

        console.log("User is authorized admin")
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
      console.log("Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_OUT" || !session) {
        console.log("User signed out, redirecting to login")
        setIsAuthorized(false)
        if (pathname !== "/admin/login") {
          router.push("/admin/login")
        }
      } else if (event === "SIGNED_IN" && session.user?.email) {
        // ログインページ以外で再度管理者権限をチェック
        if (pathname !== "/admin/login") {
          console.log("User signed in, checking admin permissions")
          const { data: isAdmin, error } = await supabase.rpc("is_admin_user", {
            user_email: session.user.email,
          })

          if (error || !isAdmin) {
            console.log("User is not admin after sign in")
            await supabase.auth.signOut()
            router.push("/admin/login?error=unauthorized")
          } else {
            setIsAuthorized(true)
          }
        }
      }
    })

    return () => subscription.unsubscribe()
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

  if (!isAuthorized) {
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
